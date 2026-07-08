# Component Templates (Copy-Paste, Framework-Agnostic)

Semua template pakai vanilla HTML/CSS/JS + CSS custom properties supaya gampang di-restyle dan di-port ke React/Vue/apapun stack yang dipakai AI builder. Ganti warna lewat variable `--accent`, dsb. Semua sudah menghormati `prefers-reduced-motion` dan pakai semantic HTML.

## 1. Floating Navbar (sticky + shrink on scroll)

```html
<nav class="navbar" id="navbar">
  <a href="#" class="navbar__brand">Brand</a>
  <ul class="navbar__links">
    <li><a href="#features">Fitur</a></li>
    <li><a href="#pricing">Harga</a></li>
    <li><a href="#faq">FAQ</a></li>
  </ul>
  <a href="#cta" class="navbar__cta">Mulai Gratis</a>
</nav>

<style>
.navbar {
  position: sticky; top: 0; z-index: 50;
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.25rem 2rem;
  margin: 1rem auto; max-width: 1100px;
  border-radius: 999px;
  background: color-mix(in srgb, canvas 70%, transparent);
  backdrop-filter: blur(12px);
  border: 1px solid color-mix(in srgb, canvasText 10%, transparent);
  transition: padding 0.3s ease, box-shadow 0.3s ease;
}
.navbar.scrolled { padding: 0.6rem 2rem; box-shadow: 0 8px 30px rgba(0,0,0,0.08); }
.navbar__links { display: flex; gap: 1.5rem; list-style: none; }
.navbar__cta {
  padding: 0.5rem 1.25rem; border-radius: 999px;
  background: var(--accent, #6366f1); color: white; text-decoration: none;
}
</style>

<script>
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
});
</script>
```

## 2. Hero Section (oversized typography + gradient + scroll reveal)

```html
<section class="hero">
  <h1 class="hero__title">Bikin kontrak <span class="hero__title--accent">jelas dalam hitungan menit</span></h1>
  <p class="hero__subtitle">Deteksi klausul berisiko, dapat penjelasan bahasa awam, sebelum tanda tangan.</p>
  <div class="hero__cta-group">
    <a href="#start" class="btn btn--primary">Coba Gratis</a>
    <a href="#demo" class="btn btn--ghost">Lihat Demo</a>
  </div>
</section>

<style>
.hero {
  min-height: 80vh; display: flex; flex-direction: column; justify-content: center;
  padding: 2rem clamp(1.5rem, 5vw, 6rem);
  background: radial-gradient(ellipse at top left, color-mix(in srgb, var(--accent, #6366f1) 15%, transparent), transparent 60%);
}
.hero__title {
  font-size: clamp(2.5rem, 7vw, 5.5rem); line-height: 1.05; font-weight: 700; max-width: 20ch;
}
.hero__title--accent {
  background: linear-gradient(90deg, var(--accent, #6366f1), var(--accent-2, #ec4899));
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.hero__subtitle { margin-top: 1.25rem; font-size: 1.15rem; max-width: 45ch; opacity: 0.75; }
.hero__cta-group { display: flex; gap: 1rem; margin-top: 2rem; }
.btn { padding: 0.85rem 1.75rem; border-radius: 0.75rem; text-decoration: none; font-weight: 600; }
.btn--primary { background: var(--accent, #6366f1); color: white; }
.btn--ghost { border: 1px solid currentColor; }
</style>
```

## 3. Bento Grid (dengan mobile fallback yang aman)

```html
<div class="bento">
  <div class="bento__item bento__item--large">Fitur utama</div>
  <div class="bento__item">Statistik A</div>
  <div class="bento__item">Statistik B</div>
  <div class="bento__item bento__item--wide">Testimoni singkat</div>
</div>

<style>
.bento { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
.bento__item {
  padding: 1.5rem; border-radius: 1.25rem;
  background: color-mix(in srgb, canvasText 4%, canvas);
  border: 1px solid color-mix(in srgb, canvasText 8%, transparent);
}
.bento__item--large { grid-column: span 2; grid-row: span 2; }
.bento__item--wide { grid-column: span 2; }
/* PENTING: di mobile, jangan cuma stack 1 kolom mentah kalau urutan naratifnya penting.
   Kalau urutan penting, reorder manual pakai `order` per breakpoint, jangan andalkan DOM order saja. */
@media (max-width: 720px) {
  .bento { grid-template-columns: 1fr; }
  .bento__item--large, .bento__item--wide { grid-column: span 1; }
}
</style>
```

## 4. Refined Glassmorphism Card

