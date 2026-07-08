import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createChatCompletion } from "@/lib/llm";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 60; // Up to 60s for LLM response

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  const { id } = await params;

  try {
    const body = await req.json();
    const { findingIds, tone, channel, customRequest } = body;

    if (!Array.isArray(findingIds) || findingIds.length === 0) {
      return NextResponse.json({ error: "Pilih minimal satu temuan klausul untuk dinegosiasikan." }, { status: 400 });
    }

    const analysis = await db.analysis.findFirst({
      where: { id, userId: user.id },
      include: {
        findings: {
          where: { id: { in: findingIds } },
        },
      },
    });

    if (!analysis) {
      return NextResponse.json({ error: "Analisis tidak ditemukan." }, { status: 404 });
    }

    if (analysis.findings.length === 0) {
      return NextResponse.json({ error: "Tidak ada temuan klausul yang cocok dengan pilihan Anda." }, { status: 400 });
    }

    // Build context prompt
    const toneText = {
      professional: "Sopan, formal, dan profesional (menggunakan Saya/Anda, cocok untuk email formal kerja/bisnis)",
      assertive: "Tegas, formal, dan kuat (fokus pada hak hukum dan keadilan posisi tawar)",
      friendly: "Kekeluargaan, kasual tapi sopan (cocok untuk WhatsApp, mengedepankan kerja sama jangka panjang)",
    }[tone as string] || "Sopan dan profesional";

    const channelText = {
      email: "Email Resmi/Formal",
      whatsapp: "Pesan WhatsApp/Telegram",
      letter: "Surat Tanggapan Resmi Kontrak",
    }[channel as string] || "Email";

    const findingsContext = analysis.findings.map((f, i) => {
      return `--- Temuan #${i + 1} (${f.categoryLabel}) ---
Klausul Asli: "${f.originalClause}"
Bahasa Awam: ${f.plainTranslation}
Mengapa Berisiko: ${f.explanation}
Rekomendasi / Usulan Alternatif: ${f.recommendation}
`;
    }).join("\n");

    const systemPrompt = `Anda adalah seorang ahli negosiasi kontrak hukum senior di Indonesia.
Tugas Anda: Membantu pengguna menyusun draf pesan komunikasi (bisa email, WhatsApp, atau surat resmi) untuk menegosiasikan klausul kontrak yang kurang menguntungkan bagi pengguna.

Prinsip Penulisan Draf:
1. Nada bicara (Tone): ${toneText}
2. Saluran (Channel): ${channelText}
3. Draf harus persuasif, profesional, berdasar (menyebutkan asas kewajaran/kesetaraan hukum jika relevan), dan menawarkan jalan keluar (usulan alternatif) secara halus.
4. Buatlah draf siap kirim. Berikan penanda seperti [Nama Anda], [Nama Perusahaan/Mitra], atau [Tanggal] pada bagian yang perlu diisi manual oleh pengguna.
5. Jangan bertele-tele. Tulis pembuka yang baik, daftar usulan klausul baru yang terstruktur (berdasarkan temuan yang diberikan), dan penutup yang profesional.
6. Keluarkan HANYA teks pesan negosiasi itu saja tanpa penjelasan tambahan di luar pesan atau percakapan asisten. Mulailah langsung dari Subjek (jika email) atau Salam Pembuka.`;

    const userPrompt = `Saya ingin menegosiasikan kontrak berjudul "${analysis.title}" dengan mitra saya.
Berikut adalah daftar klausul bermasalah yang ingin saya negosiasikan:

${findingsContext}
${customRequest ? `\nCatatan Tambahan Khusus dari Saya:\n"${customRequest}"` : ""}

Tolong buatkan draf negosiasi terbaik untuk dikirimkan melalui ${channelText}.`;

    const completion = await createChatCompletion([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ], undefined, "negotiate_llm");

    return NextResponse.json({
      draft: completion.content,
      modelUsed: completion.model,
    });

  } catch (e) {
    logger("error", "negotiation draft failed", { error: (e as Error).message });
    return NextResponse.json({ error: "Gagal membuat draf negosiasi. Silakan coba lagi." }, { status: 500 });
  }
}
