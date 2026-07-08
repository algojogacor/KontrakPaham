// Static content for FAQ, glossary, and sample contracts.
// All in Bahasa Indonesia, written for laypeople.

export interface FAQItem {
  q: string;
  a: string;
  category: "umum" | "teknis" | "hukum" | "akun";
}

export const FAQ_ITEMS: FAQItem[] = [
  {
    category: "umum",
    q: "Apakah hasil analisis KontrakPaham bisa dipakai sebagai nasihat hukum?",
    a: "Tidak. KontrakPaham bersifat edukasi dan gambaran risiko, bukan nasihat hukum definitif. Platform ini dikelola oleh mahasiswa hukum UNAIR, bukan advokat berlisensi. Untuk keputusan penting (menandatangani kontrak bernilai besar, sengketa), konsultasikan dengan advokat berlisensi yang memahami konteks spesifik Anda.",
  },
  {
    category: "umum",
    q: "Berapa lama satu analisis kontrak?",
    a: "Biasanya 20 detik sampai 2 menit, tergantung panjang dokumen. Untuk PDF hasil scan yang butuh OCR, bisa lebih lama karena setiap halaman diproses satu per satu. Jangan tutup halaman saat analisis berjalan — ada indikator progres yang menampilkan langkah demi langkah.",
  },
  {
    category: "umum",
    q: "Format file apa saja yang didukung?",
    a: "PDF (termasuk hasil scan/foto — ada OCR otomatis), DOCX (Microsoft Word), dan teks yang langsung ditempel. Saat ini belum mendukung .doc (Word lama), .jpg/.png terpisah, atau file terenkripsi. Jika file Anda .doc, simpan ulang sebagai .docx atau PDF lewat Word.",
  },
  {
    category: "umum",
    q: "Apakah kontrak saya aman diunggah?",
    a: "Teks kontrak disimpan terkait akun Anda untuk riwayat dan bisa dihapus kapan saja. Namun, sebaiknya sensor dulu data sensitif seperti nomor KTP penuh, nomor rekening, atau data pribadi lain yang tidak relevan untuk analisis klausul. Jangan unggah dokumen yang mengandung rahasia dagang jika tidak perlu.",
  },
  {
    category: "teknis",
    q: "Kenapa PDF hasil scan saya analisisnya kurang akurat?",
    a: "PDF scan adalah gambar, bukan teks. Sistem akan otomatis menjalankan OCR (optical character recognition) untuk membaca teks dari gambar. Akurasi OCR tergantung kualitas scan: tulisan kabur, miring, atau resolusi rendah akan menurunkan akurasi. Saran: scan dengan resolusi minimal 150 DPI, pastikan dokumen lurus dan terang.",
  },
  {
    category: "teknis",
    q: "Berapa ukuran file maksimal?",
    a: "Paket FREE: 5 MB, LITE: 10 MB, PRO: 20 MB. Untuk teks yang ditempel: maksimal 50.000 karakter (FREE), 100.000 karakter (LITE), atau 200.000 karakter (PRO). Jika file Anda lebih besar, coba kompres PDF atau pecah jadi bagian-bagian.",
  },
  {
    category: "teknis",
    q: "Kenapa teks kontrak dipotong saat dianalisis?",
    a: "Untuk menjaga kualitas analisis dan biaya API, teks yang melewati batas paket akan dipotong. Bagian yang dipotong tidak dianalisis. Jika kontrak Anda sangat panjang, pertimbangkan menganalisis per pasal/bagian penting saja, atau upgrade ke LITE/PRO untuk batas lebih tinggi.",
  },
  {
    category: "hukum",
    q: "Apa itu klausul sepihak?",
    a: "Klausul sepihak adalah ketentuan yang memberikan hak/keuntungan berlebihan kepada satu pihak (biasanya penyusun kontrak) sambil membebani pihak lain. Contoh: hanya satu pihak yang boleh mengakhiri kontrak sewaktu-waktu, atau hanya satu pihak yang berhak mengubah syarat tanpa persetujuan. Klausul seperti ini sering dianggap tidak adil dan bisa dinegosiasi.",
  },
  {
    category: "hukum",
    q: "Apa beda mediasi, arbitrase, dan pengadilan?",
    a: "Mediasi: pihak ketiga netral membantu mencapai kesepakatan, keputusan tidak mengikat kecuali disetujui. Arbitrase: arbiter (wasit) memutuskan sengketa, keputusan mengikat dan final, biasanya lebih cepat & tertutup. Pengadilan: lewat sistem peradilan negara, publik, proses formal. Kontrak biasanya menyebut salah satu sebagai jalur penyelesaian sengketa — perhatikan mana yang dipilih dan apakah adil untuk Anda.",
  },
  {
    category: "hukum",
    q: "Apa itu force majeure dan kenapa penting?",
    a: "Force majeure (keadaan kahar) adalah kejadian di luar kendali pihak yang membuat tidak mungkin memenuhi kewajiban — contoh: bencana alam, perang, wabah. Klausul ini penting karena menentukan siapa menanggung risiko saat hal tak terduga terjadi. Hati-hati jika kontrak mengalihkan seluruh risiko force majeure kepada Anda.",
  },
  {
    category: "hukum",
    q: "Apakah tanda tangan di kontrak langsung mengikat?",
    a: "Umumnya ya — tanda tangan menunjukkan persetujuan terhadap seluruh klausul, termasuk yang mungkin tidak Anda baca. Itulah pentingnya menganalisis sebelum menandatangani. Beberapa kontrak punya klausul 'grace period' (waktu pembatalan), tapi tidak semua. Asumsikan bahwa setelah tanda tangan, Anda terikat.",
  },
  {
    category: "akun",
    q: "Berapa analisis gratis yang saya dapat?",
    a: "Paket FREE mendapat 3 analisis per bulan kalender. Kuota ter-reset otomatis setiap awal bulan. Jika habis, Anda bisa menunggu reset bulan depan atau menghubungi kami untuk upgrade LITE/PRO lewat license code.",
  },
  {
    category: "akun",
    q: "Bagaimana cara menghapus data saya?",
    a: "Buka Pengaturan Akun → Zona Berbahaya → Hapus akun. Tindakan ini menghapus profil, seluruh riwayat analisis, temuan, dan kuota secara permanen. Anda juga bisa menghapus analisis individual satu per satu dari halaman Riwayat tanpa menghapus akun.",
  },
  {
    category: "akun",
    q: "Apakah saya bisa mengubah username atau email?",
    a: "Saat ini username tidak bisa diubah (dipakai untuk login). Email juga belum bisa diubah otomatis — hubungi kami via WhatsApp/email jika perlu. Password bisa diubah kapan saja di Pengaturan Akun.",
  },
];

