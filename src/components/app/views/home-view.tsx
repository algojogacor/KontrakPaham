"use client";

import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck, FileText, Upload, ScanText, Brain, Lightbulb,
  FileDown, History, Clock, Lock, Heart, ArrowRight, Check,
  AlertTriangle, Scale, MessageSquare, BookOpen, HelpCircle, BarChart3,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export function HomeView() {
  const { user, setView } = useApp();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="absolute inset-0 bg-radial-fade" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-5 gap-1.5 rounded-full px-3 py-1 animate-fade-in-up">
              <Heart className="h-3 w-3 text-primary" />
              Untuk Anda yang gaptek pun paham
            </Badge>
            <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl animate-fade-in-up stagger-1">
              Pahami kontrak Anda{" "}
              <span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
                sebelum tanda tangan
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground animate-fade-in-up stagger-2">
              Unggah kontrak dalam Bahasa Indonesia (PDF, DOCX, atau salin teks).
              Sistem mendeteksi klausul yang berpotensi merugikan, menjelaskannya dalam
              bahasa awam, dan memberi saran tindakan — bukan jargon hukum yang membingungkan.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row animate-fade-in-up stagger-3">
              <Button size="lg" className="h-12 gap-2 px-6 text-base shadow-soft" onClick={() => setView(user ? "analyze" : "signup")}>
                {user ? "Analisis Kontrak Sekarang" : "Mulai Gratis"}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-6 text-base" onClick={() => setView("pricing")}>
                Lihat Harga
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              3 analisis gratis tiap bulan · Tanpa kartu kredit · Hasil dalam ~1 menit
            </p>
          </div>

          {/* Hero preview card */}
          <div className="mx-auto mt-14 max-w-3xl">
            <Card className="overflow-hidden border-primary/20 shadow-xl">
              <CardContent className="p-0">
                <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2.5">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-xs text-muted-foreground">Contoh hasil analisis</span>
                </div>
                <div className="grid gap-0 sm:grid-cols-2">
                  <div className="border-b p-5 sm:border-b-0 sm:border-r">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Klausul asli</p>
                    <p className="mt-2 text-sm italic text-muted-foreground">
                      "Pihak Kedua setuju untuk membayar denda keterlambatan sebesar 2% per hari dari nilai sewa…"
                    </p>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">TINGGI</Badge>
                      <span className="text-xs text-muted-foreground">Denda & Sanksi</span>
                    </div>
                    <p className="mt-2 text-sm font-medium">Denda 2% per hari itu sangat tinggi.</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Kalau telat bayar 1 minggu, denda bisa 14%. Bandingkan: bunga bank ~0,1%/hari.
                      Saran: negosiasi maksimal 0,1%/hari atau nominal tetap.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="border-b border-border bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="grid gap-8 lg:grid-cols-3">
            {[
              { icon: AlertTriangle, title: "Banyak orang tanda tangan tanpa baca", desc: "Klausul denda, pengalihan risiko, dan kewajiban sepihak sering tersembunyi di pasal-pasal yang panjang." },
              { icon: Scale, title: "Jasa hukum mahal & intimidatif", desc: "Konsultasi advokat tidak murah. Banyak orang ragu bertanya karena takut terlihat bodoh." },
              { icon: Clock, title: "Butuh cepat sebelum deadline", desc: "Agent/penjual sering minta tanda tangan hari itu juga. Anda butuh gambaran risiko dalam menit, bukan hari." },
            ].map((p, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                  <p.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{p.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Cara kerjanya, 3 langkah</h2>
          <p className="mt-2 text-muted-foreground">Sederhana, cukup dari HP.</p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { icon: Upload, step: "1", title: "Unggah atau tempel", desc: "PDF (termasuk hasil scan — ada OCR otomatis), DOCX, atau salin teks kontrak. Bahasa Indonesia." },
            { icon: Brain, step: "2", title: "AI analisis klausul", desc: "Sistem memetakan klausul berisiko per kategori: denda, jangka waktu, sepihak, pengalihan risiko, dll." },
            { icon: Lightbulb, step: "3", title: "Pahami & tentukan langkah", desc: "Dapat penjelasan bahasa awam + saran tindakan. Export PDF, atau konsultasi lanjutan." },
          ].map((s, i) => (
            <Card key={i} className={`relative animate-fade-in-up stagger-${i + 1}`}>
              <CardContent className="p-6">
                <div className="absolute right-4 top-4 text-5xl font-black text-primary/10">{s.step}</div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <s.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="border-y border-border bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Fitur yang bikin tenang</h2>
            <p className="mt-2 text-muted-foreground">Dibuat untuk orang awam, bukan developer.</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: ScanText, title: "OCR otomatis untuk PDF scan", desc: "Foto/scan kontrak lama? Sistem baca gambar otomatis tanpa Anda mengetik ulang." },
              { icon: FileText, title: "Klausul asli + bahasa awam", desc: "Teks asli berdampingan dengan penjelasan sederhana, plus alasan kenapa berisiko." },
              { icon: AlertTriangle, title: "Tingkat risiko & urgensi", desc: "Setiap temuan ada label RENDAH→KRITIS dan saran apakah perlu ditindak atau sekadar info." },
              { icon: FileDown, title: "Export PDF report rapi", desc: "Simpan & bagikan laporan analisis ke keluarga/penjamin, atau cetak." },
              { icon: History, title: "Riwayat tersimpan per akun", desc: "Lihat ulang & unduh ulang analisis kapan saja. Anda punya kontrol penuh, bisa hapus." },
              { icon: Lock, title: "Keamanan dasar terpasang", desc: "Password di-hash, rate limiting, validasi input, sesi dengan kedaluwarsa." },
            ].map((f, i) => (
              <Card key={i} className="h-full">
                <CardContent className="p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Honest disclaimer band */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <Card className="border-amber-300/50 bg-amber-50/60 dark:bg-amber-950/20">
          <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Jujur soal batasan kami</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                KontrakPaham dikelola oleh <strong>mahasiswa hukum tingkat akhir, bukan advokat berlisensi</strong>.
                Hasil analisis bersifat edukasi & gambaran risiko — bukan nasihat hukum definitif. Untuk keputusan
                penting, konsultasi dengan advokat berlisensi. Kami transparan soal ini dari awal.
              </p>
            </div>
            <Button variant="outline" onClick={() => setView("consultation")} className="shrink-0">
              Konsultasi lanjutan
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Resources section - new features */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Lebih dari sekadar analisis</h2>
          <p className="mt-2 text-muted-foreground">Sumber belajar & alat bantu untuk Anda yang ingin paham kontrak lebih dalam.</p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <ResourceCard
            emoji="📄"
            icon={FileText}
            title="Contoh Kontrak"
            desc="Coba analisis 4 contoh kontrak nyata: sewa kos, freelance, PKWT, renovasi."
            onClick={() => setView("samples")}
            cta="Lihat contoh"
          />
          <ResourceCard
            emoji="📚"
            icon={BookOpen}
            title="Glosarium Hukum"
            desc="Istilah hukum (denda, arbitrase, force majeure) dijelaskan bahasa awam."
            onClick={() => setView("glossary")}
            cta="Buka glosarium"
          />
          <ResourceCard
            emoji="❓"
            icon={HelpCircle}
            title="FAQ"
            desc="Jawaban pertanyaan umum soal analisis, keamanan, dan keterbatasan."
            onClick={() => setView("faq")}
            cta="Baca FAQ"
          />
          <ResourceCard
            emoji="📊"
            icon={BarChart3}
            title="Insight & Statistik"
            desc={user ? "Pola risiko dari riwayat analisis Anda." : "Pola risiko dari analisis Anda (setelah masuk)."}
            onClick={() => setView(user ? "insights" : "signup")}
            cta={user ? "Lihat insight" : "Daftar dulu"}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Siap memahami kontrak Anda?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
            Mulai gratis. Unggah kontrak pertama Anda dalam hitungan menit.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" variant="secondary" className="h-12 px-6 text-base" onClick={() => setView(user ? "analyze" : "signup")}>
              {user ? "Analisis Kontrak" : "Daftar Gratis"}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            {!user && (
              <Button size="lg" variant="ghost" className="h-12 px-6 text-base text-primary-foreground hover:bg-primary-foreground/10" onClick={() => setView("signin")}>
                Saya sudah punya akun
              </Button>
            )}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-primary-foreground/70">
            <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Tanpa kartu kredit</span>
            <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Data Anda milik Anda</span>
            <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Bisa dihapus kapan saja</span>
          </div>
        </div>
      </section>
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
      <Card className="h-full transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
        <CardContent className="flex h-full flex-col p-5">
          <div className="flex items-center justify-between">
            <span className="text-2xl">{emoji}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
              <Icon className="h-4 w-4" />
            </div>
          </div>
          <h3 className="mt-3 font-semibold">{title}</h3>
          <p className="mt-1 flex-1 text-sm text-muted-foreground">{desc}</p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
            {cta}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </CardContent>
      </Card>
    </button>
  );
}
