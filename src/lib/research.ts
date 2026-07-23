import { createChatCompletion } from "@/lib/llm";
import {
  getCachedLegalResearch,
  saveLegalResearchCache,
} from "@/lib/research-cache";
import { searchLegalCorpus } from "@/lib/legal-corpus";

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
  const configured = effort === "exhaustive"
    ? Number(process.env.YOU_RESEARCH_EXHAUSTIVE_TIMEOUT_MS || 240_000)
    : effort === "deep"
      ? Number(process.env.YOU_RESEARCH_DEEP_TIMEOUT_MS || 150_000)
      : Number(process.env.YOU_RESEARCH_STANDARD_TIMEOUT_MS || 90_000);
  // /api/analyze is a synchronous request behind a proxy. Do not let a
  // multi-minute research job consume the whole request window.
  return Math.min(configured, Number(process.env.YOU_RESEARCH_SYNC_TIMEOUT_MS || 20_000));
}

function researchEffortRank(effort: ResearchEffort) {
  return { standard: 1, deep: 2, exhaustive: 3 }[effort];
}

function capSynchronousEffort(effort: ResearchEffort) {
  const configured = normalizeEffort(process.env.YOU_RESEARCH_SYNC_MAX_EFFORT || "standard");
  return researchEffortRank(effort) <= researchEffortRank(configured) ? effort : configured;
}

function compactContract(text: string) {
  return text.slice(0, 5000);
}

async function chooseResearchPlan(contractText: string, plan: ResearchPlan): Promise<{ effort: ResearchEffort; query: string }> {
  const t0 = Date.now();
  const fallback = {
    effort: capSynchronousEffort("standard"),
    query: withOfficialSourceInstruction(
      "aturan hukum Indonesia terbaru terkait klausul kontrak, denda, pemutusan sepihak, perlindungan konsumen, dan pelindungan data pribadi",
    ),
  };
  try {
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
    ], AbortSignal.timeout(Number(process.env.YOU_RESEARCH_PLANNER_TIMEOUT_MS || 8_000)), "research_planner");
    console.log(`[TIMING] research_planner: ${Date.now() - t0}ms | plan=${plan}`);
    const parsed = parseJson(completion.content);
    const effort = capSynchronousEffort(capEffortForPlan(normalizeEffort(parsed?.research_effort), plan));
    console.log(`[TIMING] research_planner_effort: chosen=${parsed?.research_effort} capped=${effort} plan=${plan}`);
    return {
      effort,
      query: withOfficialSourceInstruction(
        typeof parsed?.query === "string" && parsed.query.trim()
          ? parsed.query.trim()
          : fallback.query,
      ),
    };
  } catch (error) {
    console.log(`[TIMING] research_planner FALLBACK: ${Date.now() - t0}ms | reason=${(error as Error).message.slice(0, 120)}`);
    return fallback;
  }
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

  const tResearch0 = Date.now();
  console.log(`[TIMING] research_phase START | plan=${plan}`);

  try {
    // The local legal corpus is the fast research path. Search it before the
    // planner so common contract issues do not wait for a second LLM call.
    const directLocalCorpus = await searchLegalCorpus(compactContract(contractText));
    if (directLocalCorpus && directLocalCorpus.confidence !== "low") {
      console.log(`[TIMING] legal_corpus DIRECT HIT: ${directLocalCorpus.latencyMs}ms | confidence=${directLocalCorpus.confidence}`);
      return {
        enabled: true,
        effort: "standard",
        query: directLocalCorpus.query,
        content: `Database pasal lokal sebagai sumber utama:\n\n${directLocalCorpus.content}`,
        sources: directLocalCorpus.sources,
        latencyMs: directLocalCorpus.latencyMs,
        warning: "Konteks hukum diambil dari database pasal lokal; planner dan You.com tidak dipanggil karena confidence cukup.",
      };
    }

    if (!apiKey) return { enabled: false, warning: "YOU_API_KEY belum dikonfigurasi." };

    const researchPlan = await chooseResearchPlan(contractText, plan);
    const tPlannerDone = Date.now();
    console.log(`[TIMING] research_planner_total: ${tPlannerDone - tResearch0}ms | effort=${researchPlan.effort}`);

    const localCorpus = await searchLegalCorpus(`${researchPlan.query}\n\n${compactContract(contractText)}`);
    if (localCorpus && localCorpus.confidence !== "low") {
      console.log(`[TIMING] legal_corpus HIT: ${localCorpus.latencyMs}ms | confidence=${localCorpus.confidence}`);
      return {
        enabled: true,
        effort: researchPlan.effort,
        query: researchPlan.query,
        content: `Database pasal lokal sebagai sumber utama:\n\n${localCorpus.content}`,
        sources: localCorpus.sources,
        latencyMs: localCorpus.latencyMs,
        warning: "Konteks hukum diambil dari database pasal lokal; You.com tidak dipanggil karena confidence cukup.",
      };
    }

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
