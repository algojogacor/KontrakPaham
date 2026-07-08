import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { existsSync, readFileSync } from "node:fs";

const SYSTEM_PROMPT = `Anda adalah asisten analisis kontrak hukum untuk masyarakat awam Indonesia.
Tugas Anda: membaca kontrak berbahasa Indonesia, menemukan klausul yang berpotensi merugikan, lalu menjelaskan risikonya dalam bahasa awam.

Prinsip wajib:
- Anda BUKAN advokat berlisensi. Berikan edukasi dan gambaran risiko, BUKAN nasihat hukum definitif.
- Jangan mengarang klausul. Kutip hanya klausul yang ada di teks.
- Jika ragu, tetap laporkan temuan dengan confidence rendah dan actionType "BUTUH_NASIHAT".
- Tidak semua klausul harus dibuat berbahaya. Jika wajar, overallRisk bisa RENDAH.
- Penjelasan harus konkret: jelaskan dampak, perbandingan kewajaran jika relevan, dan rekomendasi negosiasi yang bisa dieksekusi.

Kategori yang tersedia:
JANGKA_WAKTU, DENDA_SANKSI, KLAUSUL_SEPIHAK, PENGALIHAN_RISIKO, KETENTUAN_PEMUTUSAN,
KEWAJIBAN_PEMBAYARAN, HAK_KEPEMILIKAN, KERAHASIAAN, PENYELESAIAN_SENGKETA, FORUM_HUKUM,
FORCE_MAJEUR, PERUBAHAN_KLAUSUL, TANGGUNG_JAWAB, DATA_PRIBADI, KLAUSUL_ABNORMAL, LAIN_LAIN.

Severity: RENDAH, SEDANG, TINGGI, KRITIS.
Urgency: INFO, PERHATIAN, PERLU_TINDAKAN.
ActionType: INFO_UMUM, BUTUH_NASIHAT.

Balas HANYA JSON valid dengan struktur:
{
  "summary": "ringkasan 2-4 kalimat",
  "overallRisk": "RENDAH|SEDANG|TINGGI|KRITIS",
  "riskScore": 0,
  "findings": [
    {
      "category": "...",
      "categoryLabel": "...",
      "severity": "RENDAH|SEDANG|TINGGI|KRITIS",
      "confidence": 0,
      "urgency": "INFO|PERHATIAN|PERLU_TINDAKAN",
      "originalClause": "kutipan klausul asli",
      "plainTranslation": "bahasa awam",
      "explanation": "risiko + perbandingan wajar bila relevan",
      "recommendation": "aksi konkret + alternatif",
      "actionType": "INFO_UMUM|BUTUH_NASIHAT",
      "location": "opsional"
    }
  ],
  "notes": []
}`;

const sampleKosText = `SURAT PERJANJIAN SEWA KAMAR KOS

Pihak Pertama (Pemilik Kos): Ibu Siti
Pihak Kedua (Penyewa): Anak kos

Pasal 1 - Obyek Sewa
Pihak Pertama menyewakan kamar nomor 12 di Kos Melati kepada Pihak Kedua untuk tempat tinggal.

Pasal 2 - Jangka Waktu
Jangka waktu sewa 6 bulan, terhitung dari tanggal 1. Kontrak diperpanjang otomatis untuk 6 bulan berikutnya kecuali ada pemberitahuan 2 minggu sebelumnya. Tarif naik 10% saat perpanjangan.

Pasal 3 - Biaya Sewa
Sewa Rp 800.000 per bulan, dibayar di muka tanggal 28 setiap bulan.

Pasal 4 - Denda Keterlambatan
Keterlambatan pembayaran dikenakan denda Rp 50.000 per hari. Keterlambatan lebih dari 5 hari, Pihak Pertama berhak mengunci kamar dan menyita barang Pihak Kedua sampai lunas.

Pasal 5 - Deposit
Deposit Rp 1.600.000 (2 bulan sewa). Deposit tidak dikembalikan jika Pihak Kedua pindah sebelum kontrak berakhir, kecuali ada persetujuan tertulis.

Pasal 6 - Peraturan
Pihak Kedua dilarang membawa tamu menginap. Pelanggaran denda Rp 100.000 per tamu per malam. Pihak Pertama berhak masuk kamar kapan saja untuk inspeksi.

Pasal 7 - Pemutusan
Pihak Pertama dapat mengakhiri kontrak sewaktu-waktu dengan pemberitahuan 3 hari. Pihak Kedua tidak dapat mengakhiri sebelum 6 bulan; jika memaksa, deposit hangus.

Pasal 8 - Penyelesaian Sengketa
Semua sengketa diselesaikan di Pengadilan Negeri sesuai domisili Pihak Pertama.`;

if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    process.env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
}

const db = process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN
  ? new PrismaClient({
      adapter: new PrismaLibSql({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      }),
    })
  : new PrismaClient();

async function main() {
  console.log("Fetching DeepSeek V4 Pro Direct from Turso database...");
  const provider = await db.llmProvider.findFirst({
    where: { name: { contains: "DeepSeek" } }
  });

  if (!provider) {
    console.error("DeepSeek provider not found in database!");
    process.exit(1);
  }

  // Set max_tokens to 8192!
  const payload = {
    model: "deepseek-v4-flash",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Analisis kontrak berikut.\n\n=== KONTRAK ===\n${sampleKosText}` }
    ],
    temperature: 0.1,
    max_tokens: 8192,
    response_format: { type: "json_object" }
  };

  console.log(`Sending prompt to deepseek-v4-flash with max_tokens: 8192...`);
  const tStart = Date.now();
  try {
    const res = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const tHeaders = Date.now() - tStart;
    console.log(`HTTP Headers received in: ${tHeaders}ms | Status: ${res.status}`);

    const resBodyText = await res.text();
    const tBody = Date.now() - tStart;
    console.log(`Full response body received in: ${tBody}ms`);

    if (!res.ok) {
      console.error(`DeepSeek API Error: ${res.status}\n${resBodyText}`);
      process.exit(1);
    }

    const resJson = JSON.parse(resBodyText);
    const content = resJson?.choices?.[0]?.message?.content;
    const reasoning = resJson?.choices?.[0]?.message?.reasoning_content;

    console.log("\n--- STATS ---");
    console.log(`Total Latency: ${(tBody / 1000).toFixed(2)} seconds`);
    console.log(`Reasoning Content Length: ${reasoning ? reasoning.length : 0} characters`);
    console.log(`Final Response Content Length: ${content ? content.length : 0} characters`);
    console.log(`Prompt Tokens: ${resJson?.usage?.prompt_tokens}`);
    console.log(`Completion Tokens: ${resJson?.usage?.completion_tokens}`);

    console.log("\n--- FINAL CONTENT ---");
    console.log(content);

    try {
      JSON.parse(content.trim());
      console.log("\n[VERIFICATION] Output is VALID JSON.");
    } catch (err) {
      console.log("\n[VERIFICATION] Output is INVALID JSON! Error:", err.message);
    }

  } catch (err) {
    console.error("Fatal request error:", err);
  }
}

main().catch(console.error).finally(() => db.$disconnect());