export interface GlossaryItem {
  term: string;
  category: "umum" | "kewajiban" | "sengketa" | "properti" | "kerja";
  definition: string;
  example?: string;
}

export const GLOSSARY_ITEMS: GlossaryItem[] = [
  {
    term: "Klausul",
    category: "umum",
    definition: "Satu pasal atau ketentuan dalam kontrak/perjanjian. Kontrak terdiri dari banyak klausul yang masing-masing mengatur hal berbeda.",
    example: "Klausul 3 mengatur tentang denda keterlambatan pembayaran.",
  },
  {
    term: "Pihak Pertama & Pihak Kedua",
    category: "umum",
    definition: "Sebutan untuk dua (atau lebih) pihak yang membuat perjanjian. Pihak Pertama biasanya penyusun/penyedia, Pihak Kedua penerima/pembeli/penyewa. Posisi penting karena menentukan siapa punya kewajiban apa.",
  },
  {
    term: "Default / Wanprestasi",
    category: "kewajiban",
    definition: "Kegagalan memenuhi kewajiban dalam kontrak. Contoh: telat bayar, tidak menyerahkan barang. Biasanya memicu denda atau hak mengakhiri kontrak.",
    example: "Telat bayar sewa 7 hari = wanprestasi, bisa kena denda 2%/hari.",
  },
  {
    term: "Denda",
    category: "kewajiban",
    definition: "Jumlah uang yang harus dibayar sebagai hukuman karena melanggar kontrak. Perhatikan: apakah wajar (mis. 0,1%/hari) atau berlebihan (mis. 2%/hari).",
  },
  {
    term: "Deposit / Uang Jaminan",
    category: "kewajiban",
    definition: "Uang disetorkan di awal sebagai jaminan, biasanya dikembalikan di akhir kontrak dikurangi kerusakan. Perhatikan syarat pengembalian: siapa menilai kerusakan? ada batas potongan?",
  },
  {
    term: "Force Majeure",
    category: "umum",
    definition: "Keadaan kahar — peristiwa di luar kendali yang membuat tidak mungkin memenuhi kewajiban (bencana alam, perang, wabah). Klausul ini menentukan siapa tanggung risiko saat hal tak terduga terjadi.",
  },
  {
    term: "Mediasi",
    category: "sengketa",
    definition: "Penyelesaian sengketa lewat pihak ketiga netral (mediator) yang membantu kedua pihak mencapai kesepakatan. Hasil tidak mengikat kecuali disetujui bersama.",
  },
  {
    term: "Arbitrase",
    category: "sengketa",
    definition: "Penyelesaian sengketa lewat arbiter (wasit) yang dipilih kedua pihak. Putusan mengikat dan final, biasanya lebih cepat & tertutup dari publik dibanding pengadilan.",
  },
  {
    term: "Forum Hukum / Choice of Forum",
    category: "sengketa",
    definition: "Klausul yang menentukan pengadilan/lembaga mana yang berwenang jika ada sengketa. Hati-hati jika ditentukan di kota jauh dari Anda — bisa menyulitkan.",
  },
  {
    term: "Governing Law / Hukum yang Berlaku",
    category: "sengketa",
    definition: "Hukum negara mana yang dipakai menafsirkan kontrak. Untuk kontrak di Indonesia sebaiknya berlaku hukum Indonesia.",
  },
  {
    term: "Kerahasiaan (Confidentiality / NDA)",
    category: "kerja",
    definition: "Kewajiban menjaga rahasia informasi yang dipertukarkan. Perhatikan cakupan (apa saja yang rahasia), durasi (berapa lama), dan pengecualian.",
  },
  {
    term: "Non-Kompetisi (Non-Compete)",
    category: "kerja",
    definition: "Larangan bagi satu pihak untuk bekerja/berbisnis di bidang sama setelah kontrak berakhir. Bisa membatasi karir Anda — perhatikan durasi & cakupan.",
  },
  {
    term: "Hak Gunakan Pakai (HGB)",
    category: "properti",
    definition: "Hak atas tanah negara untuk digunakan bangunan/usaha, biasanya 30 tahun. Bisa diperpanjang. Berbeda dengan hak milik penuh.",
  },
  {
    term: "Sewa-Menyewa",
    category: "properti",
    definition: "Perjanjian pembayaran rutin untuk menggunakan barang/rumah milik orang lain. Perhatikan: jangka waktu, kenaikan sewa, kewajiban perawatan, deposit.",
  },
  {
    term: "Jaminan (Warranty)",
    category: "umum",
    definition: "Janji bahwa produk/jasa memenuhi standar tertentu, dengan perbaikan/penggantian jika tidak. Perhatikan durasi & cakupan jaminan.",
  },
  {
    term: "Masa Berlaku & Perpanjangan Otomatis",
    category: "umum",
    definition: "Berapa lama kontrak berlaku dan apakah diperpanjang otomatis. Auto-renewal bisa mengikat Anda lebih lama dari rencana — perhatikan cara 'opt-out'.",
  },
  {
    term: "Pemutusan Kontrak (Termination)",
    category: "umum",
    definition: "Cara mengakhiri perjanjian sebelum atau saat jangka waktu berakhir. Perhatikan: siapa bisa memutus, alasan apa, berapa hari pemberitahuan, dan konsekuensinya.",
  },
  {
    term: "Liang (Loophole)",
    category: "umum",
    definition: "Celah dalam klausul yang bisa dieksploitasi satu pihak. Contoh: definisi terlalu longgar, pengecualian luas. AI membantu mendeteksi pola seperti ini.",
  },
];

