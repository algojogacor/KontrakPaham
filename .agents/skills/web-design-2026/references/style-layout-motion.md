# Style, Layout & Motion Catalog (2026)

Katalog ini dirapikan dari riset Arya. Pakai sebagai menu pilihan, bukan checklist wajib semua dipakai.

## A. Typography

- **Oversized typography** — headline sangat besar sebagai elemen visual utama hero.
- **Kinetic typography** — teks bergerak/reveal per kata/huruf, morphing, mengikuti scroll.
- **Variable font** — weight/width/optical size berubah dinamis.
- **Editorial typography** — gaya majalah: headline besar, body rapi, hierarchy kuat.
- **Serif modern** — kesan premium/akademik/luxury.
- **Neo-grotesk sans serif** — bersih, tech, corporate, startup.
- **Monospace accent** — untuk label kecil, angka, metadata, badge, tech vibe.
- **Condensed font** — headline kuat, ramping.
- **Gradient text / outlined text** — dekoratif.
- **Split/scramble text animation, number counter animation** — untuk statistik/reveal.

## B. Warna, Background, Texture

- **Dark mode design** — didesain dari awal untuk gelap, bukan sekadar invert warna.
- **Light mode minimal / dual theme** — banyak white space, atau toggle light-dark.
- **Aurora gradient, mesh gradient, animated gradient** — background lembut bergerak.
- **Radial glow, noise/grain texture, paper texture** — biar tidak flat/steril.
- **Glassmorphism → refined glassmorphism** — versi 2026 lebih halus, tidak ganggu keterbacaan.
- **Neumorphism, claymorphism** — bentuk 3D lembut seperti clay/plastic.
- **Neo-brutalism** — kontras tegas, border tebal, shadow kasar, berani.
- **Monochrome + accent color / duotone** — konsisten dan kuat.
- **Tactile/handmade texture** — grain, collage, foto analog, brush, cut-out — melawan kesan "AI-polished".

> Update 2026: warna vibrant/dopamine (neon pink, electric blue) kembali populer untuk brand lifestyle/youth — lihat `trend-update-2026.md`.

## C. Ilustrasi, Gambar, Asset Visual

- **SVG illustration / animated SVG** (path drawing, morphing).
- **Lottie animation** — icon, loading, empty state.
- **3D object, interactive 3D, Spline embed, Three.js/WebGL scene** — hero/produk/dekorasi; hati-hati performance.
- **Product mockup / floating mockup / screenshot UI showcase**.
- **Custom illustration, abstract illustration, mascot/character**.
- **AI-generated visual** — perlu dikurasi ulang biar tidak terlihat generik.
- **Collage visual, cut-out photo, organic blob**.
- **Icon system** — outline/filled/duotone/3D/animated, konsisten satu set.
- **Data visualization, particle background, shader effect**.

## D. Layout & Komposisi

- **Bento grid** — modular grid ala dashboard Apple; masih dominan 2026, tapi hati-hati saat collapse ke mobile (lihat catatan MX di `trend-update-2026.md`).
- **Card-based layout, asymmetrical layout, split-screen layout**.
- **Editorial layout** — grid dinamis ala majalah.
- **Full-screen hero, minimalist layout, maximalist layout**.
- **Layered/overlapping elements, masonry grid, dashboard layout**.
- **One-page storytelling, long-form scrollytelling**.
- **Horizontal scroll section, sticky section layout**.
- **Sidebar navigation layout, floating panel layout**.
- **Modular section system** — dibangun dari blok reusable.
- **Mobile-first stacked layout**.

## E. Motion & Animasi

### Berbasis scroll
Scroll reveal (fade/slide/scale/blur-to-clear), clip-path/image mask reveal, text reveal on scroll, scroll progress, **scroll-driven animation** (CSS scroll-timeline modern — bukan berbasis waktu), pinned section, parallax scrolling (pakai secukupnya), scrollytelling, horizontal scroll animation, timeline scroll animation.

### Elemen
SVG path drawing/morphing/stroke, icon animation, button/card hover (magnetic button, glow, ripple, tilt, 3D hover), image zoom on hover, border/underline animation, cursor-follow animation, drag interaction, accordion/dropdown/menu open-close, modal transition, toast notification, loading/skeleton animation, success/error animation, form validation animation, **micro-interactions** (feedback klik/hover/toggle/loading/empty state — bikin UI terasa hidup).

### Transisi halaman
Page fade/slide transition, morph transition, shared element transition, card-to-page transition, route transition, **View Transition API** — native browser API untuk transisi antar-view/halaman yang smooth.

## Kapan hindari

- Parallax/3D berat di atas fold — resiko performance & motion sickness.
- Animasi non-fungsional yang cuma "biar keren" tanpa membantu clarity — 2026 pattern lebih ke "functional animation".
- Selalu sediakan fallback untuk `prefers-reduced-motion`.
