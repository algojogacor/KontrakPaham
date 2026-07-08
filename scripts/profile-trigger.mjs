import { argv } from "process";

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
All sengketa diselesaikan di Pengadilan Negeri sesuai domisili Pihak Pertama.`;

async function main() {
  const host = "http://localhost:3000";
  const username = `tester_prof_${Date.now()}`;
  const email = `${username}@example.com`;
  const password = "Test1234pass";

  console.log(`[TRIGGER] Registering test user: ${username}...`);
  const signupRes = await fetch(`${host}/api/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    body: JSON.stringify({ username, email, password }),
  });

  if (!signupRes.ok) {
    const errText = await signupRes.text();
    console.error(`[TRIGGER] Signup failed: ${signupRes.status} | ${errText}`);
    process.exit(1);
  }

  const signupData = await signupRes.json();
  console.log(`[TRIGGER] Signup OK. User ID: ${signupData.user.id}`);

  // Extract session cookie from headers
  const setCookie = signupRes.headers.get("set-cookie");
  if (!setCookie) {
    console.error("[TRIGGER] No set-cookie header found!");
    process.exit(1);
  }
  const cookieVal = setCookie.split(";")[0];
  console.log(`[TRIGGER] Got Cookie: ${cookieVal}`);

  console.log("[TRIGGER] Calling /api/analyze with sample sewa-kos contract...");
  const t0 = Date.now();
  const analyzeRes = await fetch(`${host}/api/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "Cookie": cookieVal,
    },
    body: JSON.stringify({ text: sampleKosText }),
  });

  const duration = Date.now() - t0;
  console.log(`[TRIGGER] API call finished in ${duration}ms | status=${analyzeRes.status}`);

  if (!analyzeRes.ok) {
    const errText = await analyzeRes.text();
    console.error(`[TRIGGER] Analyze failed: ${errText}`);
    process.exit(1);
  }

  const resJson = await analyzeRes.json();
  console.log("[TRIGGER] Response parsed successfully.");
  console.log(`[TRIGGER] Title: ${resJson.analysis.title}`);
  console.log(`[TRIGGER] Overall Risk: ${resJson.analysis.overallRisk}`);
  console.log(`[TRIGGER] Findings Count: ${resJson.analysis.findings.length}`);
  console.log(`[TRIGGER] Model Used: ${resJson.analysis.modelUsed}`);
  console.log(`[TRIGGER] Research Effort: ${resJson.analysis.researchEffort}`);
  console.log(`[TRIGGER] Research Latency: ${resJson.analysis.researchLatencyMs}ms`);
}

main().catch((err) => {
  console.error("[TRIGGER] Fatal error:", err);
  process.exit(1);
});