export interface SampleContract {
  id: string;
  title: string;
  category: string;
  emoji: string;
  description: string;
  difficulty: "pemula" | "menengah" | "lanjutan";
  charCount: number;
  text: string;
}

export const SAMPLE_CONTRACTS: SampleContract[] = [
  {
    id: "sewa-kos",
    title: "Kontrak Sewa Kamar Kos",
    category: "Properti",
    emoji: "🏠",
    description: "Kontrak sewa kamar kos bulanan dengan klausul keterlambatan & deposit. Cocok untuk mahasiswa/pekerja muda.",
    difficulty: "pemula",
    charCount: 1450,
    text: `SURAT PERJANJIAN SEWA KAMAR KOS

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
Semua sengketa diselesaikan di Pengadilan Negeri sesuai domisili Pihak Pertama.`,
  },
  {
    id: "kerja-freelance",
    title: "Kontrak Kerja Freelance",
    category: "Ketenagakerjaan",
    emoji: "💻",
    description: "Kontrak jasa freelance desain/development dengan scope, milestone, dan IP. Cocok untuk freelancer & client.",
    difficulty: "menengah",
    charCount: 1980,
    text: `PERJANJIAN KERJA SAMA JASA FREELANCE

Pihak Pertama (Klien): PT Maju Jaya
Pihak Kedua (Kontraktor): Freelancer

Pasal 1 - Lingkup Pekerjaan
Pihak Kedua akan mendesain dan membangun aplikasi mobile sesuai spesifikasi lampiran A. Perubahan scope di luar lampiran dikenakan biaya tambahan yang besarnya ditentukan sepihak oleh Pihak Pertama.

Pasal 2 - Jangka Waktu
Pekerjaan diselesaikan dalam 60 hari kalender. Keterlambatan dikenakan denda 1% dari nilai kontrak per hari, tanpa batas maksimal.

Pasal 3 - Pembayaran
Total nilai Rp 30.000.000, dibayar: 30% di muka, 40% setelah milestone 1, 30% setelah serah terima. Pihak Pertama berhak menahan pembayaran jika hasil tidak memuaskan menurut penilaian internal Pihak Pertama.

Pasal 4 - Hak Kekayaan Intelektual
Seluruh hasil pekerjaan, source code, dan hak cipta menjadi milik Pihak Pertama sejak pekerjaan dibuat, tanpa perlu atribusi ke Pihak Kedua. Pihak Kedua tidak boleh menggunakan kembali kode untuk proyek lain.

Pasal 5 - Kerahasiaan
Pihak Kedua wajib menjaga kerahasiaan seluruh informasi Pihak Pertama selama dan setelah kontrak, tanpa batas waktu. Pelanggaran denda Rp 100.000.000.

Pasal 6 - Non-Kompetisi
Pihak Kedua dilarang bekerja dengan kompetitor Pihak Pertama di industri yang sama selama 2 tahun setelah kontrak berakhir, di seluruh Indonesia.

Pasal 7 - Perubahan
Pihak Pertama berhak mengubah spesifikasi, jadwal, atau klausul kontrak sewaktu-waktu. Perubahan mengikat Pihak Kedua.

Pasal 8 - Pemutusan
Pihak Pertama dapat mengakhiri kontrak kapan saja dengan pemberitahuan 1 hari, tanpa kompensasi untuk pekerjaan yang belum dibayar. Pihak Kedua tidak dapat mengakhiri sebelum serah terima.

Pasal 9 - Force Majeure
Pihak Kedua tetap bertanggung jawab atas keterlambatan akibat force majeure dan wajib mengganti kerugian Pihak Pertama.

Pasal 10 - Penyelesaian Sengketa
Sengketa diselesaikan melalui arbitrase oleh lembaga yang dipilih Pihak Pertama, dengan biaya ditanggung Pihak Kedua.`,
  },
  {
    id: "pkwt",
    title: "Perjanjian Kerja Waktu Tertentu (PKWT)",
    category: "Ketenagakerjaan",
    emoji: "📄",
    description: "Kontrak kerja jangka pendek dengan klausul ketenagakerjaan. Penting dipahami pekerja & HRD.",
    difficulty: "lanjutan",
    charCount: 1720,
    text: `PERJANJIAN KERJA WAKTU TERTENGU (PKWT)

Pihak Pertama (Pemberi Kerja): PT Sukses Makmur
Pihak Kedua (Pekerja): Karyawan

Pasal 1 - Jabatan & Lingkup
Pihak Kedua diangkat sebagai Staff Admin dengan tanggung jawab sesuai deskripsi pekerjaan yang dapat diubah Pihak Pertama sewaktu-waktu.

Pasal 2 - Jangka Waktu
Kontrak berlaku 1 tahun. Dapat diperpanjang sesuai kebutuhan Pihak Pertama. Masa percobaan 3 bulan, selama mana dapat diakhiri tanpa pesangon.

Pasal 3 - Gaji & Tunjangan
Gaji pokok Rp 4.500.000 per bulan. Tunjangan transport Rp 500.000. Pihak Pertama berhak memotong gaji untuk keterlambatan, ketidakhadiran, atau pelanggaran disiplin sesuai kebijakan internal.

Pasal 4 - Jam Kerja
Jam kerja 08.00-17.00 Senin-Jumat, dengan 1 jam istirahat. Lembur wajib jika diminta, tanpa upah lembur tambahan (sudah termasuk dalam gaji).

Pasal 5 - Cuti
Cuti tahunan 8 hari (bukan 12 sesuai UU). Cuti tidak terpakai hangus di akhir tahun. Pihak Pertama berhak menolak pengajuan cuti tanpa alasan.

Pasal 6 - Kerahasiaan & Non-Kompetisi
Pekerja wajib menjaga rahasia perusahaan selamanya. Dilarang bekerja di kompetitor selama 2 tahun setelah kontrak berakhir di seluruh Indonesia. Denda pelanggaran Rp 500.000.000.

Pasal 7 - Kewajiban Tambahan
Pekerja wajib mengganti seluruh kerugian perusahaan akibat kelalaian, termasuk force majeure, tanpa batas maksimal.

Pasal 8 - Pemutusan
Pihak Pertama dapat mengakhiri kontrak sewaktu-waktu dengan pemberitahuan 7 hari jika pekerja tidak memenuhi standar (penilaian sepenuhnya oleh Pihak Pertama). Pekerja tidak dapat mengakhiri sebelum jangka waktu; jika memaksa, wajib bayar ganti rugi 3 bulan gaji.

Pasal 9 - Penyelesaian Sengketa
Sengketa diselesaikan di Pengadilan Hubungan Industrial sesuai domisili Pihak Pertama. Pekerja melepaskan hak mediasi.`,
  },
  {
    id: "jasa-renovasi",
    title: "Kontrak Jasa Renovasi Rumah",
    category: "Properti",
    emoji: "🔨",
    description: "Kontrak borongan renovasi dengan jadwal, mutu, dan garansi. Cocok untuk pemilik & kontraktor.",
    difficulty: "menengah",
    charCount: 1560,
    text: `PERJANJIAN JASA RENOVASI RUMAH

Pihak Pertama (Pemilik): Tuan Hartono
Pihak Kedua (Kontraktor): CV Bangun Jaya

Pasal 1 - Lingkup Pekerjaan
Pihak Kedua melakukan renovasi dapur dan kamar mandi rumah Pihak Pertama, termasuk pembongkaran, pemasangan keramik, instalasi plumbing, dan pengecatan.

Pasal 2 - Jangka Waktu
Pekerjaan 45 hari kalender sejak uang muka cair. Keterlambatan denda Rp 200.000 per hari. Pihak Pertama berhak mengakhiri kontrak jika keterlambatan lebih dari 7 hari tanpa kompensasi ke Pihak Kedua.

Pasal 3 - Pembayaran
Total Rp 25.000.000. Pembayaran: 40% di muka, 30% setelah rough-in, 30% setelah serah terima. Pihak Pertama berhak menahan 10% sebagai retensi selama 3 bulan untuk garansi.

Pasal 4 - Material
Material keramik & plumbing dibeli Pihak Pertama. Material lain oleh Pihak Kedua. Jika material rusak saat pemasangan, diganti Pihak Kedua.

Pasal 5 - Mutu & Garansi
Pihak Kedua menjamin mutu pekerjaan selama 3 bulan. Kerusakan dalam masa garansi diperbaiki gratis. Namun, penilaian apakah kerusakan termasuk garansi sepenuhnya keputusan Pihak Kedua.

Pasal 6 - Perubahan Lingkup
Perubahan lingkup oleh Pihak Pertama dikenakan biaya yang ditentukan sepihak oleh Pihak Kedua. Pihak Pertama wajib bayar tanpa negosiasi.

Pasal 7 - Force Majeure
Keterlambatan akibat cuaca, kelangkaan material, atau gangguan suplai tidak dikenakan denda. Risiko kerusakan akibat bencana alam selama pekerjaan ditanggung Pihak Pertama.

Pasal 8 - Pemutusan
Pihak Pertama dapat mengakhiri kapan saja dengan 1 hari pemberitahuan; pekerjaan terhenti tidak dibayar. Pihak Kedua dapat mengakhiri jika pembayaran telat 3 hari, dan uang muka hangus.

Pasal 9 - Penyelesaian Sengketa
Sengketa diselesaikan di Pengadilan Negeri domisili Pihak Kedua.`,
  },
];

export interface CategoryStat {
  category: string;
  label: string;
  emoji: string;
}

export const CATEGORY_GROUPS: Record<string, string> = {
  "Ketenagakerjaan": "kerja",
  "Properti": "properti",
  "Umum": "umum",
};
