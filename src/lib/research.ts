import { createChatCompletion } from "@/lib/llm";
import {
  getCachedLegalResearch,
  saveLegalResearchCache,
} from "@/lib/research-cache";

export type ResearchEffort = "standard" | "deep" | "exhaustive";
export type ResearchPlan = "FREE" | "LITE" | "PRO" | "ADMIN" | string;

export interface LegalResearchContext {
  enabled: boolean;
  effort?: ResearchEffort;
  query?: string;
  content?: string;
  sources?: ResearchSource[];
  warning?: string;
  latencyMs?: number;
}

export interface ResearchSource {
  title: string;
  url: string;
}

const ALLOWED_EFFORTS: ResearchEffort[] = ["standard", "deep", "exhaustive"];
const OFFICIAL_SOURCE_HOSTS = [
  "peraturan.bpk.go.id",
  "jdih.go.id",
  "jdihn.go.id",
  "ojk.go.id",
  "bi.go.id",
  "komdigi.go.id",
  "setneg.go.id",
  "mahkamahagung.go.id",
  "mkri.id",
];

function parseJson(text: string): any {
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  }
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first === -1 || last === -1) return null;
  try {
    return JSON.parse(t.slice(first, last + 1));
  } catch {
    return null;
  }
}

function normalizeEffort(value: unknown): ResearchEffort {
  const effort = String(value || "").toLowerCase();
  return ALLOWED_EFFORTS.includes(effort as ResearchEffort) ? (effort as ResearchEffort) : "standard";
}

function capEffortForPlan(effort: ResearchEffort, plan: ResearchPlan): ResearchEffort {
  if (plan === "ADMIN" || plan === "PRO") return effort;
  if (plan === "LITE") return effort === "exhaustive" ? "deep" : effort;
  return "standard";
}

function effortTimeoutMs(effort: ResearchEffort) {
  if (effort === "exhaustive") return Number(process.env.YOU_RESEARCH_EXHAUSTIVE_TIMEOUT_MS || 240_000);
  if (effort === "deep") return Number(process.env.YOU_RESEARCH_DEEP_TIMEOUT_MS || 150_000);
  return Number(process.env.YOU_RESEARCH_STANDARD_TIMEOUT_MS || 90_000);
}

function compactContract(text: string) {
  return text.slice(0, 5000);
}

async function chooseResearchPlan(contractText: string, plan: ResearchPlan): Promise<{ effort: ResearchEffort; query: string }> {
  const t0 = Date.now();
  const completion = await createChatCompletion([
    {
      role: "system",
      content:
        "Anda memilih kebutuhan riset hukum terkini untuk analisis kontrak Indonesia. Balas hanya JSON valid. research_effort hanya boleh: standard, deep, exhaustive. Jangan pernah pilih ulow atau lite. FREE selalu standard. LITE maksimal deep. PRO/ADMIN boleh exhaustive bila benar-benar perlu.",
    },
    {
      role: "user",
      content: `Kontrak berikut akan dianalisis. Paket user: ${plan}. Tentukan research_effort dan query riset hukum yang paling berguna.

Aturan:
- standard: isu kontrak umum, cukup cek aturan/praktik umum.
- deep: banyak klausul berisiko, nilai besar, sektor spesifik, atau perlu sumber hukum lebih kuat.
- exhaustive: hanya jika butuh cakupan sangat luas/terbaru lintas aturan atau dampak sangat tinggi.
- Query wajib meminta sumber resmi pemerintah/otoritas Indonesia lebih dulu:
  peraturan.bpk.go.id, JDIH/JDIHN, OJK, BI, Komdigi, Setneg, MA/MK, atau domain .go.id resmi.
- Blog hukum boleh hanya sebagai pembanding, bukan dasar utama.

Balas JSON:
{"research_effort":"standard|deep|exhaustive","query":"query riset hukum Indonesia yang spesifik"}

KONTRAK:
${compactContract(contractText)}`,
    },
  ], undefined, "research_planner");
  console.log(`[TIMING] research_planner: ${Date.now() - t0}ms | plan=${plan}`);
  const parsed = parseJson(completion.content);
  const effort = capEffortForPlan(normalizeEffort(parsed?.research_effort), plan);
  console.log(`[TIMING] research_planner_effort: chosen=${parsed?.research_effort} capped=${effort} plan=${plan}`);
  return {
    effort,
    query: withOfficialSourceInstruction(
      typeof parsed?.query === "string" && parsed.query.trim()
        ? parsed.query.trim()
        : "aturan hukum Indonesia terbaru terkait klausul kontrak, denda, pemutusan sepihak, dan perlindungan konsumen",
    ),
  };
}

function withOfficialSourceInstruction(query: string) {
  return `${query.slice(0, 520)}. Prioritaskan sumber resmi pemerintah/otoritas Indonesia: peraturan.bpk.go.id, JDIH/JDIHN, OJK, BI, Komdigi, Setneg, MA/MK, atau domain .go.id resmi. Sertakan URL sumber resmi bila tersedia.`;
}