```html
<div class="glass-card">
  <h3>Analisis Klausul</h3>
  <p>Deteksi otomatis klausul berisiko dengan penjelasan bahasa awam.</p>
</div>

<style>
.glass-card {
  padding: 1.75rem; border-radius: 1.25rem;
  background: color-mix(in srgb, canvas 55%, transparent);
  backdrop-filter: blur(16px) saturate(150%);
  border: 1px solid color-mix(in srgb, white 25%, transparent);
  box-shadow: 0 8px 32px rgba(0,0,0,0.08);
}
/* "Refined" = pastikan teks di dalam glass-card tetap kontras tinggi. Test di background terang & gelap. */
</style>
```

## 5. Pricing Card dengan Monthly/Yearly Toggle

```html
<div class="pricing-toggle">
  <span>Bulanan</span>
  <label class="switch">
    <input type="checkbox" id="billingToggle" />
    <span class="switch__slider"></span>
  </label>
  <span>Tahunan <em>(hemat 20%)</em></span>
</div>

<div class="pricing-card">
  <h3>Pro</h3>
  <p class="pricing-card__price">
    <span data-monthly>Rp99rb</span><span data-yearly hidden>Rp79rb</span> / bulan
  </p>
  <ul><li>Analisis kontrak unlimited</li><li>Export PDF</li><li>Konsultasi prioritas</li></ul>
  <a href="#" class="btn btn--primary">Pilih Paket</a>
</div>

<script>
document.getElementById('billingToggle').addEventListener('change', (e) => {
  document.querySelectorAll('[data-monthly]').forEach(el => el.hidden = e.target.checked);
  document.querySelectorAll('[data-yearly]').forEach(el => el.hidden = !e.target.checked);
});
</script>
```

## 6. FAQ Accordion (accessible)

```html
<div class="faq">
  <div class="faq__item">
    <button class="faq__question" aria-expanded="false">
      Apakah data kontrak saya aman?
    </button>
    <div class="faq__answer" hidden>
      Ya, dokumen dienkripsi dan tidak dibagikan ke pihak ketiga.
    </div>
  </div>
</div>

<script>
document.querySelectorAll('.faq__question').forEach(btn => {
  btn.addEventListener('click', () => {
    const answer = btn.nextElementSibling;
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    answer.hidden = expanded;
  });
});
</script>
<!-- aria-expanded + hidden attribute wajib supaya screen reader & keyboard nav bekerja benar -->
```

## 7. Before/After Slider (cocok untuk demo "kontrak asli vs hasil analisis")

```html
<div class="ba-slider" id="baSlider">
  <img src="before.jpg" alt="Kontrak asli" class="ba-slider__before" />
  <div class="ba-slider__after-wrap">
    <img src="after.jpg" alt="Hasil highlight risiko" class="ba-slider__after" />
  </div>
  <input type="range" min="0" max="100" value="50" class="ba-slider__range" id="baRange" />
</div>

<style>
.ba-slider { position: relative; overflow: hidden; border-radius: 1rem; }
.ba-slider img { display: block; width: 100%; }
.ba-slider__after-wrap { position: absolute; inset: 0; width: 50%; overflow: hidden; }
.ba-slider__range { position: absolute; inset: 0; width: 100%; margin: 0; opacity: 0; cursor: ew-resize; }
</style>

<script>
const range = document.getElementById('baRange');
const afterWrap = document.querySelector('.ba-slider__after-wrap');
range.addEventListener('input', (e) => { afterWrap.style.width = e.target.value + '%'; });
</script>
```

## 8. Scroll Reveal (CSS-only via scroll-driven animation, dengan fallback JS)

```css
@supports (animation-timeline: view()) {
  .reveal {
    animation: fade-up linear both;
    animation-timeline: view();
    animation-range: entry 0% cover 30%;
  }
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }
}
@media (prefers-reduced-motion: reduce) {
  .reveal { animation: none !important; opacity: 1 !important; transform: none !important; }
}
```

```js
// Fallback untuk browser yang belum support scroll-timeline (pakai IntersectionObserver)
if (!CSS.supports('animation-timeline: view()')) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => e.target.classList.toggle('is-visible', e.isIntersecting));
  }, { threshold: 0.2 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}
```

## 9. Animated Number Counter

```html
<span class="counter" data-target="12500">0</span>

<script>
document.querySelectorAll('.counter').forEach(el => {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1200;
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    el.textContent = Math.floor(progress * target).toLocaleString('id-ID');
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
});
</script>
```

---

**Catatan umum**: semua warna pakai CSS `color-mix()` + system `canvas`/`canvasText` supaya otomatis adaptif ke light/dark mode tanpa duplikasi style. Kalau target browser AI builder tidak support `color-mix()`/`animation-timeline`, ganti ke value hex statis + IntersectionObserver fallback (sudah disediakan di #8).
