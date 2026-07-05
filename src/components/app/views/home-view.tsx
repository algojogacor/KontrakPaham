"use client";

import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Upload, ScanText, Brain, Lightbulb,
  FileDown, History, Clock, Lock, ArrowRight, Check,
  AlertTriangle, Scale, BookOpen, HelpCircle, BarChart3, ScanLine, Crosshair,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export function HomeView() {
  const { user, setView } = useApp();

  return (
    <div>
      {/* ============ FORENSIC HERO ============ */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-crosshair opacity-70" />
        {/* Scan line sweeping down */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-primary/30 animate-scan" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:py-20 lg:grid-cols-[1fr_1fr] lg:py-24">
          {/* Left: direct, authoritative copy */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-sm border border-border bg-card px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground animate-fade-in">
              <Crosshair className="h-3 w-3 text-primary" />
              SYS · KontrakPaham v2 · Audit Engine
            </div>

            <h1 className="mt-6 font-display text-[2.5rem] font-semibold leading-[1.05] tracking-tight text-ink animate-fade-in-up stagger-1 sm:text-5xl lg:text-[3.75rem]">
              Kontrak itu punya
              <br />
              <span className="text-signal">risiko tersembunyi</span>.
              <br />
              Kami bantu temukan.
            </h1>

            <p className="mt-6 max-w-lg text-pretty text-base leading-relaxed text-ink-soft animate-fade-in-up stagger-2 sm:text-lg">
              Unggah PDF, DOCX, atau tempel teks kontrak. Mesin membaca setiap klausul,
              menandai yang berpotensi <span className="marker-signal font-medium">merugikan Anda</span>,
              dan menjelaskannya dalam bahasa awam — sebelum Anda tanda tangan.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center animate-fade-in-up stagger-3">
              <Button
                size="lg"
                className="h-12 gap-2 rounded-sm px-6 text-base shadow-soft transition-transform hover:translate-y-[-1px]"
                onClick={() => setView(user ? "analyze" : "signup")}
              >
                {user ? "Mulai Audit" : "Mulai Gratis"}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 rounded-sm px-5 text-base"
                onClick={() => setView("samples")}
              >
                Lihat contoh
              </Button>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground animate-fade-in-up stagger-4">
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> 3 audit / bulan</span>
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> tanpa kartu kredit</span>
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> ~60 detik</span>
            </div>
          </div>

          {/* Right: Audit Terminal visual */}
          <div className="relative animate-slide-in-right stagger-2">
            <AuditTerminalVisual />
          </div>
        </div>
      </section>

      {/* ============ CAPABILITY STRIP ============ */}
      <section className="border-b border-border bg-ink text-background">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-center font-mono text-xs uppercase tracking-wider">
            <span className="flex items-center gap-2"><ScanText className="h-3.5 w-3.5" /> OCR untuk PDF scan</span>
            <span className="text-background/20">/</span>
            <span className="flex items-center gap-2"><Brain className="h-3.5 w-3.5" /> 16 kategori klausul</span>
            <span className="text-background/20">/</span>
            <span className="flex items-center gap-2"><FileDown className="h-3.5 w-3.5" /> Export PDF report</span>
            <span className="text-background/20">/</span>
            <span className="flex items-center gap-2"><Scale className="h-3.5 w-3.5" /> Edukasi, bukan nasihat definitif</span>
          </div>
        </div>
      </section>

      {/* ============ PROBLEM ============ */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="max-w-2xl">
            <SectionLabel>Masalahnya</SectionLabel>
            <h2 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
              Anda tidak baca kontrak.<br />
              <span className="text-ink-soft">Kontrak membaca Anda.</span>
            </h2>
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              { icon: AlertTriangle, num: "01", title: "Tanda tangan tanpa baca", desc: "Klausul denda, pengalihan risiko, dan kewajiban sepihak tersembunyi di pasal panjang yang Anda skip." },
              { icon: Scale, num: "02", title: "Jasa hukum mahal", desc: "Konsultasi advokat tidak murah. Banyak orang ragu bertanya karena takut terlihat tidak paham." },
              { icon: Clock, num: "03", title: "Deadline hari ini", desc: "Agent minta tanda tangan hari itu juga. Anda butuh gambaran risiko dalam menit, bukan hari." },
            ].map((p, i) => (
              <div key={i} className={`group border-l-2 border-border pl-5 transition-colors hover:border-primary animate-fade-in-up stagger-${i + 1}`}>
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-sm font-medium text-primary/70">{p.num}</span>
                  <p.icon className="h-5 w-5 text-ink-soft" />
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold text-ink">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="max-w-2xl">
            <SectionLabel>Proses</SectionLabel>
            <h2 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
              Tiga langkah. Cukup dari HP.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              { icon: Upload, step: "01", title: "Unggah atau tempel", desc: "PDF (termasuk scan — OCR otomatis), DOCX, atau salin teks. Bahasa Indonesia." },
              { icon: Brain, step: "02", title: "Mesin analisis klausul", desc: "Sistem memetakan klausul berisiko per kategori: denda, jangka waktu, sepihak, pengalihan risiko." },
              { icon: Lightbulb, step: "03", title: "Pahami & tentukan langkah", desc: "Penjelasan bahasa awam + saran tindakan. Export PDF, atau konsultasi lanjutan." },
            ].map((s, i) => (
              <Card key={i} className={`group relative overflow-hidden border-border/60 transition-all hover:-translate-y-1 hover:shadow-soft-lg animate-fade-in-up stagger-${i + 1}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-sm bg-primary/10 text-primary transition-transform group-hover:scale-110">
                      <s.icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-3xl font-light text-primary/20">{s.step}</span>
                  </div>
                  <h3 className="mt-4 font-display text-base font-semibold text-ink">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="max-w-2xl">
            <SectionLabel>Kapabilitas</SectionLabel>
            <h2 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
              Dibuat untuk orang awam,<br />
              <span className="text-ink-soft">dengan ketelitian audit.</span>
            </h2>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: ScanText, title: "OCR untuk PDF scan", desc: "Foto/scan kontrak lama? Sistem baca gambar otomatis tanpa Anda mengetik ulang.", span: "lg:col-span-2" },
              { icon: FileText, title: "Klausul asli + bahasa awam", desc: "Teks asli berdampingan dengan penjelasan sederhana." },
              { icon: AlertTriangle, title: "Tingkat risiko & urgensi", desc: "Setiap temuan ada label RENDAH→KRITIS." },
              { icon: FileDown, title: "Export PDF rapi", desc: "Simpan & bagikan laporan ke keluarga/penjamin." },
              { icon: History, title: "Riwayat tersimpan", desc: "Lihat & unduh ulang kapan saja. Anda punya kontrol penuh.", span: "lg:col-span-2" },
              { icon: Lock, title: "Keamanan dasar", desc: "Password di-hash, rate limiting, sesi kedaluwarsa." },
            ].map((f, i) => (
              <Card key={i} className={`group relative overflow-hidden border-border/60 transition-all hover:border-primary/40 hover:shadow-soft animate-fade-in-up stagger-${(i % 6) + 1} ${f.span || ""}`}>
                <CardContent className="h-full p-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-muted text-ink-soft transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <h3 className="mt-3 font-display text-sm font-semibold text-ink">{f.title}</h3>
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
          <Card className="overflow-hidden border-border bg-card corner-brackets">
            <CardContent className="flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary">
                <Scale className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-semibold text-ink">Jujur soal batasan</h3>
                  <Badge variant="outline" className="font-mono text-[10px] uppercase">Transparan</Badge>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  KontrakPaham dikelola oleh <strong className="text-ink">mahasiswa hukum tingkat akhir, bukan advokat berlisensi</strong>.
                  Hasil analisis bersifat edukasi & gambaran risiko — bukan nasihat hukum definitif. Untuk keputusan
                  penting, konsultasikan dengan advokat berlisensi.
                </p>
              </div>
              <Button variant="outline" onClick={() => setView("consultation")} className="shrink-0 rounded-sm">
                Konsultasi <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ============ RESOURCES ============ */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="max-w-2xl">
            <SectionLabel>Lebih dari audit</SectionLabel>
            <h2 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
              Sumber belajar & alat bantu.
            </h2>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ResourceCard icon={FileText} title="Contoh Kontrak" desc="Coba audit 4 contoh nyata: sewa kos, freelance, PKWT, renovasi." onClick={() => setView("samples")} cta="Lihat contoh" />
            <ResourceCard icon={BookOpen} title="Glosarium Hukum" desc="Istilah hukum (denda, arbitrase, force majeure) dijelaskan bahasa awam." onClick={() => setView("glossary")} cta="Buka glosarium" />
            <ResourceCard icon={HelpCircle} title="FAQ" desc="Jawaban pertanyaan umum soal analisis, keamanan, dan keterbatasan." onClick={() => setView("faq")} cta="Baca FAQ" />
            <ResourceCard icon={BarChart3} title="Insight & Statistik" desc={user ? "Pola risiko dari riwayat audit Anda." : "Pola risiko dari audit Anda (setelah masuk)."} onClick={() => setView(user ? "insights" : "signup")} cta={user ? "Lihat insight" : "Daftar dulu"} />
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="relative overflow-hidden bg-ink text-background">
        <div className="absolute inset-0 bg-crosshair opacity-30" />
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:py-28">
          <div className="inline-flex items-center gap-2 rounded-sm border border-background/20 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-background/60">
            <Crosshair className="h-3 w-3" /> Mulai sekarang
          </div>
          <h2 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Kontrak berikutnya,<br />
            <span className="text-signal">audit dulu.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-background/60">
            Gratis. 3 audit per bulan. Tanpa kartu kredit. Hasil dalam ~1 menit.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              variant="secondary"
              className="h-12 gap-2 rounded-sm px-6 text-base shadow-ink transition-transform hover:translate-y-[-1px]"
              onClick={() => setView(user ? "analyze" : "signup")}
            >
              {user ? "Audit Kontrak" : "Daftar Gratis"}
              <ArrowRight className="h-4 w-4" />
            </Button>
            {!user && (
              <Button size="lg" variant="ghost" className="h-12 rounded-sm text-background hover:bg-background/10" onClick={() => setView("signin")}>
                Saya sudah punya akun
              </Button>
            )}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-wider text-background/40">
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
    <div className="inline-flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
      <span className="h-px w-5 bg-primary/50" />
      {children}
    </div>
  );
}

function AuditTerminalVisual() {
  return (
    <div className="relative">
      {/* Dossier number stamp — signature element */}
      <div className="absolute -left-3 -top-3 z-20 rotate-[-2deg] animate-fade-in stagger-4">
        <div className="rounded-sm border-2 border-primary bg-card px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-primary shadow-soft">
          KP-AUDIT-2024-0042
        </div>
      </div>

      {/* Risk score readout — floating right */}
      <div className="absolute -right-2 -top-2 z-20 rotate-[2deg] animate-fade-in stagger-5">
        <div className="flex items-center gap-2 rounded-sm bg-ink px-3 py-2 text-background shadow-ink">
          <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-signal font-mono text-sm font-bold text-white">75</div>
          <div className="leading-tight">
            <p className="font-mono text-[9px] uppercase tracking-wider text-background/50">Risk score</p>
            <p className="font-display text-xs font-bold">TINGGI</p>
          </div>
        </div>
      </div>

      {/* Terminal card */}
      <Card className="relative overflow-hidden border-border bg-card shadow-ink corner-brackets">
        {/* Terminal header bar */}
        <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="h-2 w-2 rounded-full bg-signal" />
              <div className="h-2 w-2 rounded-full bg-foreground/30" />
              <div className="h-2 w-2 rounded-full bg-foreground/30" />
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">audit_terminal — kontrak-sewa.pdf</span>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">[SCANNING]</span>
        </div>

        <CardContent className="relative p-5">
          {/* Scanline overlay */}
          <div className="pointer-events-none absolute inset-0 scanline-overlay" />

          {/* Dossier meta */}
          <div className="relative flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>FILE: kontrak-sewa.pdf</span>
            <span>PASAL 4 / HAL 2</span>
          </div>

          {/* Contract excerpt in mono */}
          <div className="relative mt-4 rounded-sm border border-border bg-muted/30 p-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{"// KLAUSUL TERDETEKSI"}</p>
            <p className="mt-2 font-mono text-[13px] leading-[1.7] text-ink">
              Apabila Pihak Kedua terlambat membayar sewa,
              dikenakan denda{" "}
              <span className="risk-bracket">2% per hari</span>{" "}
              dari nilai sewa bulanan. Keterlambatan {" "}
              <span className="risk-bracket">{">"} 7 hari</span>{" "}
              memberikan hak kepada Pihak Pertama
              untuk <span className="marker-signal">memutuskan kontrak sepihak</span>{" "}
              tanpa proses pengadilan.
            </p>
          </div>

          {/* Findings log */}
          <div className="relative mt-4 space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{"// FINDINGS LOG"}</p>
            <FindingLogRow sev="KRITIS" label="Denda 2%/hari" detail="Setara ~730%/thn. Bunga bank ~0,1%/hr." />
            <FindingLogRow sev="TINGGI" label="Pemutusan sepihak" detail="Tanpa pengadilan, hanya Pihak Pertama." />
          </div>

          {/* Suggestion block */}
          <div className="relative mt-4 flex items-start gap-2.5 rounded-sm border border-primary/30 bg-primary/5 p-3">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-primary">{"// REKOMENDASI"}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
                Negosiasi maksimal 0,1%/hari atau nominal tetap. Tambah grace period 3 hari.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom status strip */}
      <div className="absolute -bottom-3 left-4 z-20 animate-fade-in stagger-6">
        <div className="flex items-center gap-2 rounded-sm bg-card px-3 py-1.5 shadow-soft border border-border">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal" />
          </span>
          <span className="font-mono text-[10px] font-medium text-ink">6 klausul berisiko terdeteksi</span>
        </div>
      </div>
    </div>
  );
}

function FindingLogRow({ sev, label, detail }: { sev: "KRITIS" | "TINGGI" | "SEDANG"; label: string; detail: string }) {
  const sevStyle: Record<string, string> = {
    KRITIS: "text-signal border-signal/40 bg-signal/5",
    TINGGI: "text-signal border-signal/30 bg-signal/5",
    SEDANG: "text-ink-soft border-border bg-muted/40",
  };
  return (
    <div className="flex items-start gap-2.5 rounded-sm border bg-card p-2.5">
      <span className={`mt-0.5 shrink-0 rounded-sm border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${sevStyle[sev]}`}>
        {sev}
      </span>
      <div className="min-w-0">
        <p className="font-mono text-xs font-medium text-ink">{label}</p>
        <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">{detail}</p>
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
            <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-muted text-ink-soft transition-colors group-hover:bg-primary/10 group-hover:text-primary">
              <Icon className="h-4 w-4" />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground group-hover:text-primary">→</span>
          </div>
          <h3 className="mt-3 font-display text-sm font-semibold text-ink">{title}</h3>
          <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-soft">{desc}</p>
          <span className="mt-3 inline-flex items-center gap-1 font-mono text-xs font-medium uppercase tracking-wider text-primary">
            {cta}
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        </CardContent>
      </Card>
    </button>
  );
}