function extractResearchContent(json: any): string {
  const content = json?.output?.content ?? json?.content ?? json?.answer ?? json?.output;
  if (typeof content === "string") return content;
  return JSON.stringify(json?.output ?? json).slice(0, 8000);
}

function isOfficialSource(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    return OFFICIAL_SOURCE_HOSTS.some((officialHost) => host === officialHost || host.endsWith(`.${officialHost}`));
  } catch {
    return false;
  }
}

function extractOfficialSources(json: any): ResearchSource[] {
  const rawSources = Array.isArray(json?.output?.sources) ? json.output.sources : [];
  const seen = new Set<string>();
  return rawSources
    .map((source: any) => ({
      title: String(source?.title || "Sumber resmi").slice(0, 180),
      url: String(source?.url || ""),
    }))
    .filter((source: ResearchSource) => source.url && isOfficialSource(source.url))
    .filter((source: ResearchSource) => {
      if (seen.has(source.url)) return false;
      seen.add(source.url);
      return true;
    })
    .slice(0, 8);
}

function buildResearchContextText(content: string, sources: ResearchSource[]) {
  const sourceText = sources.length
    ? `\n\nSumber resmi terdeteksi:\n${sources.map((source, index) => `${index + 1}. ${source.title} - ${source.url}`).join("\n")}`
    : "\n\nSumber resmi terdeteksi: belum ada URL resmi yang bisa diverifikasi dari respons You.com. Gunakan riset ini dengan hati-hati.";
  return `${content}${sourceText}`;
}

export async function buildLegalResearchContext(contractText: string, plan: ResearchPlan = "FREE"): Promise<LegalResearchContext> {
  if (process.env.YOU_RESEARCH_ENABLED === "false") return { enabled: false };
  const apiKey = process.env.YOU_API_KEY;
  if (!apiKey) return { enabled: false, warning: "YOU_API_KEY belum dikonfigurasi." };

  const tResearch0 = Date.now();
  console.log(`[TIMING] research_phase START | plan=${plan}`);

  try {
    const researchPlan = await chooseResearchPlan(contractText, plan);
    const tPlannerDone = Date.now();
    console.log(`[TIMING] research_planner_total: ${tPlannerDone - tResearch0}ms | effort=${researchPlan.effort}`);

    const cached = await getCachedLegalResearch(researchPlan);
    if (cached) {
      console.log(`[TIMING] legal_reference_cache HIT: ${Date.now() - tResearch0}ms | effort=${researchPlan.effort}`);
      return cached;
    }
    console.log(`[TIMING] legal_reference_cache MISS | effort=${researchPlan.effort}`);

    const started = Date.now();
    console.log(`[TIMING] you_com_fetch START | effort=${researchPlan.effort} | timeoutMs=${effortTimeoutMs(researchPlan.effort)}`);
    const res = await fetch(process.env.YOU_RESEARCH_URL || "https://api.you.com/v1/research", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({
        input: researchPlan.query,
        research_effort: researchPlan.effort,
      }),
      signal: AbortSignal.timeout(effortTimeoutMs(researchPlan.effort)),
    });

    const latencyMs = Date.now() - started;
    console.log(`[TIMING] you_com_fetch DONE: ${latencyMs}ms | status=${res.status} | effort=${researchPlan.effort}`);

    if (!res.ok) {
      const body = await res.text();
      console.log(`[TIMING] research_phase FAILED: ${Date.now() - tResearch0}ms | reason=you_com_${res.status}`);
      return {
        enabled: true,
        effort: researchPlan.effort,
        query: researchPlan.query,
        warning: `You.com research gagal (${res.status}): ${body.slice(0, 180)}`,
        latencyMs,
      };
    }

    const tParse0 = Date.now();
    const json = await res.json();
    console.log(`[TIMING] you_com_parse: ${Date.now() - tParse0}ms`);
    const sources = extractOfficialSources(json);
    const content = buildResearchContextText(extractResearchContent(json), sources).slice(0, 9000);
    await saveLegalResearchCache({
      query: researchPlan.query,
      effort: researchPlan.effort,
      content,
      sources,
      latencyMs,
    }).catch((cacheError) => {
      console.log(`[TIMING] legal_reference_cache SAVE_FAILED: ${(cacheError as Error).message.slice(0, 120)}`);
    });
    console.log(`[TIMING] research_phase DONE: ${Date.now() - tResearch0}ms | official_sources=${sources.length}`);
    return {
      enabled: true,
      effort: researchPlan.effort,
      query: researchPlan.query,
      content,
      sources,
      latencyMs,
    };
  } catch (e) {
    console.log(`[TIMING] research_phase ERROR: ${Date.now() - tResearch0}ms | error=${(e as Error).message.slice(0, 120)}`);
    return {
      enabled: true,
      warning: `You.com research dilewati: ${(e as Error).message}`,
    };
  }
}
