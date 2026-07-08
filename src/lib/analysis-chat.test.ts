import { describe, expect, test } from "bun:test";
import {
  createAnalysisChatReply,
  listAnalysisChatMessages,
  type AnalysisChatDb,
} from "@/lib/analysis-chat";

function createFakeDb(): AnalysisChatDb & {
  threads: any[];
  messages: any[];
  analyses: any[];
} {
  const db = {
    analyses: [
      {
        id: "analysis-1",
        userId: "user-1",
        title: "Kontrak Sewa",
        summary: "Ada beberapa klausul berat sebelah.",
        overallRisk: "TINGGI",
        riskScore: 78,
        researchContent: "UU Perlindungan Konsumen menekankan klausul baku yang adil.",
        findings: [
          {
            categoryLabel: "Denda & Sanksi",
            severity: "TINGGI",
            originalClause: "Denda 2% per hari.",
            plainTranslation: "Denda bisa membengkak cepat.",
            explanation: "Angka denda harian terlalu tinggi.",
            recommendation: "Usulkan batas maksimum denda.",
          },
        ],
      },
    ],
    threads: [] as any[],
    messages: [] as any[],
    analysis: {
      findFirst: async ({ where, include }: any) => {
        const analysis = db.analyses.find((item) => item.id === where.id && item.userId === where.userId);
        if (!analysis) return null;
        return include?.findings ? analysis : { ...analysis, findings: undefined };
      },
    },
    analysisChatThread: {
      findFirst: async ({ where, include }: any) => {
        const thread = db.threads.find((item) => item.analysisId === where.analysisId && item.userId === where.userId);
        if (!thread) return null;
        return include?.messages ? { ...thread, messages: db.messages.filter((m) => m.threadId === thread.id) } : thread;
      },
      create: async ({ data }: any) => {
        const thread = { id: `thread-${db.threads.length + 1}`, createdAt: new Date(), updatedAt: new Date(), ...data };
        db.threads.push(thread);
        return thread;
      },
      update: async ({ where, data }: any) => {
        const thread = db.threads.find((item) => item.id === where.id);
        Object.assign(thread, data);
        return thread;
      },
    },
    analysisChatMessage: {
      findMany: async ({ where }: any) => db.messages.filter((item) => item.threadId === where.threadId),
      create: async ({ data }: any) => {
        const message = { id: `msg-${db.messages.length + 1}`, createdAt: new Date(), ...data };
        db.messages.push(message);
        return message;
      },
    },
  };
  return db;
}

describe("analysis chat service", () => {
  test("stores user and assistant messages in the account-owned analysis thread", async () => {
    const db = createFakeDb();

    const result = await createAnalysisChatReply({
      db,
      analysisId: "analysis-1",
      userId: "user-1",
      question: "Kalau pemilik kos menolak revisi denda, saya jawab apa?",
      complete: async (messages) => {
        expect(messages.at(0)?.role).toBe("system");
        expect(messages.at(-1)).toEqual({
          role: "user",
          content: "Kalau pemilik kos menolak revisi denda, saya jawab apa?",
        });
        return {
          content: "Sampaikan bahwa Anda bersedia menerima denda wajar dengan batas maksimum.",
          provider: "test",
          model: "legal-chat-test",
        };
      },
    });

    expect(result.threadId).toBe("thread-1");
    expect(result.messages.map((message) => message.role)).toEqual(["user", "assistant"]);
    expect(db.messages).toHaveLength(2);

    const history = await listAnalysisChatMessages({ db, analysisId: "analysis-1", userId: "user-1" });
    expect(history?.messages.map((message) => message.content)).toEqual([
      "Kalau pemilik kos menolak revisi denda, saya jawab apa?",
      "Sampaikan bahwa Anda bersedia menerima denda wajar dengan batas maksimum.",
    ]);
  });

  test("does not expose chat history for another user's analysis", async () => {
    const db = createFakeDb();

    const history = await listAnalysisChatMessages({ db, analysisId: "analysis-1", userId: "user-2" });

    expect(history).toBeNull();
  });
});
