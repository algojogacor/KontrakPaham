# Font & Color Starter Kit (Alternatif Konkret, Bukan Default AI)

`avoid-ai-slop.md` bilang jangan pakai Inter/Instrument Sans/Geist/General Sans polos dan jangan pakai gradient ungu-biru default. File ini kasih pengganti KONKRET per niche, supaya AI builder gak balik lagi ke default karena "gak ada pilihan lain yang kepikiran".

Prinsip pemilihan: pasangan font = 1 display font berkarakter + 1 body font netral yang gampang dibaca. Warna = 1 warna dasar (dark/light) + maksimal 1-2 accent, dipilih SEMANTIK (bukan buat "kelihatan techy").

## Legal-tech / profesional (KontrakPaham)

- **Font**: display `Fraunces` (serif berkarakter, kesan otoritatif tapi bukan kaku) atau `Newsreader` — dipasangkan dengan body `Public Sans` atau `IBM Plex Sans`.
- **Warna**: base `#0F172A` (navy gelap) + `#F8FAFC` (off-white) + accent tunggal `#059669` (emerald — kesan "aman/clear/disetujui", relevan buat konteks legal) atau `#D97706` (amber — kesan "perhatian/warning" buat highlight klausul berisiko).
- Hindari: gradient ungu-biru, warna pastel yang kesan gak serius untuk konteks hukum.

## SaaS / developer tool

- **Font**: display `Space Grotesk` atau `Sora` — dipasangkan dengan body `Manrope` atau `IBM Plex Sans`. Kalau butuh monospace accent (angka, code, badge): `JetBrains Mono` atau `IBM Plex Mono` (bukan default monospace generik).
- **Warna**: base `#18181B` (charcoal, dark mode default) + accent `#A3E635` (electric lime) atau `#FB7185` (coral) — pilih SATU, jangan dua-duanya jadi gradient.
- Hindari: aurora gradient ungu-biru sebagai background reflex — itu udah jadi sinyal "AI startup generik", bukan "cutting edge" lagi.

## Komunitas / edukasi (JalaForum, JalaEdu)

- **Font**: display `Lora` atau `Fraunces` (versi lebih santai) — dipasangkan dengan body `Onest` atau `Nunito Sans` (kesan hangat, approachable).
- **Warna**: base `#FFF8F0` (cream hangat) + accent `#C2410C` (terracotta) + secondary `#38BDF8` (soft blue) untuk elemen interaktif.
- Boleh main ke dopamine color kalau target usernya muda, tapi tetap batasi 2 accent max.

## Portfolio / creative

- **Font**: display `Clash Display` atau `Cabinet Grotesk` (dari Fontshare, gratis, jauh lebih jarang dipakai dibanding General Sans) — body `Switzer`.
- **Warna**: base hitam/putih kontras tinggi + 1 accent yang dipilih spesifik per proyek (bukan default apapun) — warna accent-nya justru bagian dari identitas yang harus didiskusikan, bukan diambil dari list ini.

## E-commerce

- **Font**: display `Bricolage Grotesque` atau `Instrument Serif` (bukan Instrument Sans yang udah overused) — body `Work Sans`.
- **Warna**: dopamine palette oke di sini (`#EC4899` hot pink atau `#3B82F6` electric blue), tapi pilih SATU sebagai accent utama, gunakan warna kedua cuma untuk state (misal sale/discount badge), jangan digradientkan jadi satu.

## Cara pakai

1. Cocokkan niche proyek dengan tabel di atas.
2. Kalau brand sudah punya warna/font sendiri (cek existing asset JalaJO), prioritaskan itu — starter kit ini cuma buat proyek baru yang belum ada arahan.
3. Semua font di atas tersedia gratis di Google Fonts atau Fontshare — pastikan AI builder benar-benar load font-nya (`@font-face`/`<link>`), bukan cuma nulis nama font di CSS tanpa import (fallback ke system font diam-diam adalah salah satu penyebab situs "terlihat AI" walau sudah nulis nama font yang benar).
