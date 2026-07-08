"use client";

import { useState } from "react";
import { Check, CopyCheck, Instagram, KeyRound, Loader2, Mail, MessageCircle, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ViewShell } from "@/components/app/view-shell";
import { api, friendlyError } from "@/lib/api-client";
import { PLAN_LIMITS } from "@/lib/plans";
import { useApp } from "@/lib/store";
import { toast } from "@/hooks/use-toast";

const PRICE_LABEL: Record<string, { price: string; period: string; desc: string }> = {
  FREE: { price: "Rp0", period: "/bulan", desc: "Untuk cek kontrak sesekali." },
  LITE: { price: "Rp19.000", period: "/bulan", desc: "Untuk user yang rutin cek dokumen pribadi." },
  PRO: { price: "Rp49.000", period: "/bulan", desc: "Untuk pengguna aktif dan profesional." },
};

export function PricingView() {
  const { user, setView, setAuth, setQuota } = useApp();
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  const tiers = [
    { name: "FREE", icon: ShieldCheck, limits: PLAN_LIMITS.FREE, highlight: false },
    { name: "LITE", icon: Sparkles, limits: PLAN_LIMITS.LITE, highlight: true },
    { name: "PRO", icon: Zap, limits: PLAN_LIMITS.PRO, highlight: false },
  ];

  const redeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Masuk dulu untuk redeem license." });
      setView("signin");
      return;
    }
    setRedeeming(true);
    try {
      const res = await api.redeemLicense(code);
      const q = await api.getQuota();
      setAuth(res.user, q.quota);
      setQuota(q.quota);
      setCode("");
      toast({
        title: `License ${res.license.plan} aktif.`,
        description: `Berlaku sampai ${new Date(res.license.planExpiresAt).toLocaleDateString("id-ID")}.`,
      });
    } catch (e) {
      toast({ title: friendlyError(e), variant: "destructive" });
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <ViewShell
      size="wide"
      eyebrow="Harga"
      title="Harga yang jelas, aktif lewat license code"
      description="User tetap menghubungi Anda dulu. Setelah bayar, Anda buat license code dari Admin Center, lalu user redeem code untuk mengaktifkan Lite atau Pro selama durasi tertentu."
      icon={Sparkles}
    >
      <Card className="mb-8 border-primary/20 bg-primary/5">
        <CardContent className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">Sudah punya license code?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Masukkan code dari admin. Plan berbayar tidak aktif selamanya; durasinya mengikuti license yang Anda berikan.
            </p>
          </div>
          <form onSubmit={redeem} className="flex min-w-0 flex-col gap-2 sm:flex-row lg:min-w-[460px]">
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="KP-LITE-XXXX-XXXX-XXXX" className="font-mono uppercase" />
            <Button type="submit" className="gap-2" disabled={redeeming || code.trim().length < 8}>
              {redeeming ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Redeem
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        {tiers.map((t) => {
          const label = PRICE_LABEL[t.name];
          const isActive = user?.plan === t.name;
          return (
            <Card
              key={t.name}
              className={t.highlight ? "relative overflow-hidden border-primary shadow-soft-lg ring-1 ring-primary/30" : "border-border/70"}
            >
              {t.highlight && (
                <div className="absolute right-4 top-4">
                  <Badge className="gap-1 bg-primary px-3 py-1 text-primary-foreground">
                    <Sparkles className="h-3 w-3" /> Paling pas
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <div className={`flex items-center gap-3 ${t.highlight ? "sm:pr-24" : ""}`}>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${t.highlight ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    <t.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="font-display text-2xl text-ink">{t.name}</CardTitle>
                    <CardDescription>{label.desc}</CardDescription>
                  </div>
                </div>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-semibold text-ink">{label.price}</span>
                  <span className="text-sm text-muted-foreground">{label.period}</span>
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
                      variant="outline"
                      disabled={isActive}
                      onClick={() => setView(user ? "analyze" : "signup")}
                    >
                      {isActive ? "Paket aktif Anda" : user ? "Mulai analisis" : "Daftar gratis"}
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Button className="w-full gap-2" variant={t.highlight ? "default" : "outline"} disabled={isActive} onClick={() => setView("consultation")}>
                        {isActive ? <CopyCheck className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
                        {isActive ? "Paket aktif Anda" : "Hubungi untuk license"}
                      </Button>
                      <p className="text-center text-xs text-muted-foreground">
                        Pembayaran manual. Admin kirim redeem code setelah konfirmasi.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-8 border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <h2 className="font-display text-xl font-semibold text-ink">Sistem license yang dipakai</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Reason title="Manual approval" desc="User tetap chat Anda dulu. Tidak ada payment otomatis yang harus diurus sekarang." />
            <Reason title="Redeem code" desc="Admin generate code Lite/Pro, user redeem sekali, lalu plan aktif sesuai durasi." />
            <Reason title="Tidak unlimited" desc="Lite/Pro punya batas analisis bulanan dan tanggal kedaluwarsa supaya biaya API tetap terkendali." />
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <ContactMini icon={<MessageCircle className="h-4 w-4" />} label="WhatsApp" value="08999021644" href="https://wa.me/628999021644" />
        <ContactMini icon={<Instagram className="h-4 w-4" />} label="Instagram" value="@aryarizky04" href="https://instagram.com/aryarizky04" />
        <ContactMini icon={<Mail className="h-4 w-4" />} label="Email" value="aryarizkyardhipratama@gmail.com" href="mailto:aryarizkyardhipratama@gmail.com" />
      </div>
    </ViewShell>
  );
}

function Reason({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border bg-background/60 p-4">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}

function ContactMini({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-center gap-2 rounded-xl border bg-card p-3 text-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-soft">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-medium">{value}</p>
      </div>
    </a>
  );
}
