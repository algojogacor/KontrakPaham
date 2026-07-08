// Legal pages content — Bahasa Indonesia, clear & non-intimidating.
// Consistent with product voice: helpful, not intimidating.
// All pages share a "last updated" date.

export const LEGAL_LAST_UPDATED = "5 Juli 2026";

export interface LegalSection {
  heading: string;
  body: string[];
  list?: string[];
  bodyAfterList?: string[];
}

export interface LegalDoc {
  slug: string;
  title: string;
  subtitle: string;
  icon: string;
  sections: LegalSection[];
}

export const TERMS_DOC: LegalDoc = {
  slug: "terms",
  title: "Syarat & Ketentuan",
  subtitle: "Aturan dasar penggunaan layanan KontrakPaham.",
  icon: "FileText",
  sections: [
    {
      heading: "1. Tentang Layanan Ini",
      body: [
        "KontrakPaham adalah platform berbasis web yang membantu Anda memahami kontrak berbahasa Indonesia sebelum menandatangani. Cara kerjanya: Anda unggah PDF/DOCX atau tempel teks kontrak, sistem menganalisis klausul, lalu menjelaskan potensi risiko dalam bahasa awam dan memberi saran tindakan.",
        "Penting: ini adalah alat bantu edukasi dan analisis awal, BUKAN nasihat hukum resmi. Lihat halaman Disclaimer Hukum untuk penjelasan lengkap.",
      ],
    },
    {
      heading: "2. Penggunaan yang Wajar",
      body: ["Anda setuju menggunakan layanan ini untuk tujuan yang wajar dan sah, yaitu memahami kontrak yang Anda hadapi. Hal yang tidak boleh dilakukan:"],
      list: [
        "Mengunggah dokumen yang bukan milik Anda tanpa izin (lihat Kebijakan Konten)",
        "Menyalahgunakan sistem untuk tujuan di luar analisis kontrak",
        "Mencoba mengakses/mengganggu sistem, akun orang lain, atau infrastruktur layanan",
        "Menggunakan hasil analisis untuk tujuan ilegal atau merugikan pihak lain",
      ],
    },
    {
      heading: "3. Akun Anda",
      body: [
        "Untuk menggunakan layanan, Anda buat akun dengan username + password. Anda bertanggung jawab menjaga kerahasiaan password dan semua aktivitas di akun Anda.",
        "Anda bisa menghapus akun kapan saja di Pengaturan — semua data (riwayat analisis, temuan, kuota) akan dihapus permanen. Anda juga bisa menghapus analisis individual tanpa menghapus akun.",
        "Kami berhak menonaktifkan akun yang disalahgunakan (lihat Kebijakan Konten & Penyalahgunaan).",
      ],
    },
    {
      heading: "4. Hak & Kewajiban Anda",
      body: ["Hak Anda:"],
      list: [
        "Menggunakan layanan sesuai paket yang dipilih (FREE: 3 analisis/bulan, LITE: 20 analisis/bulan, PRO: 75 analisis/bulan)",
        "Mengakses, mengunduh ulang, dan menghapus data analisis Anda kapan saja",
        "Mendapatkan penjelasan yang jelas soal batasan layanan",
      ],
      bodyAfterList: ["Kewajiban Anda:", "Memberikan informasi akun yang benar, menjaga keamanan akun, dan menggunakan layanan dengan iktikad baik."],
    },
    {
      heading: "5. Hak Kekayaan Intelektual",
      body: [
        "Kontrak asli yang Anda unggah tetap milik Anda. Kami tidak mengklaim kepemilikan atas dokumen Anda.",
        "Hasil analisis (temuan, penjelasan, rekomendasi) yang di-generate oleh sistem adalah output AI. Anda bebas menggunakannya untuk keperluan pribadi Anda (termasuk berbagi dengan advokat Anda). Namun, hasil ini tidak boleh diperjualbelikan atau dijadikan layanan komersial tanpa izin tertulis.",
        "Merek, logo, dan elemen visual KontrakPaham adalah milik kami dan dilindungi hukum.",
      ],
    },
    {
      heading: "6. Perubahan Layanan & Harga",
      body: [
        "Kami bisa mengubah fitur, batasan paket (mis. jumlah analisis gratis), atau model harga sewaktu-waktu. Untuk perubahan signifikan yang memengaruhi paket berbayar, kami beri tahu minimal 14 hari sebelumnya via email atau notifikasi di aplikasi.",
        "Model saat ini: FREE (gratis), LITE, dan PRO. Paket berbayar diaktifkan manual memakai license code dengan durasi tertentu, bukan langganan otomatis.",
      ],
    },
    {
      heading: "7. Batasan Tanggung Jawab",
      body: [
        "Lihat halaman khusus Batasan Tanggung Jawab untuk rincian lengkap. Intinya: layanan ini bersifat edukasi, Anda menggunakannya dengan risiko sendiri, dan kami tidak bertanggung jawab atas kerugian dari keputusan yang Anda ambil berdasarkan hasil analisis AI.",
      ],
    },
    {
      heading: "8. Hukum yang Berlaku",
      body: [
        "Syarat & Ketentuan ini diatur oleh hukum Republik Indonesia. Setiap perselisihan diupayakan diselesaikan secara musyawarah; jika tidak tercapai, melalui Pengadilan Negeri yang berwenang di wilayah Republik Indonesia.",
      ],
    },
  ],
};

