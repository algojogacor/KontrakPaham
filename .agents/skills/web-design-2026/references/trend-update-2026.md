# Update Tren 2026 (Hasil Riset Tambahan)

List ini melengkapi list asli Arya dengan tren yang muncul dari riset sumber design 2026 terkini (Figma, Elementor, Behance, Fireart Studio, Wix, Squarespace, Vistaprint, Designmodo — pertengahan 2026). Beberapa poin ini kontradiktif satu sama lain (mis. maximalist vs minimalist) karena memang jadi dua arah paralel yang sama-sama valid tergantung brand — pilih sesuai niche, jangan campur aduk.

## 1. Warna: "Dopamine design" comeback

Setelah beberapa tahun minimalis/muted, palet cerah dan saturated (neon pink, electric blue, bold red) balik populer — didorong nostalgia Y2K dan "dopamine design" aesthetic. Cocok untuk brand lifestyle, beauty, youth-focused, atau produk komunitas/edukasi yang mau terasa hidup dan optimis. **Bukan** untuk niche legal/finansial yang butuh kesan trustworthy — di situ tetap pakai monochrome + 1 accent atau earthy palette.

## 2. Organic / Anti-grid layout

Setelah bertahun-tahun grid ketat, 2026 bergeser ke layout organik: bentuk lengkung, soft gradient, layered mask, layout tidak beraturan (anti-grid) yang terasa lebih "human" dan hangat — reaksi terhadap dunia yang makin otomatis/AI-driven. Rounded corners besar (radius 30-50px) jadi visual hierarchy pengganti grid tegas di beberapa desain card-based.

## 3. Tactile brutalism & Machine Experience (dual movement)

Ada dua arah paralel:
- **Tactile brutalism** — geometri mentah, kontras warna agresif, tekstur fisik simulasi (grain, paper) untuk membuktikan "human authorship" di tengah banjir situs vibe-coded/AI-generated yang mulai terasa seragam.
- **Machine Experience (MX)** — di baliknya, engineering-nya justru mengoptimalkan struktur data (semantic HTML, heading hierarchy, ARIA) supaya AI crawler/LLM bisa membaca konten dengan benar. Lihat detail teknis di `tech-stack-and-ux.md`.

Praktisnya: tampilan boleh berani dan personal, tapi fondasi kode tetap harus bersih secara semantic.

## 4. Typography sebagai arsitektur utama, bukan pelengkap

Font di-scale pakai viewport unit (`vw`) sampai satu kata memenuhi lebar layar — teks jadi focal point pengganti stock photography, sekaligus mengurangi page weight (tidak perlu asset gambar besar). Didukung penuh oleh browser modern untuk variable fonts. Kinetic typography kini sering diimplementasikan sebagai **scroll-driven manipulation**: font-weight/width berubah real-time mengikuti posisi scroll (bukan cuma fade in/out biasa). Pairing populer: Neo-Serif + Monospace.

## 5. Light skeuomorphism

Skeuomorphism versi ringan kembali: shadow halus, gradasi lembut, permukaan sedikit timbul (embossed) untuk kesan tactile tanpa realisme berat ala UI lama. Kombinasi gaya awal Apple UI + 3D realism yang lebih cerah. Cocok untuk brand yang mau terasa hangat/approachable tanpa jatuh ke neumorphism yang terlalu flat.

## 6. Resonant stark minimalism

Varian minimalism baru: layout di-strip ke esensial, tapi tetap dikasih detail emosional halus (ultra-thin font, soft gradient, whitespace luas + micro-interactions ringan) — beda dari minimalism lama yang terasa dingin/kaku.

## 7. Motion sebagai bahasa branding

Animasi bukan cuma hiasan tapi jadi identitas brand: logo yang "unfold" dengan cara khas, scroll-triggered animation yang match ritme brand — jadi penanda yang dikenali user di berbagai touchpoint (bukan cuma di landing page).

## 8. AI node-based design workflow (konteks proses, bukan output)

Designer makin pakai tools node-based (visual, connect model-prompt-data-logic) untuk build AI workflow di dalam produk (bukan cuma pakai AI buat bikin desain). Relevan kalau Arya mau expose "AI reasoning flow" di UI produk (mis. bagaimana KontrakPaham menganalisis klausul) secara visual/transparan ke user.

## 9. Sustainability & lean code sebagai bagian dari desain

Leaner code, gambar teroptimasi, hosting rendah-impact bukan cuma soal performance tapi mulai dianggap bagian dari etika desain 2026 — sejalan dengan poin performance di `tech-stack-and-ux.md`.

## Cara pakai update ini

Jangan asal tambah semua poin di atas ke satu proyek. Tanyakan dulu vibe yang diinginkan (lihat tabel niche di `SKILL.md`), lalu pilih 1-2 poin dari list ini yang paling relevan sebagai "differentiator" — bukan basis seluruh desain.
