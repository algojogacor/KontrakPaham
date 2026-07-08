import { db } from "@/lib/db";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<Record<string, unknown>>;
}

export interface ChatCompletionResult {
  content: string;
  model: string;
  provider: string;
}

export interface ProviderConfig {
  id?: string;
  name: string;
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  enabled: boolean;
  priority: number;
  useJsonResponse: boolean;
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
}

export interface ProviderTestResult {
  ok: boolean;
  status?: number | string;
  latencyMs: number;
  model?: string;
  message: string;
  sample?: string;
}

function cleanBaseUrl(url: string) {
  return url.replace(/\/+$/, "");
}

function envProvider(): ProviderConfig[] {
  const providers: ProviderConfig[] = [];
  if (process.env.LLM_API_KEY && process.env.LLM_BASE_URL && process.env.LLM_MODEL) {
    providers.push({
      name: process.env.LLM_PROVIDER || "Primary env",
      provider: process.env.LLM_PROVIDER || "primary",
      baseUrl: cleanBaseUrl(process.env.LLM_BASE_URL),
      apiKey: process.env.LLM_API_KEY,
      model: process.env.LLM_MODEL,
      enabled: true,
      priority: 100,
      useJsonResponse: true,
      maxTokens: Number(process.env.LLM_MAX_TOKENS || 4096),
      temperature: Number(process.env.LLM_TEMPERATURE || 0.1),
      timeoutMs: Number(process.env.LLM_TIMEOUT_MS || 90_000),
    });
  }
  if (process.env.LLM_FALLBACK_API_KEY && process.env.LLM_FALLBACK_BASE_URL && process.env.LLM_FALLBACK_MODEL) {
    providers.push({
      name: process.env.LLM_FALLBACK_PROVIDER || "Fallback env",
      provider: process.env.LLM_FALLBACK_PROVIDER || "fallback",
      baseUrl: cleanBaseUrl(process.env.LLM_FALLBACK_BASE_URL),
      apiKey: process.env.LLM_FALLBACK_API_KEY,
      model: process.env.LLM_FALLBACK_MODEL,
      enabled: true,
      priority: 110,
      useJsonResponse: true,
      maxTokens: Number(process.env.LLM_MAX_TOKENS || 4096),
      temperature: Number(process.env.LLM_TEMPERATURE || 0.1),
      timeoutMs: Number(process.env.LLM_TIMEOUT_MS || 90_000),
    });
  }
  return providers;
}

// In-process provider cache — TTL 5 minutes.
// Avoids Turso DB round-trip (~50-150ms) on every analyzeContract() call.
let _providerCache: { providers: ProviderConfig[]; expiresAt: number } | null = null;
const PROVIDER_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/** Clear the provider cache (e.g. after admin edits a provider). */
export function invalidateProviderCache() {
  _providerCache = null;
}

export async function getActiveProviders(): Promise<ProviderConfig[]> {
  const now = Date.now();
  if (_providerCache && _providerCache.expiresAt > now) {
    return _providerCache.providers;
  }

  const rows = await db.llmProvider.findMany({
    where: { enabled: true },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
  });
  const providers: ProviderConfig[] = rows.length === 0 ? envProvider() : rows.map((r) => ({
    id: r.id,
    name: r.name,
    provider: r.provider,
    baseUrl: cleanBaseUrl(r.baseUrl),
    apiKey: r.apiKey,
    model: r.model,
    enabled: r.enabled,
    priority: r.priority,
    useJsonResponse: r.useJsonResponse,
    maxTokens: r.maxTokens,
    temperature: r.temperature,
    timeoutMs: r.timeoutMs,
  }));

  _providerCache = { providers, expiresAt: now + PROVIDER_CACHE_TTL_MS };
  return providers;
}