export const PRIVACY_DOC: LegalDoc = {
  slug: "privacy",
  title: "Kebijakan Privasi",
  subtitle: "Data apa yang kami kumpulkan, bagaimana dipakai, dan hak Anda.",
  icon: "Lock",
  sections: [
    {
      heading: "1. Data yang Kami Kumpulkan",
      body: ["Data yang kami simpan saat Anda menggunakan layanan:"],
      list: [
        "Akun: username, email, password (di-hash dengan bcrypt — kami tidak bisa melihat password asli Anda)",
        "Isi kontrak yang Anda unggah (PDF/DOCX/teks) — INI DATA SENSITIF. Kami simpan untuk riwayat analisis Anda.",
        "Hasil analisis (temuan, penjelasan, rekomendasi) — tersimpan terkait akun Anda",
        "Log aktivitas: waktu analisis, jenis dokumen, IP address (untuk keamanan & audit)",
        "Kuota pemakaian bulanan (jumlah analisis tersisa)",
      ],
    },
    {
      heading: "2. ⚠️ Data Dikirim ke API Pihak Ketiga (WAJIB DIBACA)",
      body: [
        "Saat Anda mengajukan analisis, teks kontrak Anda dikirim ke layanan AI pihak ketiga (LLM provider) untuk diproses. Ini WAJIB karena sistem analisis berjalan di server AI eksternal, bukan di server kami sendiri.",
        "Apa artinya untuk Anda:",
      ],
      list: [
        "Teks kontrak Anda melewati sistem AI eksternal (z-ai-web-dev-sdk) untuk dianalisis",
        "Untuk PDF hasil scan/foto, gambar halaman juga dikirim ke layanan vision AI untuk OCR (konversi gambar ke teks)",
        "Kami tidak mengontrol retensi data di sisi provider AI — sebagian besar provider tidak menyimpan input secara permanen, tapi ini di luar kendali kami",
        "Hasil analisis kembali ke kami dan kami simpan di database Anda",
      ],
      bodyAfterList: ["Saran: jangan unggah kontrak yang mengandung data sangat sensitif (nomor KTP penuh, nomor rekening, rahasia dagang) jika tidak perlu. Sensor dulu bagian yang tidak relevan untuk analisis klausul."],
    },
    {
      heading: "3. Bagaimana Data Digunakan",
      body: ["Data Anda dipakai untuk:"],
      list: [
        "Menjalankan analisis kontrak dan menampilkan hasilnya ke Anda",
        "Menyimpan riwayat analisis agar bisa dilihat/diunduh ulang",
        "Menghitung kuota pemakaian bulanan",
        "Mencegah penyalahgunaan (rate limiting, deteksi aktivitas mencurigakan)",
        "Meningkatkan kualitas layanan (analisis agregat, bukan per individu)",
      ],
      bodyAfterList: ["Kami TIDAK menjual data Anda ke pihak ketiga. Kami TIDAK menggunakan isi kontrak Anda untuk melatih model AI."],
    },
    {
      heading: "4. Penyimpanan & Perlindungan Data",
      body: [
        "Data disimpan di database server (SQLite). Password di-hash dengan bcrypt (cost 12). Sesi login menggunakan JWT dalam cookie httpOnly dengan kedaluwarsa 30 hari.",
        "Akses ke database terbatas — hanya sistem yang menjalankan layanan. Tidak ada akses manual rutin ke isi kontrak pengguna.",
        "Komunikasi data (browser ↔ server, server ↔ AI provider) dienkripsi via HTTPS/TLS.",
      ],
    },
    {
      heading: "5. Berapa Lama Data Disimpan",
      body: [
        "Data analisis Anda disimpan selama akun Anda aktif. Saat Anda menghapus analisis individual (di halaman Riwayat), data itu dihapus permanen. Saat Anda menghapus akun (di Pengaturan), SEMUA data Anda dihapus permanen — tidak bisa dibatalkan.",
        "Jika akun tidak aktif lebih dari 24 bulan, kami berhak menghapus data terkait. Anda akan diberi tahu via email sebelumnya jika memungkinkan.",
        "Log aktivitas (tanpa isi kontrak) disimpan maksimal 90 hari untuk keamanan.",
      ],
    },
    {
      heading: "6. Siapa yang Punya Akses",
      body: ["Pihak yang bisa mengakses data Anda:"],
      list: [
        "Anda sendiri (via akun Anda)",
        "Sistem otomatis KontrakPaham (untuk menjalankan analisis)",
        "Provider AI pihak ketiga (z-ai untuk LLM, model vision untuk OCR) — hanya teks/gambar kontrak yang dikirim, bukan data akun lain",
        "Pengelola KontrakPaham (mahasiswa hukum UNAIR) — akses terbatas, hanya untuk dukungan teknis jika Anda minta, bukan akses rutin ke isi kontrak",
      ],
    },
    {
      heading: "7. Hak Anda",
      body: ["Sesuai UU Perlindungan Data Pribadi (UU PDP) Indonesia, Anda berhak:"],
      list: [
        "Mengakses data Anda (lihat di Riwayat & Pengaturan)",
        "Menghapus data Anda (analisis individual atau seluruh akun — sudah tersedia sebagai fitur)",
        "Menghentikan penggunaan layanan kapan saja (cukup berhenti pakai, atau hapus akun)",
      ],
      bodyAfterList: ["Untuk permintaan terkait data pribadi (akses/hapus/perbaiki), hubungi kami via WhatsApp/email yang tertera di footer."],
    },
    {
      heading: "8. Kepatuhan UU PDP",
      body: [
        "Kebijakan ini disusun dengan memperhatikan UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP). Kami berupaya transparan soal pengolahan data Anda, termasuk pengungkapan bahwa data kontrak dikirim ke provider AI pihak ketiga (lihat poin 2).",
        "Karena layanan ini dikelola oleh mahasiswa hukum UNAIR (bukan korporasi), kapasitas kepatuhan terbatas. Untuk pertanyaan soal privasi, hubungi kami langsung.",
      ],
    },
  ],
};

