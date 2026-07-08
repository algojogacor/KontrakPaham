# Menghindari "AI Slop" — Ciri Khas Desain AI-Generated & Cara Fix

Riset 2026 soal "AI slop web design" konsisten nemuin hal yang sama: AI builder/model condong ke pola paling umum secara statistik dari training data, bukan pilihan yang disengaja sesuai brand. Hasilnya, ribuan landing page keliatan seperti "saudara kembar". File ini kumpulan ciri paling gampang dikenali + fix konkretnya, supaya AI coding agent yang pakai skill ini secara aktif menghindari default tersebut, bukan cuma tahu tren tapi jatuh ke pattern paling generik dari tren itu.

## Ciri paling gampang dikenali (dan fix-nya)

| Ciri AI-generated | Kenapa muncul | Fix |
|---|---|---|
| Font default berulang: Inter, Instrument Sans, Geist, General Sans tanpa modifikasi | Font-font ini bagus tapi jadi "default AI startup typeface" karena paling sering muncul di training data | Pilih 1 display font dengan personality (serif editorial, monospace utk dev tool, condensed utk bold statement) + pasangkan 1 body font, konsisten di seluruh produk |
| Gradient headline/tombol ungu-ke-biru atau cyan-ke-pink sebagai default "safe choice" | Gradient dianggap AI sebagai pilihan paling aman secara statistik, minim effort konseptual | Headline pakai warna solid kontras tinggi (readability > vibes). Gradient cuma kalau memang identitas brand yang disengaja |
| Aurora gradient background (glow ungu-biru blur) dipasang di produk apapun, termasuk yang tidak ada hubungan dengan tech/AI | Sinyal "cutting-edge" yang di-overuse sampai jadi generic — malah menandakan "dibikin AI builder" | Pilih background sesuai brand (grain, warna solid, foto asli) — bukan reflex default |
| Floating trust badge/pill di hero ("Trusted by 10.000+ teams", "#1 Platform", "AI Powered") sebelum produk dijelaskan | Model belajar dari SaaS site yang pakai social proof, tapi dipasang sebagai dekorasi bukan penguat klaim | Taruh trust signal setelah value proposition jelas, dan hanya kalau klaimnya punya bukti nyata |
| Scroll indicator icon (mouse kecil animasi di bawah hero) | Overused dari template long-form storytelling, dipasang ke semua jenis situs | Skip kecuali untuk one-page narrative yang genuinely butuh cue scroll |
| Stats bar di hero ("99.9% uptime", "500M requests") padahal belum ada track record | Desain "meng-klaim" otoritas, bukan membangunnya | Kalau ada angka nyata, dukung dengan cerita di sekitarnya — jangan taruh angka generik sebagai dekorasi |
| Fake dashboard mockup generik (grafik naik kanan-atas, angka tak bermakna) di hero | Mengejar kesan "software canggih" tanpa menjelaskan produk sungguhan | Pakai screenshot produk asli meski kurang polished — lebih menjelaskan dalam 2 detik daripada mockup indah tapi generik dalam 20 detik. Untuk KontrakPaham: tampilkan preview asli hasil deteksi klausul, bukan dashboard generik |
| Ukuran komponen seragam sempurna (radius 16px + padding 24px di semua elemen) | AI builder pakai satu token spacing/radius untuk semua tanpa variasi sengaja | Variasikan radius & spacing secara intentional untuk membentuk hierarchy, bukan menyamaratakan semua |
| Micro-interaction kosong/seragam: semua elemen fade-in identik, hover state tidak berbuat apa-apa, transisi snap bukan easing | Motion butuh pemahaman intent, bukan cuma pattern-matching — ini yang paling sering dilewatkan AI builder | Motion harus purposeful: komunikasikan state change, arahkan atensi, atau perkuat personality brand (lihat "functional animation" di `style-layout-motion.md`) |
| Copy generik/aspirational ("Transform your workflow", "Reimagine productivity", "The future of X") | Headline dihasilkan dari rata-rata statistik semua headline yang pernah dilihat model | Tulis spesifik ke produk. Tes: kalau headline ini bisa dipasang di produk lain tanpa berubah makna, berarti belum cukup spesifik |
| Glassmorphism ditumpuk di banyak layer sampai teks susah dibaca | "1 CSS rule bikin apapun terlihat premium" — dipakai berlebihan tanpa cek readability | Refined glassmorphism: pastikan kontras teks tetap tinggi, jangan pakai glass effect di semua layer sekaligus |
| Stock photo/ilustrasi AI yang "terlalu sempurna" — orang random di kantor terang, blob 3D abstrak melayang | Placeholder visual yang tidak pernah diganti | Pakai foto produk/tim asli atau ilustrasi custom yang match brand — spesifisitas adalah hal yang tidak bisa ditiru dari statistik |

## Pattern spesifik yang sudah pernah teridentifikasi di produk Arya

- Row 3-checkmark badge sebagai "bukti fitur" di hero KontrakPaham — pattern generik yang gampang dikenali, hindari dipakai lagi sebagai default.
- Hero layout centered generik (headline tengah + subheadline + 2 tombol simetris tanpa elemen visual pendukung) — pertimbangkan scenario-first opening atau visual before/after kontrak sebagai gantinya (asymmetric layout lebih distinctive untuk niche ini).

## Kesalahan umum saat "memperbaiki" AI slop (over-correction)

- **Over-designing**: nambahin gradient + parallax + custom cursor di semua section sekaligus demi "kelihatan gak generic" — ini jadi noise, bukan distinctive. Produk yang justru dikenal distinctive itu karena restraint & konsistensi, bukan efek bertumpuk.
- **Ganti visual doang, copy masih generik** — tidak cukup. Visual dan konten harus dibenerin bareng.
- **Skip design system** — tanpa token warna/spacing/font yang konsisten (CSS custom properties dengan nama semantic seperti `--color-action-primary`, bukan `--color-gradient-start`), default generik akan merayap balik tiap kali bikin halaman baru.

## Pre-ship checklist "bukan AI slop"

- [ ] Font bukan Inter/Instrument Sans/Geist polos tanpa modifikasi — ada minimal 1 pilihan font yang disengaja sesuai brand.
- [ ] Headline lolos test "bisa dipasang di brand lain tanpa berubah makna?" — kalau lolos berarti belum cukup spesifik, tulis ulang.
- [ ] Warna dipakai semantically (nama variable jelas fungsinya: action/feedback/dst), bukan cuma gradient dekoratif tanpa makna.
- [ ] Ada minimal 1 screenshot/foto asli produk, bukan cuma mockup atau stock generik.
- [ ] Radius & spacing bervariasi sesuai hierarchy, tidak seragam 100% di semua elemen.
- [ ] Micro-interaction punya tujuan jelas (state change / arahkan atensi / personality), bukan fade-in generik di semua elemen sekaligus.
- [ ] Trust badge/stats di hero cuma dipasang kalau memang ada bukti nyata di baliknya.
- [ ] Dashboard/mockup di hero (kalau ada) = screenshot asli produk, bukan mockup generik grafik naik kanan-atas.
- [ ] Sudah dicek terhadap pattern yang pernah dikritik sebelumnya di produk ini (lihat bagian di atas).