async function callProvider(
  provider: ProviderConfig,
  messages: ChatMessage[],
  signal?: AbortSignal,
  attemptLabel?: string,
): Promise<ChatCompletionResult> {
  const timeoutSignal = AbortSignal.timeout(provider.timeoutMs);
  const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
  const body: Record<string, unknown> = {
    model: provider.model,
    messages,
    temperature: provider.temperature,
    max_tokens: provider.maxTokens,
  };
  if (provider.useJsonResponse) {
    body.response_format = { type: "json_object" };
  }

  const t0 = Date.now();
  const res = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify(body),
    signal: combinedSignal,
  });
  const httpMs = Date.now() - t0;

  if (!res.ok) {
    const bodyText = await res.text();
    console.log(`[TIMING] llm_call FAILED: ${httpMs}ms | provider=${provider.name} | model=${provider.model}${attemptLabel ? ` | ${attemptLabel}` : ""} | status=${res.status}`);
    throw new Error(`${provider.name} ${res.status}: ${bodyText.slice(0, 240)}`);
  }

  const t1 = Date.now();
  const json = await res.json();
  const parseMs = Date.now() - t1;
  const content = json?.choices?.[0]?.message?.content;
  if (!content) {
    console.log(`[TIMING] llm_call EMPTY: ${httpMs}ms | provider=${provider.name} | model=${provider.model}${attemptLabel ? ` | ${attemptLabel}` : ""}`);
    throw new Error(`${provider.name}: respons AI kosong`);
  }

  console.log(`[TIMING] llm_call OK: http=${httpMs}ms json_parse=${parseMs}ms total=${Date.now() - t0}ms | provider=${provider.name} | model=${provider.model}${attemptLabel ? ` | ${attemptLabel}` : ""}`);

  return {
    content: typeof content === "string" ? content : JSON.stringify(content),
    model: json?.model || provider.model,
    provider: provider.name,
  };
}

export async function createChatCompletion(
  messages: ChatMessage[],
  signal?: AbortSignal,
  label = "llm",
): Promise<ChatCompletionResult> {
  const t0 = Date.now();
  const providers = await getActiveProviders();
  const providerFetchMs = Date.now() - t0;
  if (providerFetchMs > 5) {
    // Only log if it took meaningful time (DB fetch vs cache)
    console.log(`[TIMING] get_providers: ${providerFetchMs}ms | label=${label} | count=${providers.length}`);
  }
  if (providers.length === 0) {
    throw new Error("Belum ada provider LLM aktif.");
  }

  let lastError: Error | null = null;
  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    const attemptLabel = `label=${label} providerIdx=${i + 1}/${providers.length}`;
    try {
      const result = await callProvider(provider, messages, signal, attemptLabel);
      console.log(`[TIMING] createChatCompletion DONE: ${Date.now() - t0}ms | label=${label} | winner=${provider.name}`);
      return result;
    } catch (e) {
      lastError = e as Error;
      console.log(`[TIMING] provider_fallback: provider=${provider.name} | label=${label} | error=${(e as Error).message.slice(0, 120)}`);
    }
  }

  throw lastError || new Error("Semua provider LLM gagal.");
}

export async function listModels(baseUrl: string, apiKey: string) {
  const started = Date.now();
  const res = await fetch(`${cleanBaseUrl(baseUrl)}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(30_000),
  });
  const latencyMs = Date.now() - started;
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`/models ${res.status}: ${body.slice(0, 240)}`);
  }
  const json = await res.json();
  const models = Array.isArray(json?.data) ? json.data.map((m: any) => String(m.id)).filter(Boolean) : [];
  return { models, latencyMs };
}

export async function testProvider(provider: ProviderConfig): Promise<ProviderTestResult> {
  const started = Date.now();
  try {
    const result = await callProvider(provider, [
      { role: "system", content: "Jawab hanya JSON valid dalam Bahasa Indonesia." },
      {
        role: "user",
        content: 'Analisis klausul: Penyewa telat bayar dikenakan denda 2% per hari. Balas JSON {"risk":"...","reason":"..."}.',
      },
    ]);
    return {
      ok: true,
      status: 200,
      latencyMs: Date.now() - started,
      model: result.model,
      message: "Chat completion berhasil.",
      sample: result.content.slice(0, 240),
    };
  } catch (e) {
    return {
      ok: false,
      status: "ERR",
      latencyMs: Date.now() - started,
      message: (e as Error).message,
    };
  }
}