export const DISCLAIMER_DOC: LegalDoc = {
  slug: "disclaimer",
  title: "Disclaimer Hukum",
  subtitle: "Batasan layanan ini — wajib dipahami sebelum mengandalkan hasil analisis.",
  icon: "Scale",
  sections: [
    {
      heading: "Inti Disclaimer",
      body: [
        "KontrakPaham adalah alat bantu edukasi dan analisis awal. BUKAN nasihat hukum resmi. BUKAN pengganti konsultasi dengan advokat berlisensi.",
        "Hasil analisis AI bisa mengandung kesalahan, ketidaklengkapan, atau salah tafsir. Tidak boleh dijadikan dasar tunggal untuk keputusan hukum penting (menandatangani kontrak bernilai besar, sengketa, transaksi rumit).",
      ],
    },
    {
      heading: "Siapa yang Mengelola Layanan Ini",
      body: [
        "KontrakPaham dikelola oleh mahasiswa hukum UNAIR, BUKAN advokat berlisensi. Kami bisa membantu Anda memahami hasil analisis, memetakan opsi, dan menyiapkan pertanyaan klarifikasi untuk pihak kontrak.",
        "Namun kami TIDAK memberikan nasihat hukum definitif dan TIDAK mewakili Anda secara hukum. Untuk keputusan penting, konsultasi dengan advokat berlisensi yang memahami konteks spesifik Anda.",
      ],
    },
    {
      heading: "Limitasi Hasil Analisis",
      body: ["Yang perlu Anda sadari soal hasil analisis:"],
      list: [
        "AI bisa salah mendeteksi klausul atau melewatkan risiko yang penting",
        "Analisis tidak memahami konteks spesifik Anda (negosiasi sebelumnya, hubungan pihak, industri)",
        "Tingkat keyakinan (confidence) adalah estimasi heuristik, bukan jaminan akurasi",
        "Untuk PDF scan, akurasi OCR terbatas — teks hasil OCR bisa salah baca",
        "Analisis tidak menggantikan pembacaan kontrak lengkap oleh Anda atau ahli hukum",
      ],
    },
    {
      heading: "Saran Penggunaan yang Bijak",
      body: ["Cara terbaik memakai layanan ini:"],
      list: [
        "Pakai sebagai cek awal sebelum konsultasi advokat — jadi Anda datang ke advokat dengan pertanyaan yang lebih tajam",
        "Fokus pada temuan berlabel KRITIS & TINGGI — itu yang paling perlu diklarifikasi/dinegosiasi",
        "Untuk kontrak bernilai besar (properti, kerja, pinjaman), SELALU konsultasi advokat berlisensi sebelum tanda tangan",
        "Jangan tanda tangan hanya karena hasil analisis 'aman' — tetap baca sendiri dengan teliti",
      ],
    },
    {
      heading: "Konsultasi Lanjutan",
      body: [
        "Jika butuh diskusi lebih lanjut setelah analisis, Anda bisa hubungi pengelola via WhatsApp/IG/email (lihat footer). Ingat: ini dikelola mahasiswa hukum UNAIR, bukan advokat berlisensi. Kami bantu memahami, bukan memberi nasihat hukum definitif.",
      ],
    },
  ],
};

