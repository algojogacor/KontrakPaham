"use client";

import { useApp } from "@/lib/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Zap, MessageCircle, Instagram, Mail, ShieldCheck } from "lucide-react";
import { PLAN_LIMITS } from "@/lib/quota";

export function PricingView() {
  const { user, setView } = useApp();

  const tiers = [
    {
      name: "FREE",
      price: "Rp0",
      period: "/bulan",
      desc: "Cukup untuk cek kontrak sesekali.",
      icon: ShieldCheck,
      limits: PLAN_LIMITS.FREE,
      cta: user ? (user.plan === "FREE" ? "Paket aktif Anda" : "Mulai paket ini") : "Daftar gratis",
      highlight: false,
    },
    {
      name: "PRO",
      price: "Donasi",
      period: "/sukarela",
      desc: "Untuk pengguna aktif & profesional.",
      icon: Zap,
      limits: PLAN_LIMITS.PRO,
      cta: user ? (user.plan === "PRO" ? "Paket aktif Anda" : "Hubungi untuk upgrade") : "Hubungi kami",
      highlight: true,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="text-center">
        <Badge variant="secondary" className="mb-3 gap-1 rounded-full px-3 py-1">
          <Sparkles className="h-3 w-3 text-primary" /> Model bisnis yang masuk akal
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Harga yang jujur</h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          KontrakPaham gratis untuk dipakai. Setiap analisis memakai API AI berbayar, jadi ada batas pemakaian
          wajar. Untuk pemakaian lebih, PRO didukung donasi sukarela — bukan langganan paksa.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {tiers.map((t) => (
          <Card
            key={t.name}
            className={t.highlight ? "relative border-primary shadow-lg ring-1 ring-primary/30" : ""}
          >
            {t.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="gap-1 bg-primary px-3 py-1 text-primary-foreground">
                  <Sparkles className="h-3 w-3" /> Disarankan
                </Badge>
              </div>
            )}
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${t.highlight ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  <t.icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">{t.name}</CardTitle>
                  <CardDescription>{t.desc}</CardDescription>
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold">{t.price}</span>
                <span className="text-sm text-muted-foreground">{t.period}</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5">
                {t.limits.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{f}</span>
                  </li>
                ))}
                <li className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>File maks {Math.round(t.limits.maxFileBytes / 1024 / 1024)} MB</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>Teks maks {t.limits.maxChars.toLocaleString("id-ID")} karakter</span>
                </li>
              </ul>

              <div className="mt-6">
                {t.name === "FREE" ? (
                  <Button
                    className="w-full"
                    variant={t.highlight ? "default" : "outline"}
                    disabled={!!user && user.plan === "FREE"}
                    onClick={() => setView(user ? "analyze" : "signup")}
                  >
                    {user?.plan === "FREE" ? "Paket aktif Anda" : t.cta}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button className="w-full" variant={t.highlight ? "default" : "outline"} disabled={!!user && user.plan === "PRO"} onClick={() => setView("consultation")}>
                      {user?.plan === "PRO" ? "Paket aktif Anda" : t.cta}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      Hubungi via WhatsApp/IG untuk aktifasi PRO (donasi sukarela).
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Why this model */}
      <Card className="mt-8">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold">Kenapa model seperti ini?</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Reason
              title="API AI berbayar"
              desc="Tiap analisis memakai model AI berbayar. Batas FREE menjaga layanan tetap berjalan tanpa merugi."
            />
            <Reason
              title="Akses tetap merata"
              desc="Kami ingin orang awam tetap bisa cek kontrak gratis. PRO hanya untuk yang butuh lebih."
            />
            <Reason
              title="Tanpa lock-in"
              desc="Bukan langganan otomatis yang susah dibatalkan. Donasi sukarela, data tetap milik Anda."
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact strip */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <ContactMini icon={<MessageCircle className="h-4 w-4" />} label="WhatsApp" value="08999021644" href="https://wa.me/628999021644" />
        <ContactMini icon={<Instagram className="h-4 w-4" />} label="Instagram" value="@aryarizky04" href="https://instagram.com/aryarizky04" />
        <ContactMini icon={<Mail className="h-4 w-4" />} label="Email" value="aryarizkyardhipratama@gmail.com" href="mailto:aryarizkyardhipratama@gmail.com" />
      </div>
    </div>
  );
}

function Reason({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function ContactMini({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-medium">{value}</p>
      </div>
    </a>
  );
}
