"use client";

import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck, FileText, Upload, ScanText, Brain, Lightbulb,
  FileDown, History, Clock, Lock, ArrowRight, Check,
  AlertTriangle, Scale, BookOpen, HelpCircle, BarChart3, Sparkles, Zap,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export function HomeView() {
  const { user, setView } = useApp();

  return (
    <div>
      {/* ============ EDITORIAL HERO ============ */}
      <section className="relative overflow-hidden border-b border-border bg-paper">
        <div className="absolute inset-0 bg-dots opacity-40" />
        <div className="absolute inset-0 bg-radial-fade" />
        {/* Floating amber blob */}
        <div className="pointer-events-none absolute -right-20 top-20 h-72 w-72 rounded-full bg-[oklch(0.7_0.16_70/0.12)] blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-[oklch(0.36_0.075_158/0.1)] blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
          {/* Left: editorial copy */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground backdrop-blur animate-fade-in-up">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              Analisis Kontrak · Bahasa Indonesia
            </div>

            <h1 className="mt-6 font-display text-[2.75rem] font-semibold leading-[1.02] tracking-tight text-ink animate-fade-in-up stagger-1 sm:text-6xl lg:text-[4.5rem]">
              Baca kontrak
              <br />
              seperti{" "}
              <span className="relative inline-block">
                <em className="text-amber-gradient not-italic" style={{ fontStyle: "italic", fontWeight: 500 }}>
                  ahli hukum
                </em>
                <svg className="absolute -bottom-2 left-0 w-full" height="10" viewBox="0 0 200 10" preserveAspectRatio="none" fill="none">
                  <path d="M2 7 Q 50 2, 100 6 T 198 5" stroke="oklch(0.7 0.16 70)" strokeWidth="3" strokeLinecap="round" fill="none" />
                </svg>
              </span>
              <br />
              dalam 60 detik.
            </h1>

            <p className="mt-7 max-w-xl text-pretty text-lg leading-relaxed text-ink-soft animate-fade-in-up stagger-2">
              Unggah PDF, DOCX, atau tempel teks kontrak. AI mendeteksi klausul yang
              berpotensi <span className="marker-amber font-medium text-foreground">merugikan Anda</span>,
              menjelaskannya dalam bahasa awam, dan memberi saran tindakan sebelum Anda tanda tangan.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center animate-fade-in-up stagger-3">
              <Button
                size="lg"
                className="h-13 gap-2 rounded-full px-7 text-base shadow-ink transition-transform hover:scale-[1.02]"
                onClick={() => setView(user ? "analyze" : "signup")}
              >
                {user ? "Analisis Kontrak" : "Mulai Gratis"}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="h-13 gap-1.5 rounded-full px-5 text-base text-foreground hover:bg-accent/50"
                onClick={() => setView("samples")}
              >
                <Sparkles className="h-4 w-4 text-primary" />
                Lihat contoh dulu
              </Button>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground animate-fade-in-up stagger-4">
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> 3 analisis gratis / bulan</span>
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> Tanpa kartu kredit</span>
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> Hasil ~1 menit</span>
            </div>
          </div>

          {/* Right: live contract annotation visual */}
          <div className="relative animate-slide-in-right stagger-2">
            <ContractAnnotationVisual />
          </div>
        </div>
      </section>

      {/* ============ MARQUEE / SOCIAL PROOF STRIP ============ */}
      <section className="border-b border-border bg-foreground text-background">
        <div className="mx-auto max-w-6xl px-4 py-5">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-center text-sm">
            <span className="flex items-center gap-2 font-display italic">"</span>
            <span className="flex items-center gap-2"><ScanText className="h-4 w-4 text-primary-foreground/70" /> PDF scan dibaca otomatis (OCR)</span>
            <span className="text-background/30">·</span>
            <span className="flex items-center gap-2"><Brain className="h-4 w-4 text-primary-foreground/70" /> 16 kategori klausul</span>
            <span className="text-background/30">·</span>
            <span className="flex items-center gap-2"><FileDown className="h-4 w-4 text-primary-foreground/70" /> Export PDF report</span>
            <span className="text-background/30">·</span>
            <span className="flex items-center gap-2"><Scale className="h-4 w-4 text-primary-foreground/70" /> Edukasi, bukan nasihat definitif</span>
          </div>
        </div>
      </section>

      {/* ============ PROBLEM (editorial) ============ */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="max-w-2xl">
            <SectionEyebrow>Masalahnya</SectionEyebrow>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
              Kontrak bukan buku cerita —<br />
              <span className="text-ink-soft">tapi Anda membacanya begitu.</span>
            </h2>
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              { icon: AlertTriangle, num: "01", title: "Tanda tangan tanpa baca", desc: "Klausul denda, pengalihan risiko, dan kewajiban sepihak sering tersembunyi di pasal panjang yang Anda skip." },
              { icon: Scale, num: "02", title: "Jasa hukum mahal & intimidatif", desc: "Konsultasi advokat tidak murah. Banyak orang ragu bertanya karena takut terlihat tidak paham." },
              { icon: Clock, num: "03", title: "Deadline hari ini", desc: "Agent/penjual minta tanda tangan hari itu juga. Anda butuh gambaran risiko dalam menit, bukan hari." },
            ].map((p, i) => (
              <div key={i} className={`group border-l-2 border-border pl-5 transition-colors hover:border-primary animate-fade-in-up stagger-${i + 1}`}>
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-2xl font-light text-primary/60">{p.num}</span>
                  <p.icon className="h-5 w-5 text-ink-soft" />
                </div>
                <h3 className="mt-3 font-display text-xl font-semibold text-ink">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS (editorial) ============ */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="max-w-2xl">
            <SectionEyebrow>Cara kerja</SectionEyebrow>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
              Tiga langkah, cukup dari HP.
            </h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { icon: Upload, step: "01", title: "Unggah atau tempel", desc: "PDF (termasuk scan — OCR otomatis), DOCX, atau salin teks. Bahasa Indonesia." },
              { icon: Brain, step: "02", title: "AI analisis klausul", desc: "Sistem memetakan klausul berisiko per kategori: denda, jangka waktu, sepihak, pengalihan risiko." },
              { icon: Lightbulb, step: "03", title: "Pahami & tentukan langkah", desc: "Penjelasan bahasa awam + saran tindakan. Export PDF, atau konsultasi lanjutan." },
            ].map((s, i) => (
              <Card key={i} className={`group relative overflow-hidden border-border/60 bg-card/80 backdrop-blur transition-all hover:-translate-y-1 hover:shadow-soft-lg animate-fade-in-up stagger-${i + 1}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                      <s.icon className="h-6 w-6" />
                    </div>
                    <span className="font-display text-5xl font-light text-primary/15">{s.step}</span>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-ink">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FEATURES (editorial bento) ============ */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="max-w-2xl">
            <SectionEyebrow>Fitur</SectionEyebrow>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
              Dibuat untuk orang awam,<br />
              <span className="text-ink-soft">bukan untuk developer.</span>
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: ScanText, title: "OCR untuk PDF scan", desc: "Foto/scan kontrak lama? Sistem baca gambar otomatis tanpa Anda mengetik ulang.", span: "lg:col-span-2" },
              { icon: FileText, title: "Klausul asli + bahasa awam", desc: "Teks asli berdampingan dengan penjelasan sederhana." },
              { icon: AlertTriangle, title: "Tingkat risiko & urgensi", desc: "Setiap temuan ada label RENDAH→KRITIS." },
              { icon: FileDown, title: "Export PDF rapi", desc: "Simpan & bagikan laporan ke keluarga/penjamin." },
              { icon: History, title: "Riwayat tersimpan", desc: "Lihat & unduh ulang kapan saja. Anda punya kontrol penuh.", span: "lg:col-span-2" },
              { icon: Lock, title: "Keamanan dasar", desc: "Password di-hash, rate limiting, sesi kedaluwarsa." },
            ].map((f, i) => (
              <Card key={i} className={`group relative overflow-hidden border-border/60 transition-all hover:border-primary/40 hover:shadow-soft animate-fade-in-up stagger-${(i % 6) + 1} ${f.span || ""}`}>
                <CardContent className="h-full p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/60 text-accent-foreground transition-transform group-hover:scale-110">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 font-display text-base font-semibold text-ink">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HONEST DISCLAIMER ============ */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <Card className="overflow-hidden border-amber-500/30 bg-gradient-to-br from-amber-50/80 to-card dark:from-amber-950/20">
            <CardContent className="flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                <Scale className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-semibold text-ink">Jujur soal batasan kami</h3>
                  <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300">Transparan</Badge>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  KontrakPaham dikelola oleh <strong className="text-ink">mahasiswa hukum tingkat akhir, bukan advokat berlisensi</strong>.
                  Hasil analisis bersifat edukasi & gambaran risiko — bukan nasihat hukum definitif. Untuk keputusan
                  penting, konsultasikan dengan advokat berlisensi. Kami transparan soal ini dari awal.
                </p>
              </div>
              <Button variant="outline" onClick={() => setView("consultation")} className="shrink-0 rounded-full border-amber-500/40 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300">
                Konsultasi lanjutan <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ============ RESOURCES ============ */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="max-w-2xl">
            <SectionEyebrow>Lebih dari analisis</SectionEyebrow>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
              Sumber belajar & alat bantu.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ResourceCard emoji="📄" icon={FileText} title="Contoh Kontrak" desc="Coba analisis 4 contoh nyata: sewa kos, freelance, PKWT, renovasi." onClick={() => setView("samples")} cta="Lihat contoh" />
            <ResourceCard emoji="📚" icon={BookOpen} title="Glosarium Hukum" desc="Istilah hukum (denda, arbitrase, force majeure) dijelaskan bahasa awam." onClick={() => setView("glossary")} cta="Buka glosarium" />
            <ResourceCard emoji="❓" icon={HelpCircle} title="FAQ" desc="Jawaban pertanyaan umum soal analisis, keamanan, dan keterbatasan." onClick={() => setView("faq")} cta="Baca FAQ" />
            <ResourceCard emoji="📊" icon={BarChart3} title="Insight & Statistik" desc={user ? "Pola risiko dari riwayat analisis Anda." : "Pola risiko dari analisis Anda (setelah masuk)."} onClick={() => setView(user ? "insights" : "signup")} cta={user ? "Lihat insight" : "Daftar dulu"} />
          </div>
        </div>
      </section>

      {/* ============ CTA (bold) ============ */}
      <section className="relative overflow-hidden bg-ink text-background">
        <div className="absolute inset-0 bg-dots opacity-20" />
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[oklch(0.7_0.16_70/0.15)] blur-3xl" />
        <div className="pointer-events-none absolute -left-32 -bottom-32 h-96 w-96 rounded-full bg-[oklch(0.36_0.075_158/0.2)] blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:py-28">
          <div className="inline-flex items-center gap-2 rounded-full border border-background/20 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-background/70">
            <Zap className="h-3 w-3 text-amber-300" /> Mulai sekarang
          </div>
          <h2 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Kontrak berikutnya,<br />
            <em className="text-amber-gradient not-italic" style={{ fontStyle: "italic" }}>baca dulu, baru tanda tangan.</em>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-background/70">
            Gratis. 3 analisis per bulan. Tanpa kartu kredit. Hasil dalam ~1 menit.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              variant="secondary"
              className="h-13 gap-2 rounded-full px-7 text-base shadow-ink transition-transform hover:scale-[1.02]"
              onClick={() => setView(user ? "analyze" : "signup")}
            >
              {user ? "Analisis Kontrak" : "Daftar Gratis"}
              <ArrowRight className="h-4 w-4" />
            </Button>
            {!user && (
              <Button size="lg" variant="ghost" className="h-13 rounded-full px-5 text-base text-background hover:bg-background/10" onClick={() => setView("signin")}>
                Saya sudah punya akun
              </Button>
            )}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-background/60">
            <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Tanpa kartu kredit</span>
            <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Data Anda milik Anda</span>
            <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Bisa dihapus kapan saja</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
      <span className="h-px w-6 bg-primary/40" />
      {children}
    </div>
  );
}

function ContractAnnotationVisual() {
  return (
    <div className="relative">
      {/* Floating risk meter badge */}
      <div className="absolute -left-4 -top-4 z-20 rotate-[-4deg] animate-fade-in stagger-4">
        <div className="flex items-center gap-2 rounded-xl bg-ink px-3 py-2 text-background shadow-ink">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/90 text-sm font-bold text-white">75</div>
          <div className="leading-tight">
            <p className="text-[10px] uppercase tracking-wider text-background/60">Skor risiko</p>
            <p className="text-xs font-semibold">TINGGI</p>
          </div>
        </div>
      </div>

      {/* Document card */}
      <Card className="relative overflow-hidden border-border/60 bg-card shadow-ink gradient-border">
        {/* Window chrome */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2.5">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">kontrak-sewa.pdf · halaman 2</span>
        </div>

        <CardContent className="p-5 sm:p-6">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Pasal 4 — Denda Keterlambatan</p>
          <p className="mt-3 font-display text-[15px] leading-[1.7] text-ink">
            Apabila Pihak Kedua terlambat membayar sewa, Pihak Kedua dikenakan denda{" "}
            <span className="risk-underline font-medium">sebesar 2% per hari</span> dari nilai sewa bulanan.
            Keterlambatan lebih dari 7 hari memberikan{" "}
            <span className="marker-amber font-medium">hak kepada Pihak Pertama untuk memutuskan kontrak sepihak</span>{" "}
            dan mengosongkan rumah tanpa proses pengadilan.
          </p>

          {/* Annotation callouts */}
          <div className="mt-5 space-y-2.5">
            <AnnotationRow
              color="red"
              label="Denda 2%/hari"
              detail="Setara ~730%/tahun. Bunga bank ~0,1%/hari."
            />
            <AnnotationRow
              color="amber"
              label="Pemutusan sepihak"
              detail="Hanya Pihak Pertama yang bisa memutus, tanpa pengadilan."
            />
          </div>

          {/* Bottom suggestion */}
          <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-primary/30 bg-primary/5 p-3">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Saran</p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
                Negosiasi maksimal 0,1%/hari atau denda nominal tetap. Tambah klausul grace period 3 hari.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Floating tag */}
      <div className="absolute -bottom-3 -right-3 z-20 rotate-[3deg] animate-fade-in stagger-5">
        <div className="rounded-xl bg-primary px-3 py-2 text-primary-foreground shadow-ink">
          <p className="text-[10px] uppercase tracking-wider opacity-80">Ditemukan</p>
          <p className="text-sm font-bold">6 klausul berisiko</p>
        </div>
      </div>
    </div>
  );
}

function AnnotationRow({ color, label, detail }: { color: "red" | "amber"; label: string; detail: string }) {
  const styles = {
    red: "border-red-500/30 bg-red-500/5",
    amber: "border-amber-500/30 bg-amber-500/5",
  };
  const dot = {
    red: "bg-red-500",
    amber: "bg-amber-500",
  };
  return (
    <div className={`flex items-start gap-2.5 rounded-lg border ${styles[color]} p-2.5`}>
      <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${dot[color]}`} />
      <div className="min-w-0">
        <p className="text-xs font-semibold text-ink">{label}</p>
        <p className="text-[11px] leading-relaxed text-ink-soft">{detail}</p>
      </div>
    </div>
  );
}

function ResourceCard({
  emoji,
  icon: Icon,
  title,
  desc,
  onClick,
  cta,
}: {
  emoji: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  onClick: () => void;
  cta: string;
}) {
  return (
    <button onClick={onClick} className="group text-left">
      <Card className="h-full overflow-hidden border-border/60 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-soft-lg">
        <CardContent className="flex h-full flex-col p-5">
          <div className="flex items-center justify-between">
            <span className="text-2xl">{emoji}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
              <Icon className="h-4 w-4" />
            </div>
          </div>
          <h3 className="mt-3 font-display font-semibold text-ink">{title}</h3>
          <p className="mt-1 flex-1 text-sm leading-relaxed text-ink-soft">{desc}</p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
            {cta}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </CardContent>
      </Card>
    </button>
  );
}