export const LIABILITY_DOC: LegalDoc = {
  slug: "liability",
  title: "Batasan Tanggung Jawab",
  subtitle: "Hal-hal yang tidak menjadi tanggung jawab platform.",
  icon: "ShieldAlert",
  sections: [
    {
      heading: "Risiko Penggunaan ada pada Anda",
      body: [
        "Penggunaan layanan KontrakPaham sepenuhnya menjadi risiko dan tanggung jawab Anda sendiri. Platform ini disediakan 'apa adanya' (as-is) tanpa jaminan akurasi, kelengkapan, atau kecocokan untuk tujuan tertentu.",
      ],
    },
    {
      heading: "Kerugian yang Tidak Menjadi Tanggung Jawab Kami",
      body: ["Kami tidak bertanggung jawab atas kerugian yang timbul dari:"],
      list: [
        "Keputusan yang Anda ambil berdasarkan hasil analisis AI (menandatangani/menolak kontrak, negosiasi, dll)",
        "Kesalahan atau ketidaklengkapan dalam hasil analisis",
        "Kegagalan OCR untuk PDF scan (teks terbaca salah/tidak terbaca)",
        "Kehilangan data akibat gangguan teknis (server down, bug, force majeure)",
        "Akses tidak sah ke akun Anda akibat Anda tidak menjaga keamanan password",
        "Penyalahgunaan layanan oleh pengguna lain",
      ],
    },
    {
      heading: "Batas Maksimal Tanggung Jawab",
      body: [
        "Sejauh diizinkan hukum, tanggung jawab maksimal kami terhadap klaim apapun adalah sebesar yang telah Anda bayarkan kepada kami dalam 12 bulan terakhir. Untuk pengguna paket FREE (tidak membayar), tanggung jawab maksimal adalah nol rupiah.",
      ],
    },
    {
      heading: "Layanan Tidak Menggantikan Profesional",
      body: [
        "Layanan ini BUKAN pengganti nasihat medis, hukum, keuangan, atau profesional lainnya. Untuk keputusan yang berdampak signifikan, selalu konsultasi profesional yang berlisensi dan memahami konteks Anda.",
      ],
    },
    {
      heading: "Ketersediaan Layanan",
      body: [
        "Kami berupaya menjaga layanan tetap tersedia, tapi tidak menjamin 100% uptime. Layanan bisa tidak tersedia sementara karena maintenance, gangguan teknis, atau force majeure. Kami tidak bertanggung jawab atas kerugian akibat layanan tidak tersedia.",
      ],
    },
  ],
};

