"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LegalDeskScene } from "@/components/app/legal-desk-scene";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  Check,
  Clock,
  FileDown,
  FileText,
  HelpCircle,
  History,
  Lightbulb,
  Lock,
  Scale,
  ScanText,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function HomeView() {
  const { user, setView } = useApp();

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border bg-paper">
        <div className="absolute inset-0 bg-dots opacity-35" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background via-background/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background/80 to-transparent" />

        <div className="relative mx-auto grid min-h-[calc(100dvh-5.5rem)] max-w-7xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:pb-20 lg:pt-14">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/75 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground shadow-soft backdrop-blur animate-fade-in-up">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              Analisis kontrak bahasa Indonesia
            </div>

            <h1 className="mt-6 max-w-[11ch] text-balance font-display text-[2.9rem] font-semibold leading-[1.02] tracking-tight text-ink animate-fade-in-up stagger-1 sm:text-6xl lg:text-[4.9rem]">
              Baca kontrak
              <br />
              seperti{" "}
              <span className="relative inline-block">
                <em className="inline-block pb-1 text-amber-gradient not-italic leading-[1.12]" style={{ fontStyle: "italic", fontWeight: 500 }}>
                  ahli hukum
                </em>
                <svg className="absolute -bottom-2 left-0 w-full" height="10" viewBox="0 0 200 10" preserveAspectRatio="none" fill="none">
                  <path d="M2 7 Q 50 2, 100 6 T 198 5" stroke="oklch(0.7 0.16 70)" strokeWidth="3" strokeLinecap="round" fill="none" />
                </svg>
              </span>
              <br />
              dalam 60 detik.
            </h1>

            <p className="mt-7 max-w-[58ch] text-pretty text-lg leading-relaxed text-ink-soft animate-fade-in-up stagger-2">
              Unggah PDF, DOCX, atau tempel teks kontrak. AI mendeteksi klausul yang
              berpotensi <span className="marker-amber font-medium text-foreground">merugikan Anda</span>,
              menjelaskannya dalam bahasa awam, dan memberi saran tindakan sebelum Anda tanda tangan.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center animate-fade-in-up stagger-3">
              <Button
                size="lg"
                className="group h-13 gap-3 rounded-full px-6 pr-2 text-base shadow-ink transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5"
                onClick={() => setView(user ? "analyze" : "signup")}
              >
                <span>{user ? "Analisis Kontrak" : "Mulai Gratis"}</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="h-13 gap-2 rounded-full px-5 text-base text-foreground transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-accent/50"
                onClick={() => setView("samples")}
              >
                <Sparkles className="h-4 w-4 text-primary" />
                Lihat contoh dulu
              </Button>
            </div>

            <div className="mt-7 grid max-w-xl grid-cols-1 gap-2 text-xs text-muted-foreground animate-fade-in-up stagger-4 sm:grid-cols-3">
              <HeroMeta label="Input" value="PDF, DOCX, teks" />
              <HeroMeta label="Output" value="Risiko + saran" />
              <HeroMeta label="Batasan" value="Edukasi hukum" />
            </div>
          </div>

          <div className="relative animate-slide-in-right stagger-2 lg:pl-4">
            <ContractAnnotationVisual />
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-[oklch(0.16_0.02_55)] text-[oklch(0.96_0.012_80)] dark:bg-[oklch(0.085_0.01_52)] dark:text-foreground">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-center text-sm">
            <span className="flex items-center gap-2"><ScanText className="h-4 w-4 text-amber-300" /> OCR untuk PDF scan</span>
            <span className="hidden text-[oklch(0.96_0.012_80/0.25)] dark:text-foreground/20 sm:inline">/</span>
            <span className="flex items-center gap-2"><Brain className="h-4 w-4 text-amber-300" /> 16 kategori klausul</span>
            <span className="hidden text-[oklch(0.96_0.012_80/0.25)] dark:text-foreground/20 sm:inline">/</span>
            <span className="flex items-center gap-2"><FileDown className="h-4 w-4 text-amber-300" /> Export PDF report</span>
            <span className="hidden text-[oklch(0.96_0.012_80/0.25)] dark:text-foreground/20 sm:inline">/</span>
            <span className="flex items-center gap-2"><Scale className="h-4 w-4 text-amber-300" /> Edukasi, bukan nasihat definitif</span>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="max-w-2xl">
            <SectionEyebrow>Masalahnya</SectionEyebrow>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
              Kontrak bukan buku cerita.
              <br />
              <span className="text-ink-soft">Tapi banyak orang membacanya begitu.</span>
            </h2>
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              { icon: AlertTriangle, num: "01", title: "Tanda tangan tanpa baca", desc: "Klausul denda, pengalihan risiko, dan kewajiban sepihak sering tersembunyi di pasal panjang yang Anda skip." },
              { icon: Scale, num: "02", title: "Jasa hukum mahal dan intimidatif", desc: "Konsultasi advokat tidak murah. Banyak orang ragu bertanya karena takut terlihat tidak paham." },
              { icon: Clock, num: "03", title: "Deadline hari ini", desc: "Agent atau penjual minta tanda tangan hari itu juga. Anda butuh gambaran risiko dalam menit, bukan hari." },
            ].map((p, i) => (
              <div key={p.num} className={`group border-l-2 border-border pl-5 transition-colors hover:border-primary animate-fade-in-up stagger-${i + 1}`}>
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
              { icon: Upload, step: "01", title: "Unggah atau tempel", desc: "PDF termasuk scan OCR otomatis, DOCX, atau salin teks. Bahasa Indonesia." },
              { icon: Brain, step: "02", title: "AI analisis klausul", desc: "Sistem memetakan klausul berisiko per kategori: denda, jangka waktu, sepihak, pengalihan risiko." },
              { icon: Lightbulb, step: "03", title: "Pahami dan tentukan langkah", desc: "Penjelasan bahasa awam dan saran tindakan. Export PDF, tanya lanjutan, atau konsultasi." },
            ].map((s, i) => (
              <Card key={s.step} className={`group relative overflow-hidden border-border/60 bg-card/80 backdrop-blur transition-all hover:-translate-y-1 hover:shadow-soft-lg animate-fade-in-up stagger-${i + 1}`}>
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

      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <ClauseAnatomyFeatures />
        </div>
      </section>

      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <Card className="overflow-hidden border-amber-500/30 bg-gradient-to-br from-amber-50/80 to-card dark:from-amber-950/20">
            <CardContent className="flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                <Scale className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-semibold text-ink">Jujur soal batasan kami</h3>
                  <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300">Transparan</Badge>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  KontrakPaham dikelola oleh <strong className="text-ink">mahasiswa hukum UNAIR, bukan advokat berlisensi</strong>.
                  Hasil analisis bersifat edukasi dan gambaran risiko, bukan nasihat hukum definitif. Untuk keputusan
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

      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="max-w-2xl">
            <SectionEyebrow>Lebih dari analisis</SectionEyebrow>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
              Sumber belajar dan alat bantu.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ResourceCard index="01" icon={FileText} title="Contoh Kontrak" desc="Coba analisis 4 contoh nyata: sewa kos, freelance, PKWT, renovasi." onClick={() => setView("samples")} cta="Lihat contoh" />
            <ResourceCard index="02" icon={BookOpen} title="Glosarium Hukum" desc="Istilah hukum seperti denda, arbitrase, dan force majeure dijelaskan bahasa awam." onClick={() => setView("glossary")} cta="Buka glosarium" />
            <ResourceCard index="03" icon={HelpCircle} title="FAQ" desc="Jawaban pertanyaan umum soal analisis, keamanan, dan keterbatasan." onClick={() => setView("faq")} cta="Baca FAQ" />
            <ResourceCard index="04" icon={BarChart3} title="Insight & Statistik" desc={user ? "Pola risiko dari riwayat analisis Anda." : "Pola risiko dari analisis Anda setelah masuk."} onClick={() => setView(user ? "insights" : "signup")} cta={user ? "Lihat insight" : "Daftar dulu"} />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-border bg-paper text-foreground dark:bg-[oklch(0.085_0.01_52)] dark:text-foreground">
        <div className="absolute inset-0 bg-dots opacity-20" />
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:py-28">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground shadow-soft backdrop-blur dark:border-foreground/15 dark:bg-card/30 dark:text-foreground/65">
            <Zap className="h-3 w-3 text-amber-300" /> Mulai sekarang
          </div>
          <h2 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Kontrak berikutnya,
            <br />
            <em className="inline-block pb-1 text-amber-gradient not-italic leading-[1.12]" style={{ fontStyle: "italic" }}>baca dulu, baru tanda tangan.</em>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-muted-foreground dark:text-foreground/65">
            Gratis. 3 analisis per bulan. Tanpa kartu kredit. Hasil dalam sekitar 1 menit.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              variant="secondary"
              className="group h-13 gap-3 rounded-full px-6 pr-2 text-base shadow-ink transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5"
              onClick={() => setView(user ? "analyze" : "signup")}
            >
              <span>{user ? "Analisis Kontrak" : "Daftar Gratis"}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground/10 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
                <ArrowRight className="h-4 w-4" />
              </span>
            </Button>
            {!user && (
              <Button size="lg" variant="ghost" className="h-13 rounded-full px-5 text-base text-foreground hover:bg-accent/50 dark:text-foreground dark:hover:bg-foreground/10" onClick={() => setView("signin")}>
                Saya sudah punya akun
              </Button>
            )}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground dark:text-foreground/55">
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

function HeroMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/60 px-3 py-2 shadow-soft backdrop-blur-sm">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium text-ink">{value}</p>
    </div>
  );
}

function ContractAnnotationVisual() {
  return <LegalDeskScene />;
}

const featureItems: Array<{
  icon: LucideIcon;
  title: string;
  desc: string;
  status: string;
  marker: string;
}> = [
  { icon: ScanText, title: "OCR untuk PDF scan", desc: "Foto atau scan kontrak lama dibaca otomatis tanpa mengetik ulang.", status: "terbaca", marker: "Halaman scan" },
  { icon: FileText, title: "Klausul asli + bahasa awam", desc: "Teks asli berdampingan dengan penjelasan yang bisa dipakai bicara.", status: "diterjemahkan", marker: "Pasal 4" },
  { icon: AlertTriangle, title: "Tingkat risiko dan urgensi", desc: "Temuan diberi prioritas agar Anda tahu mana yang harus dinego dulu.", status: "diprioritaskan", marker: "Risiko tinggi" },
  { icon: FileDown, title: "Export PDF rapi", desc: "Laporan bisa dibagikan ke keluarga, penjamin, atau pihak terkait.", status: "siap export", marker: "Report" },
  { icon: History, title: "Riwayat dan chat tersimpan", desc: "Hasil analisis dan tanya lanjutan tetap bisa dibuka kembali.", status: "tersimpan", marker: "Arsip akun" },
  { icon: Lock, title: "Kontrol akun", desc: "Password di-hash, rate limiting aktif, dan data bisa dihapus.", status: "terkunci", marker: "Kontrol data" },
];

function ClauseAnatomyFeatures() {
  const [active, setActive] = useState(0);
  const ActiveIcon = featureItems[active].icon;

  return (
    <div>
      <div className="max-w-2xl">
        <SectionEyebrow>Fitur</SectionEyebrow>
        <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
          Dibuat untuk orang awam,
          <br />
          <span className="text-ink-soft">bukan untuk developer.</span>
        </h2>
      </div>

      <div className="clause-anatomy mt-10 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="clause-anatomy__paper relative overflow-hidden rounded-[1.75rem] border border-border bg-card p-5 shadow-ink">
          <div className="flex items-center justify-between border-b border-border/70 pb-4">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">anatomy mode</p>
              <h3 className="mt-1 font-display text-2xl font-semibold text-ink">Satu kontrak, enam alat baca.</h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ActiveIcon className="h-5 w-5" />
            </div>
          </div>

          <div className="relative mt-6 min-h-[280px] rounded-[1.25rem] border border-border/70 bg-background/70 p-5">
            <div className="space-y-3">
              <span className="block h-2 w-24 rounded-full bg-ink/25" />
              <span className="block h-2 w-full rounded-full bg-muted" />
              <span className="block h-2 w-11/12 rounded-full bg-muted" />
              <span className="anatomy-highlight block h-4 rounded-full" style={{ width: `${62 + active * 4}%` }} />
              <span className="block h-2 w-10/12 rounded-full bg-muted" />
              <span className="block h-2 w-8/12 rounded-full bg-muted" />
            </div>

            <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-primary/25 bg-primary/5 p-4 transition-all duration-300">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">{featureItems[active].marker}</p>
              <h4 className="mt-1 font-display text-xl font-semibold text-ink">{featureItems[active].title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{featureItems[active].desc}</p>
            </div>

            <div className="anatomy-cursor" style={{ left: `${18 + active * 12}%` }}>
              <span />
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          {featureItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = active === index;

            return (
              <button
                key={item.title}
                type="button"
                onFocus={() => setActive(index)}
                onMouseEnter={() => setActive(index)}
                className={`feature-rail-item group text-left ${isActive ? "is-active" : ""}`}
              >
                <span className="feature-rail-item__index">{String(index + 1).padStart(2, "0")}</span>
                <span className="feature-rail-item__icon">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-base font-semibold text-ink">{item.title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-ink-soft">{item.desc}</span>
                </span>
                <span className="feature-rail-item__status">{item.status}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ResourceCard({
  index,
  icon: Icon,
  title,
  desc,
  onClick,
  cta,
}: {
  index: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  onClick: () => void;
  cta: string;
}) {
  return (
    <button onClick={onClick} className="group text-left">
      <Card className="h-full overflow-hidden border-border/60 bg-card/75 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:border-primary/40 hover:shadow-soft-lg">
        <CardContent className="flex h-full flex-col p-5">
          <div className="flex items-center justify-between">
            <span className="font-display text-2xl font-semibold text-primary/55">{index}</span>
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
