---
name: web-design-2026
description: Katalog tren desain web/UI modern 2026 (visual style, layout, animasi, komponen, tech stack) + template kode siap pakai + checklist anti-AI-slop. Trigger untuk task apapun yang bikin/redesign landing page, hero section, navbar, pricing card, dashboard, form, atau komponen frontend/UI lain — termasuk kalau user cuma bilang "bikin UI", "redesign", "frontend", atau nama produk yang butuh tampilan, tanpa perlu sebut "tren 2026" secara eksplisit. Pilih kombinasi visual+layout+animasi+komponen sesuai niche, ambil kode dari references/component-templates.md, lalu wajib cek references/avoid-ai-slop.md sebelum selesai. TIDAK relevan untuk task backend/database/API murni tanpa elemen visual.
---

# Web Design 2026 — Knowledge Base & Template Kit

Skill ini rujukan tren desain web/UI modern (2026) yang dikurasi dari riset user + riset internet, plus kumpulan template kode siap pakai. Tujuannya: biar AI coding agent tidak "menebak" desain generik, tapi punya katalog konkret + alasan kapan pakai apa. Dipakai lintas project (KontrakPaham, PromptForge, JalaJO ecosystem, dan project baru ke depannya) — jadi rekomendasi di sini sengaja general per-niche, bukan spesifik ke satu produk.

## Kapan TIDAK perlu skill ini

Skip kalau task-nya murni backend/database/API/business-logic tanpa sentuhan visual (mis. bikin endpoint, migrasi schema, fix bug logic, nulis script otomasi tanpa UI). Skill ini cuma relevan begitu ada elemen yang dilihat/disentuh user.

## Cara pakai skill ini (workflow)

1. **Pahami konteks proyek** — niche (legal-tech, SaaS, komunitas, edukasi, portfolio, e-commerce), target user, dan vibe yang diinginkan (profesional/trustworthy vs playful vs premium vs minimalis).
2. **Pilih arah visual & layout** pakai tabel rekomendasi niche di bawah, atau baca `references/style-layout-motion.md` untuk katalog lengkap kategori visual style, layout, dan motion/animasi.
3. **Pilih komponen per section** (hero, navbar, pricing, FAQ, footer, dst) dari `references/components-and-sections.md`.
4. **Cek update tren terbaru 2026** di `references/trend-update-2026.md` — ini hasil riset tambahan (bukan cuma dari list awal Arya) supaya rekomendasi tidak ketinggalan.
5. **Ambil kode template** dari `references/component-templates.md` — copy-paste dan sesuaikan (Tailwind/vanilla CSS/HTML), bukan generate dari nol tiap kali kalau pattern-nya sudah standar.
6. **Wajib cek hasil akhir terhadap `references/avoid-ai-slop.md`** sebelum kirim ke user — ini daftar ciri konkret desain AI-generated (font default, gradient ungu-biru, aurora background default, badge/stats hero tanpa bukti, dashboard mockup generik, komponen seragam sempurna, copy generik, dst) beserta fix-nya. Jangan skip langkah ini walau desainnya sudah "terlihat modern" — modern dan generik bisa terjadi bersamaan.
7. **Selalu cek non-negotiables** di bagian bawah file ini sebelum kirim hasil: performance dan accessibility.

Jangan pakai semua tren sekaligus dalam satu halaman — pilih 5-8 elemen yang koheren, bukan katalog lengkap ditumpuk jadi satu.

## Tabel rekomendasi berdasarkan niche

| Niche | Visual direction | Layout | Vibe animasi | Komponen kunci |
|---|---|---|---|---|
| Legal-tech / profesional (mis. KontrakPaham) | Editorial typography, monochrome + 1 accent color, high contrast, refined glassmorphism tipis | Split-screen atau card-based, dashboard-like untuk app view | Micro-interactions halus, scroll reveal ringan — hindari animasi berat yang terkesan tidak serius | Before-after slider (demo deteksi risiko klausul), comparison table, trust badge, FAQ accordion, dashboard-like preview |
| SaaS / developer tool | Neo-grotesk sans, dark mode default, aurora/mesh gradient, bento grid | Bento grid, full-screen hero | Kinetic typography di headline, command palette, sticky feature explanation | Pricing card w/ toggle, feature grid, code snippet showcase, logo cloud |
| Komunitas / edukasi (JalaForum, JalaEdu) | Warna hangat/dopamine yang approachable, human-crafted feel (ilustrasi, foto asli), rounded corners besar | Card-based, masonry grid untuk konten | Playful micro-interactions, mascot/character kalau relevan | Testimonial carousel, progress/gamified elements, conversational form |
| Portfolio / creative | Maximalist atau editorial, oversized typography, custom illustration | Horizontal scroll showcase, asymmetrical layout | Scrollytelling, page/view transition, cursor interaction | Filterable gallery, project modal, case study card |
| E-commerce | Dopamine color / vibrant, high-quality product photography | Grid masonry, split-screen | Image zoom on hover, smart CTA | Product card, before-after slider, ROI/product configurator |

