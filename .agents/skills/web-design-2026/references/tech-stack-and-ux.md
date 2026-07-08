# Tech Stack, Performance & Accessibility

## Library/Tools Animasi & Visual

- **GSAP** — animasi kompleks: scroll trigger, timeline, text reveal, parallax. Paling powerful untuk kontrol presisi.
- **Framer Motion** — animasi UI di React/Next.js, lebih deklaratif.
- **Three.js / WebGL** — 3D interaktif, particle, globe, product viewer. Berat, pakai hanya kalau benar-benar perlu depth/storytelling.
- **Spline embed** — cara cepat masukin objek 3D interaktif tanpa nulis WebGL manual.
- **Lottie** — animasi ringan berbasis JSON untuk icon/illustration/loading.

## CSS & Web Platform Modern

- **CSS `clamp()`** — fluid typography & spacing tanpa media query berlebihan.
- **Container queries** — layout berubah berdasarkan ukuran container, bukan cuma viewport. Penting untuk komponen reusable (card yang dipakai di grid berbeda-beda lebar).
- **Scroll-driven CSS animation / scroll timeline** — animasi berbasis posisi scroll native CSS, mengurangi ketergantungan JS berat.
- **View Transition API** — transisi antar-halaman/komponen native browser.
- **`backdrop-filter` blur, CSS mask, clip-path, blend mode** — untuk glassmorphism dan reveal effect tanpa asset tambahan.
- **CSS Grid + Subgrid** — bento grid dan layout kompleks lain.
- **AVIF/WebP image, lazy loading** — wajib untuk performance.

## Performance & Core Web Vitals

Website modern harus cepat, bukan cuma terlihat bagus:

- Compress & pakai format gambar modern (AVIF/WebP).
- Lazy load gambar/video di luar viewport.
- Code splitting & tree shaking, minify CSS/JS.
- Preload critical assets (font, hero image).
- Hindari layout shift (reserve space untuk gambar/font).
- Hindari 3D asset/animasi berat yang tidak proporsional dengan value-nya.
- SSR/static generation kalau memungkinkan + CDN + caching.

Kalau ada trade-off antara "efek keren" vs "cepat", performance menang untuk halaman conversion-critical (landing page, checkout). Efek berat OK untuk halaman showcase/portfolio yang memang dikunjungi untuk experience.

## Accessibility Checklist

- Kontras warna cukup (WCAG AA minimum) — termasuk di dark mode.
- Keyboard navigation & focus state jelas untuk semua interactive element.
- Alt text gambar, ARIA label bila perlu, semantic HTML, heading hierarchy benar (H1→H6, jangan skip level).
- `prefers-reduced-motion` dihormati — sediakan versi animasi minimal.
- Touch target cukup besar di mobile, tidak hanya mengandalkan warna untuk menyampaikan informasi (mis. status error).
- Modal, dropdown, carousel harus accessible (trap focus, Esc untuk close, dsb).
- Skip-to-content link.

## Machine Experience (MX) — konteks tambahan 2026

Selain manusia, makin banyak traffic datang dari AI agent/LLM (ChatGPT, Claude, Perplexity, dsb) yang membaca *raw semantic code*, bukan tampilan visual. Implikasi teknis:
- Component logic & heading hierarchy harus benar secara struktural — jangan cuma `<div>` soup dengan class visual.
- ARIA labeling akurat membantu AI assistant lain "mengutip" data bisnis dengan benar.
- Ini sejalan dengan accessibility checklist di atas — good semantic HTML sekarang punya dua penerima manfaat: screen reader user dan AI crawler.

Relevan khusus untuk produk seperti KontrakPaham yang kontennya (hasil analisis kontrak, pricing, FAQ legal) berpotensi dikutip/dibaca AI assistant lain.

### Implementasi konkret MX (jangan cuma teori)

```html
<!-- Structured data biar AI crawler/LLM paham konteks produk, bukan cuma manusia -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "KontrakPaham",
  "applicationCategory": "BusinessApplication",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "IDR" },
  "description": "Deteksi klausul berisiko dalam kontrak dengan penjelasan bahasa awam."
}
</script>
```

- FAQ section idealnya juga pakai `FAQPage` schema kalau memang berupa Q&A statis (bukan AI chat dinamis).
- Heading hierarchy: satu `<h1>` per halaman, `<h2>` untuk section utama, `<h3>` untuk sub-bagian — jangan skip level (mis. `<h1>` langsung ke `<h4>`) walau secara visual ukurannya sudah pas.
- `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>` — pakai elemen semantic HTML5, bukan `<div class="nav">` untuk semuanya.
