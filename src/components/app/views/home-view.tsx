"use client";

import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Upload, ScanText, Brain, Lightbulb,
  FileDown, History, Clock, Lock, ArrowRight, Check,
  AlertTriangle, Scale, BookOpen, HelpCircle, BarChart3, Heart,
} from "lucide-react";
import { LucideIcon } from "lucide-react";
import {
  HandDrawnCircle, HandDrawnArrow, ReliefIllustration,
  WarmSparkle, WavyDivider, CompanionFigure, WarmBlob,
} from "@/components/app/custom-svg";

export function HomeView() {
  const { user, setView } = useApp();

  return (
    <div>
      {/* ============ TEMAN BACA HERO ============ */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-dots-warm opacity-60" />
        <div className="absolute inset-0 bg-warm-glow" />
        {/* Floating warm blobs */}
        <WarmBlob className="pointer-events-none absolute -right-16 -top-10 h-72 w-72" color="var(--terra)" />
        <WarmBlob className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64" color="var(--sage)" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          {/* Left: warm, direct copy */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur animate-fade-in-up">
              <Heart className="h-3 w-3 text-primary" />
              Teman yang bantu baca kontrak
            </div>

            <h1 className="mt-6 font-display text-[2.5rem] font-semibold leading-[1.05] tracking-tight text-ink animate-fade-in-up stagger-1 sm:text-5xl lg:text-[4.25rem]">
              Kontrak ribet?<br />
              <span className="hand-underline text-terra-gradient">Biar dibacain</span>{" "}
              dulu.
            </h1>

            <p className="mt-6 max-w-lg text-pretty text-base leading-relaxed text-ink-soft animate-fade-in-up stagger-2 sm:text-lg">
              Unggah PDF, DOCX, atau tempel teks kontrak. Seperti teman yang sabar,
              kami baca pelan-pelan, tandai klausul yang{" "}
              <span className="marker-warm font-medium text-foreground">berisiko buat Anda</span>,
              dan jelasin pakai bahasa awam — sebelum Anda tanda tangan.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center animate-fade-in-up stagger-3">
              <Button
                size="lg"
                className="h-12 gap-2 rounded-full px-6 text-base shadow-warm transition-transform hover:scale-[1.02]"
                onClick={() => setView(user ? "analyze" : "signup")}
              >
                {user ? "Baca Kontrak Saya" : "Mulai Gratis"}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 gap-1.5 rounded-full px-5 text-base"
                onClick={() => setView("samples")}
              >
                <WarmSparkle size={14} /> Lihat contoh dulu
              </Button>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground animate-fade-in-up stagger-4">
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> 3 analisis gratis / bulan</span>
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> Tanpa kartu kredit</span>
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> Hasil ~1 menit</span>
            </div>
          </div>

          {/* Right: companion reading visual */}
          <div className="relative animate-slide-in-right stagger-2">
            <CompanionReadingVisual />
          </div>
        </div>
      </section>

      {/* ============ RELIEF ILLUSTRATION STRIP ============ */}
      <section className="border-b border-border bg-muted/20">
        <div className="mx-auto max-w-3xl px-4 py-10 text-center">
          <ReliefIllustration className="mx-auto h-20 w-full max-w-xs" />
          <p className="mt-4 text-sm text-muted-foreground">
            Dari <span className="font-medium text-foreground">bingung dan was-was</span>,{" "}
            ke <span className="font-medium text-foreground">lega dan paham</span> — itulah yang kami kejar.
          </p>
        </div>
      </section>

      {/* ============ CAPABILITY STRIP ============ */}
      <section className="border-b border-border bg-ink text-background">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-center text-sm">
            <span className="flex items-center gap-2"><ScanText className="h-4 w-4 text-primary" /> OCR untuk PDF scan</span>
            <span className="text-background/25">·</span>
            <span className="flex items-center gap-2"><Brain className="h-4 w-4 text-primary" /> 16 kategori klausul</span>
            <span className="text-background/25">·</span>
            <span className="flex items-center gap-2"><FileDown className="h-4 w-4 text-primary" /> Export PDF rapi</span>
            <span className="text-background/25">·</span>
            <span className="flex items-center gap-2"><Scale className="h-4 w-4 text-primary" /> Edukasi, bukan nasihat definitif</span>
          </div>
        </div>
      </section>

      {/* ============ PROBLEM ============ */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="max-w-2xl">
            <SectionLabel>Kenyataan pahit</SectionLabel>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
              Kontrak itu bukan buku cerita,<br />
              <span className="text-ink-soft">tapi Anda membacanya begitu.</span>
            </h2>
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              { icon: AlertTriangle, num: "01", title: "Tanda tangan tanpa baca", desc: "Klausul denda, pengalihan risiko, dan kewajiban sepihak sering tersembunyi di pasal panjang yang Anda skip." },
              { icon: Scale, num: "02", title: "Jasa hukum mahal & intimidating", desc: "Konsultasi advokat tidak murah. Banyak orang ragu bertanya karena takut terlihat tidak paham." },
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

      <WavyDivider className="mx-auto h-2 w-full max-w-6xl opacity-60" />

      {/* ============ HOW IT WORKS ============ */}
      <section className="bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="max-w-2xl">
            <SectionLabel>Cara kerjanya</SectionLabel>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
              Tiga langkah. Cukup dari HP.
            </h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { icon: Upload, step: "01", title: "Unggah atau tempel", desc: "PDF (termasuk scan — OCR otomatis), DOCX, atau salin teks. Bahasa Indonesia." },
              { icon: Brain, step: "02", title: "Dibacain pelan-pelan", desc: "Sistem baca tiap klausul, tandai yang berisiko: denda, jangka waktu, sepihak, pengalihan risiko." },
              { icon: Lightbulb, step: "03", title: "Paham & tenang", desc: "Dapat penjelasan bahasa awam + saran tindakan. Export PDF, atau konsultasi lanjutan." },
            ].map((s, i) => (
              <Card key={i} className={`group relative overflow-hidden border-border/60 transition-all hover:-translate-y-1 hover:shadow-soft-lg animate-fade-in-up stagger-${i + 1}`}>
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

      {/* ============ FEATURES ============ */}
      <section className="border-y border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="max-w-2xl">
            <SectionLabel>Yang Anda dapat</SectionLabel>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
              Dibuat untuk orang awam,<br />
              <span className="text-ink-soft">dengan ketelitian sungguhan.</span>
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: ScanText, title: "OCR untuk PDF scan", desc: "Foto/scan kontrak lama? Sistem baca gambar otomatis tanpa Anda mengetik ulang.", span: "lg:col-span-2" },
              { icon: FileText, title: "Klausul asli + bahasa awam", desc: "Teks asli berdampingan dengan penjelasan sederhana, plus alasan kenapa berisiko." },
              { icon: AlertTriangle, title: "Tingkat risiko & urgensi", desc: "Setiap temuan ada label RENDAH→KRITIS dan saran apakah perlu ditindak." },
              { icon: FileDown, title: "Export PDF rapi", desc: "Simpan & bagikan laporan ke keluarga/penjamin, atau cetak." },
              { icon: History, title: "Riwayat tersimpan", desc: "Lihat & unduh ulang kapan saja. Anda punya kontrol penuh, bisa hapus.", span: "lg:col-span-2" },
              { icon: Lock, title: "Keamanan dasar", desc: "Password di-hash, rate limiting, sesi kedaluwarsa." },
            ].map((f, i) => (
              <Card key={i} className={`group relative overflow-hidden border-border/60 transition-all hover:border-primary/40 hover:shadow-soft animate-fade-in-up stagger-${(i % 6) + 1} ${f.span || ""}`}>
                <CardContent className="h-full p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-transform group-hover:scale-110">
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
      <section className="bg-muted/20">
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
                Konsultasi <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ============ RESOURCES ============ */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="max-w-2xl">
            <SectionLabel>Lebih dari sekadar baca</SectionLabel>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
              Sumber belajar & alat bantu.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ResourceCard icon={FileText} title="Contoh Kontrak" desc="Coba analisis 4 contoh nyata: sewa kos, freelance, PKWT, renovasi." onClick={() => setView("samples")} cta="Lihat contoh" />
            <ResourceCard icon={BookOpen} title="Glosarium Hukum" desc="Istilah hukum (denda, arbitrase, force majeure) dijelaskan bahasa awam." onClick={() => setView("glossary")} cta="Buka glosarium" />
            <ResourceCard icon={HelpCircle} title="FAQ" desc="Jawaban pertanyaan umum soal analisis, keamanan, dan keterbatasan." onClick={() => setView("faq")} cta="Baca FAQ" />
            <ResourceCard icon={BarChart3} title="Insight & Statistik" desc={user ? "Pola risiko dari riwayat analisis Anda." : "Pola risiko dari analisis Anda (setelah masuk)."} onClick={() => setView(user ? "insights" : "signup")} cta={user ? "Lihat insight" : "Daftar dulu"} />
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="relative overflow-hidden bg-ink text-background">
        <div className="absolute inset-0 bg-dots-warm opacity-20" />
        <WarmBlob className="pointer-events-none absolute -right-20 -top-20 h-96 w-96" color="var(--terra)" />
        <WarmBlob className="pointer-events-none absolute -left-20 -bottom-20 h-96 w-96" color="var(--sage)" />
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:py-28">
          <CompanionFigure size={56} className="mx-auto mb-4 animate-float" />
          <h2 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Kontrak berikutnya,<br />
            <span className="text-terra-gradient">dibacain dulu.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-background/60">
            Gratis. 3 analisis per bulan. Tanpa kartu kredit. Hasil dalam ~1 menit.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              variant="secondary"
              className="h-12 gap-2 rounded-full px-6 text-base shadow-warm transition-transform hover:scale-[1.02]"
              onClick={() => setView(user ? "analyze" : "signup")}
            >
              {user ? "Baca Kontrak Saya" : "Daftar Gratis"}
              <ArrowRight className="h-4 w-4" />
            </Button>
            {!user && (
              <Button size="lg" variant="ghost" className="h-12 rounded-full text-background hover:bg-background/10" onClick={() => setView("signin")}>
                Saya sudah punya akun
              </Button>
            )}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-background/50">
            <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Tanpa kartu kredit</span>
            <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Data Anda milik Anda</span>
            <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Bisa dihapus kapan saja</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
      <span className="h-px w-6 bg-primary/40" />
      {children}
    </div>
  );
}

// Companion Reading Visual — the signature hero element.
// A warm document being annotated by a "friend": hand-drawn circle draws around
// a risky clause, a margin note slides in with friendly explanation, sage checkmark pops.
function CompanionReadingVisual() {
  return (
    <div className="relative">
      {/* Floating sage "verified" badge */}
      <div className="absolute -left-3 -top-3 z-20 rotate-[-4deg] animate-pop" style={{ animationDelay: "1.8s" }}>
        <div className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 shadow-warm border border-sage/30">
          <span className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: "var(--sage)" }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M 2 6 L 5 9 L 10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="text-xs font-semibold text-ink">Sudah dibaca</span>
        </div>
      </div>

      {/* Document card */}
      <Card className="relative overflow-hidden border-border/60 bg-card shadow-warm">
        {/* Document header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">kontrak-sewa.pdf</span>
          </div>
          <span className="text-[10px] text-muted-foreground">Pasal 4</span>
        </div>

        <CardContent className="relative p-6">
          {/* Warm glow behind the annotated clause */}
          <div className="pointer-events-none absolute left-4 right-4 top-20 h-16 rounded-full bg-[oklch(0.58_0.13_38/0.06)] blur-xl animate-warm-breathe" />

          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Klausul</p>
          <p className="mt-2 font-display text-[15px] leading-[1.7] text-ink">
            Apabila Pihak Kedua terlambat membayar sewa, dikenakan{" "}
            <span className="relative inline-block">
              <span className="marker-warm font-medium">denda 2% per hari</span>
              {/* Hand-drawn circle animating around the clause */}
              <HandDrawnCircle
                className="absolute -inset-3 w-[calc(100%+1.5rem)] h-[calc(100%+1.5rem)]"
                color="var(--terra)"
                delay={0.6}
              />
            </span>{" "}
            dari nilai sewa bulanan.
          </p>

          {/* Hand-drawn arrow pointing to margin note */}
          <div className="relative mt-4 flex items-start gap-2">
            <HandDrawnArrow className="mt-1 h-6 w-12 shrink-0" color="var(--terra)" delay={1.2} />
            {/* Margin note — hand-drawn sticky feel */}
            <div className="margin-note animate-note flex-1 rounded-md p-3" style={{ animationDelay: "1.4s" }}>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">Catatan teman</p>
              <p className="mt-1 text-xs leading-relaxed text-ink">
                2%/hari itu <strong>setara 730%/tahun</strong> — bunga bank cuma ~0,1%/hari.
                Negosiasi ke nominal tetap aja, ya.
              </p>
            </div>
          </div>

          {/* Bottom reassurance */}
          <div className="mt-5 flex items-center gap-2 rounded-lg bg-sage/5 border border-sage/20 p-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--sage)" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M 3 7 L 6 10 L 11 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-ink">6 klausul berisiko ditemukan</p>
              <p className="text-[11px] text-muted-foreground">Saran tindakan tersedia untuk masing-masing.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Companion figure peeking — bottom right */}
      <div className="absolute -bottom-4 -right-2 z-20 animate-float" style={{ animationDelay: "0.5s" }}>
        <CompanionFigure size={52} />
      </div>
    </div>
  );
}

function ResourceCard({
  icon: Icon,
  title,
  desc,
  onClick,
  cta,
}: {
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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
              <Icon className="h-4 w-4" />
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
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
