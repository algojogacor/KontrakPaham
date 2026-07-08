"use client";

import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { GraduationCap, MessageCircle, Instagram, Mail, ShieldAlert, Scale, Clock, CheckCircle2, ArrowRight } from "lucide-react";

const CONTACTS = {
  whatsapp: "08999021644",
  whatsappLink: "https://wa.me/628999021644",
  instagram: "@aryarizky04",
  instagramLink: "https://instagram.com/aryarizky04",
  email: "aryarizkyardhipratama@gmail.com",
};

export function ConsultationView() {
  const { user, setView } = useApp();
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <GraduationCap className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Konsultasi Lanjutan</h1>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
          Setelah analisis, mungkin ada temuan yang butuh diskusi lebih dalam. Berikut cara menghubungi.
        </p>
      </div>

      {/* Honest credentials */}
      <Card className="mt-8 border-amber-300/50 bg-amber-50/60 dark:bg-amber-950/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">Transparansi kredensial</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Konsultasi ini dikelola oleh <strong>mahasiswa hukum UNAIR</strong>,{" "}
                <strong>bukan advokat berlisensi</strong>. Kami bisa membantu Anda memahami hasil analisis,
                memetakan opsi, dan menyiapkan pertanyaan untuk pihak kontrak. Namun kami{" "}
                <strong>tidak memberikan nasihat hukum definitif</strong> dan tidak mewakili Anda secara hukum.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact channels */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <ContactCard
          icon={<MessageCircle className="h-5 w-5" />}
          name="WhatsApp"
          handle={CONTACTS.whatsapp}
          href={CONTACTS.whatsappLink}
          accent="bg-[#25D366] text-white"
          note="Respon paling cepat (jam aktif)"
        />
        <ContactCard
          icon={<Instagram className="h-5 w-5" />}
          name="Instagram"
          handle={CONTACTS.instagram}
          href={CONTACTS.instagramLink}
          accent="bg-gradient-to-br from-fuchsia-500 to-amber-500 text-white"
          note="DM untuk pertanyaan singkat"
        />
        <ContactCard
          icon={<Mail className="h-5 w-5" />}
          name="Email"
          handle={CONTACTS.email}
          href={`mailto:${CONTACTS.email}`}
          accent="bg-primary text-primary-foreground"
          note="Cocok untuk dokumen lampiran"
        />
      </div>

      {/* What to expect */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Apa yang bisa diharapkan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            "Penjelasan lebih detail atas temuan berlabel 'Butuh nasihat'",
            "Bantuan menyusun pertanyaan klarifikasi untuk pihak kontrak",
            "Gambaran opsi: negosiasi, revisi klausul, atau mundur",
            "Saran kapan masalah ini perlu diangkat ke advokat berlisensi",
          ].map((t, i) => (
            <div key={i} className="flex items-start gap-2.5 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <span>{t}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Alert className="mt-6 border-destructive/40">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Penting soal batasan</AlertTitle>
        <AlertDescription>
          Untuk keputusan penting — menandatangani kontrak bernilai besar, sengketa, atau kontrak dengan
          klausul KRITIS — kami sangat menyarankan berkonsultasi dengan <strong>advokat berlisensi</strong> yang
          memahami konteks spesifik Anda. KontrakPaham & konsultasi ini bersifat edukasi awal.
        </AlertDescription>
      </Alert>

      <Alert className="mt-4">
        <Clock className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Jam aktif:</strong> Senin–Jumat, 09.00–21.00 WIB. Di luar itu, pesan akan dibalas saat aktif kembali.
        </AlertDescription>
      </Alert>

      {!user ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">Sudah punya akun? Analisis kontrak dulu agar diskusi lebih terarah.</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setView("signin")}>Masuk</Button>
            <Button className="gap-1.5" onClick={() => setView("signup")}>Daftar gratis <ArrowRight className="h-4 w-4" /></Button>
          </div>
        </div>
      ) : (
        <div className="mt-8 flex justify-center">
          <Button variant="outline" onClick={() => setView("analyze")} className="gap-1.5">
            <ArrowRight className="h-4 w-4" /> Kembali menganalisis kontrak
          </Button>
        </div>
      )}
    </div>
  );
}

function ContactCard({
  icon,
  name,
  handle,
  href,
  accent,
  note,
}: {
  icon: React.ReactNode;
  name: string;
  handle: string;
  href: string;
  accent: string;
  note: string;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="group block">
      <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
        <CardContent className="flex flex-col items-center gap-2 p-5 text-center">
          <div className={`flex h-11 w-11 items-center justify-center rounded-full ${accent}`}>
            {icon}
          </div>
          <p className="font-semibold">{name}</p>
          <p className="break-all text-xs text-muted-foreground">{handle}</p>
          <p className="text-[11px] text-muted-foreground/80">{note}</p>
        </CardContent>
      </Card>
    </a>
  );
}
