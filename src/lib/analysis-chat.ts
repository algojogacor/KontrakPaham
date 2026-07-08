import { createChatCompletion, type ChatMessage } from "@/lib/llm";

export interface AnalysisChatMessageDto {
  id: string;
  role: "user" | "assistant";
  content: string;
  modelUsed?: string | null;
  createdAt: string;
}

export interface AnalysisChatDb {
  analysis: {
    findFirst(args: unknown): Promise<any>;
  };
  analysisChatThread: {
    findFirst(args: unknown): Promise<any>;
    create(args: unknown): Promise<any>;
    update(args: unknown): Promise<any>;
  };
  analysisChatMessage: {
    findMany(args: unknown): Promise<any[]>;
    create(args: unknown): Promise<any>;
  };
}

export type ChatCompleteFn = (
  messages: ChatMessage[],
) => Promise<{ content: string; provider: string; model: string }>;

const SYSTEM_PROMPT = `Anda adalah Asisten Tanya Lanjutan KontrakPaham: seorang legal educator senior Indonesia yang membantu pengguna memahami hasil analisis kontrak mereka.

Persona dan batas kerja:
- Jawab dalam Bahasa Indonesia yang jelas, tenang, dan praktis untuk masyarakat awam.
- Gunakan konteks analisis, temuan klausul, dan riset hukum yang diberikan. Jangan mengarang isi kontrak yang tidak ada di konteks.
- Boleh membantu menyusun pertanyaan klarifikasi, opsi negosiasi, checklist, dan konsekuensi praktis.
- Jika pertanyaan menyentuh risiko besar, sengketa, tanda tangan final, pidana, pajak, atau posisi hukum yang bergantung dokumen lengkap, arahkan pengguna untuk konsultasi advokat resmi.
- Jangan mengaku sebagai advokat pengguna. Tetap edukatif, objektif, dan berbasis konteks.
- Jika konteks tidak cukup, katakan bagian mana yang belum cukup dan minta pengguna unggah/analisis dokumen terkait.

Gaya jawaban:
- Langsung jawab pertanyaan.
- Gunakan bullet singkat bila membantu.
- Akhiri dengan 1 pertanyaan follow-up yang paling berguna, kecuali pengguna meminta draf final.`;

function toDto(message: any): AnalysisChatMessageDto {
  return {
    id: String(message.id),
    role: message.role === "assistant" ? "assistant" : "user",
    content: String(message.content || ""),
    modelUsed: message.modelUsed ?? null,
    createdAt: message.createdAt instanceof Date ? message.createdAt.toISOString() : String(message.createdAt),
  };
}

function buildContext(analysis: any) {
  const findings = (analysis.findings || [])
    .slice(0, 12)
    .map((finding: any, index: number) => {
      return `Temuan #${index + 1}: ${finding.categoryLabel} (${finding.severity})
Klausul asli: ${finding.originalClause}
Bahasa awam: ${finding.plainTranslation}
Risiko: ${finding.explanation}
Saran awal: ${finding.recommendation}`;
    })
    .join("\n\n");

  const research = analysis.researchContent
    ? `\n\nRiset hukum yang dipakai analisis:\n${String(analysis.researchContent).slice(0, 6000)}`
    : "";

  return `Judul analisis: ${analysis.title}
Ringkasan: ${analysis.summary || "-"}
Risiko keseluruhan: ${analysis.overallRisk || "-"} (${analysis.riskScore ?? "-"} / 100)

Temuan klausul:
${findings || "- Tidak ada temuan klausul tersimpan."}${research}`;
}

async function findOwnedAnalysis(db: AnalysisChatDb, analysisId: string, userId: string) {
  return db.analysis.findFirst({
    where: { id: analysisId, userId },
    include: {
      findings: {
        orderBy: { severity: "asc" },
      },
    },
  });
}

async function getOrCreateThread(db: AnalysisChatDb, analysisId: string, userId: string, title?: string) {
  const existing = await db.analysisChatThread.findFirst({
    where: { analysisId, userId },
  });
  if (existing) return existing;
  return db.analysisChatThread.create({
    data: {
      analysisId,
      userId,
      title: title ? `Tanya lanjutan: ${title}`.slice(0, 120) : "Tanya lanjutan",
    },
  });
}

export async function listAnalysisChatMessages({
  db,
  analysisId,
  userId,
}: {
  db: AnalysisChatDb;
  analysisId: string;
  userId: string;
}): Promise<{ threadId: string | null; messages: AnalysisChatMessageDto[] } | null> {
  const analysis = await findOwnedAnalysis(db, analysisId, userId);
  if (!analysis) return null;

  const thread = await db.analysisChatThread.findFirst({
    where: { analysisId, userId },
  });
  if (!thread) return { threadId: null, messages: [] };

  const messages = await db.analysisChatMessage.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: "asc" },
  });

  return {
    threadId: thread.id,
    messages: messages.map(toDto),
  };
}

export async function createAnalysisChatReply({
  db,
  analysisId,
  userId,
  question,
  complete = (messages) => createChatCompletion(messages, undefined, "analysis_chat_llm"),
}: {
  db: AnalysisChatDb;
  analysisId: string;
  userId: string;
  question: string;
  complete?: ChatCompleteFn;
}): Promise<{ threadId: string; messages: AnalysisChatMessageDto[]; reply: AnalysisChatMessageDto }> {
  const cleanedQuestion = question.trim();
  if (cleanedQuestion.length < 3) {
    throw new Error("QUESTION_TOO_SHORT");
  }
  if (cleanedQuestion.length > 3000) {
    throw new Error("QUESTION_TOO_LONG");
  }

  const analysis = await findOwnedAnalysis(db, analysisId, userId);
  if (!analysis) {
    throw new Error("ANALYSIS_NOT_FOUND");
  }

  const thread = await getOrCreateThread(db, analysisId, userId, analysis.title);
  const previous = await db.analysisChatMessage.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const userMessage = await db.analysisChatMessage.create({
    data: {
      threadId: thread.id,
      analysisId,
      userId,
      role: "user",
      content: cleanedQuestion,
    },
  });

  const chatMessages: ChatMessage[] = [
    { role: "system", content: `${SYSTEM_PROMPT}\n\n=== KONTEKS ANALISIS ===\n${buildContext(analysis)}` },
    ...previous.map((message: any) => ({
      role: (message.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
      content: String(message.content || ""),
    })),
    { role: "user", content: cleanedQuestion },
  ];

  const completion = await complete(chatMessages);

  const assistantMessage = await db.analysisChatMessage.create({
    data: {
      threadId: thread.id,
      analysisId,
      userId,
      role: "assistant",
      content: completion.content.trim(),
      modelUsed: `${completion.provider}:${completion.model}`,
    },
  });

  await db.analysisChatThread.update({
    where: { id: thread.id },
    data: { updatedAt: new Date() },
  });

  const messages = [...previous, userMessage, assistantMessage].map(toDto);
  return {
    threadId: thread.id,
    messages,
    reply: toDto(assistantMessage),
  };
}