export const CONTENT_POLICY_DOC: LegalDoc = {
  slug: "content-policy",
  title: "Kebijakan Konten & Penyalahgunaan",
  subtitle: "Apa yang boleh & tidak boleh diunggah, serta konsekuensi pelanggaran.",
  icon: "FileWarning",
  sections: [
    {
      heading: "Konten yang Boleh Diunggah",
      body: [
        "Anda boleh mengunggah kontrak/perjanjian berbahasa Indonesia yang ANDA MILIKI atau ANDA BERHAK menganalisis. Contoh: kontrak sewa Anda, kontrak kerja Anda, kontrak jual beli yang ditawarkan kepada Anda.",
      ],
    },
    {
      heading: "Konten yang DILARANG",
      body: ["Anda TIDAK boleh mengunggah:"],
      list: [
        "Dokumen yang bukan milik Anda tanpa izin pemiliknya (pelanggaran privasi pihak ketiga)",
        "Dokumen rahasia negara atau dokumen yang diklasifikasikan",
        "Dokumen yang mengandung data pribadi pihak lain tanpa persetujuan mereka (KTP orang lain, data pasien, dll)",
        "Konten ilegal (pornografi anak, dokumen terorisme, dll) — meski ini bukan kontrak, sistem tidak akan memprosesnya",
        "Dokumen dengan tujuan mengeksploitasi/mencelakai pihak lain",
      ],
    },
    {
      heading: "Penyalahgunaan Sistem",
      body: ["Selain konten, Anda dilarang:"],
      list: [
        "Menggunakan automated tools/bot untuk melewati batas analisis",
        "Membuat banyak akun untuk mengakali kuota FREE",
        "Mencoba mengakses data pengguna lain",
        "Menyerang infrastruktur layanan (DDoS, SQL injection, dll)",
        "Menggunakan hasil analisis untuk memeras/mengancam pihak lain",
      ],
    },
    {
      heading: "Konsekuensi Pelanggaran",
      body: ["Jika terbukti melanggar kebijakan ini, konsekuensinya:"],
      list: [
        "Analisis yang melanggar bisa dihentikan/dihapus tanpa pemberitahuan",
        "Akun diberi peringatan untuk pelanggaran ringan pertama",
        "Akun di-suspend (dinonaktifkan sementara) untuk pelanggaran berulang",
        "Akun di-ban (dihapus permanen) untuk pelanggaran berat (ilegal, eksploitasi)",
        "Untuk pelanggaran ilegal, kami berhak melaporkan ke pihak berwenang",
      ],
    },
    {
      heading: "Melaporkan Pelanggaran",
      body: [
        "Jika Anda menemukan penyalahgunaan layanan oleh pengguna lain, atau merasa dokumen Anda disalahgunakan, hubungi kami via WhatsApp/email di footer. Kami akan menindaklanjuti sesuai kebijakan ini.",
      ],
    },
  ],
};

export const ALL_LEGAL_DOCS: LegalDoc[] = [
  TERMS_DOC,
  PRIVACY_DOC,
  DISCLAIMER_DOC,
  LIABILITY_DOC,
  CONTENT_POLICY_DOC,
];