Kalau niche tidak masuk kategori di atas, tanya Arya vibe yang diinginkan dulu (profesional vs playful vs premium) daripada asal pilih.

## Prinsip "jangan generic AI-slop"

Riset 2026 soal "AI slop web design" nemuin pola yang sama berulang: AI builder condong ke pilihan paling umum secara statistik (font, gradient, layout tertentu) karena itu yang paling sering muncul di training data, bukan karena itu pilihan terbaik untuk brand tertentu. Detail lengkap ciri-ciri konkretnya + cara fix ada di **`references/avoid-ai-slop.md`** — file ini WAJIB dicek di langkah 6 workflow di atas, bukan opsional. Ringkasnya: pilih font/warna/copy yang spesifik ke brand (lolos test "bisa dipasang di brand lain tanpa berubah makna?" = belum cukup spesifik), variasikan radius/spacing dengan sengaja, dan pastikan motion punya tujuan (bukan fade-in seragam di semua elemen).

## Non-negotiables sebelum selesai

- **Performance**: lazy load gambar, pakai AVIF/WebP, hindari 3D/animasi berat di atas fold, cek Core Web Vitals (LCP, CLS).
- **Accessibility**: kontras cukup, keyboard navigation, semantic HTML/heading hierarchy, `prefers-reduced-motion` dihormati.
- **Machine Experience (MX)**: karena makin banyak traffic datang dari AI agent/LLM crawler, pastikan struktur HTML semantik dan heading hierarchy benar (H1-H6) — bukan cuma div soup — supaya AI assistant lain bisa "membaca" produk dengan benar. Detail di `trend-update-2026.md`.
- **Mobile-first**: cek behavior bento grid / grid kompleks lain saat collapse ke 1 kolom di mobile — jangan sampai narrative flow rusak.

## Reference files

- `references/style-layout-motion.md` — katalog lengkap: typography, warna/tekstur, ilustrasi/asset, layout, motion & animasi (dari list asli Arya, dirapikan per kategori).
- `references/components-and-sections.md` — komponen UI per bagian halaman (navbar, hero, cards, forms, pricing, FAQ, footer) + fitur UX modern (AI copilot, personalization, dsb).
- `references/tech-stack-and-ux.md` — tools/teknologi (GSAP, Framer Motion, Three.js, View Transition API, container queries, dsb), UX pattern, performance & accessibility checklist.
- `references/trend-update-2026.md` — tambahan tren terbaru dari riset internet (dopamine color revival, organic/anti-grid layout, tactile brutalism, light skeuomorphism, vw/kinetic typography, MX design, motion-as-branding) yang belum ada di list asli.
- `references/component-templates.md` — kode template siap pakai (HTML/CSS/Tailwind) untuk komponen paling sering dipakai: hero, floating navbar, bento grid, glass card, pricing card toggle, FAQ accordion, before-after slider, animated counter.
- `references/avoid-ai-slop.md` — **wajib dibaca & dicek**, bukan opsional. Daftar konkret ciri desain AI-generated (font default, gradient ungu-biru, aurora background reflex, badge/stats hero tanpa bukti, dashboard mockup generik, komponen seragam sempurna, copy generik/aspirational, dst) beserta fix-nya, plus pre-ship checklist dan pattern spesifik yang sudah pernah dikritik di produk Arya sendiri (KontrakPaham).
- `references/palette-and-type-starters.md` — pengganti KONKRET (font + hex warna, bukan cuma "pilih yang distinctive") per niche, supaya rekomendasi di `avoid-ai-slop.md` benar-benar bisa dieksekusi tanpa balik ke default AI karena tidak ada alternatif jelas.

## Catatan pemeliharaan

Isi skill ini snapshot riset per **Juli 2026** — tren desain (terutama `trend-update-2026.md` dan `avoid-ai-slop.md`, karena "pattern AI generik" ikut berubah tiap ada AI builder baru) bisa basi dalam 6-12 bulan. Kalau sekarang sudah lewat pertengahan 2027 atau lebih, dan agent yang pakai skill ini punya akses web search: lakukan riset ulang singkat ("web design trends [tahun ini]", "AI slop web design [tahun ini]") sebelum mengandalkan rekomendasi di sini secara mentah-mentah — khususnya bagian warna/typography yang paling cepat berubah.
