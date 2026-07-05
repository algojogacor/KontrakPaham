"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { api, friendlyError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Loader2, ShieldCheck, ArrowLeft, KeyRound, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export function AuthView() {
  const view = useApp((s) => s.view);
  if (view === "signup") return <SignupForm />;
  if (view === "forgot") return <ForgotForm />;
  if (view === "reset") return <ResetForm />;
  return <SigninForm />;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-destructive">{msg}</p>;
}

function SigninForm() {
  const { setAuth, setView, setResetToken } = useApp();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { user } = await api.signin({ identifier, password });
      const { quota } = await api.getMe();
      setAuth(user, quota);
      setView("dashboard");
      toast({ title: `Selamat datang, ${user.displayName || user.username}!` });
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Masuk ke akun Anda" subtitle="Lanjutkan menganalisis kontrak Anda.">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="id">Username atau email</Label>
          <Input id="id" value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" placeholder="cth: budi atau budi@email.com" required />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="pw">Password</Label>
            <button type="button" onClick={() => { setView("forgot"); setResetToken(null); }} className="text-xs text-primary hover:underline">
              Lupa password?
            </button>
          </div>
          <div className="relative">
            <Input id="pw" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={show ? "Sembunyikan" : "Tampilkan"}>
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Masuk
        </Button>
      </form>
      <Separator className="my-6" />
      <p className="text-center text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <button onClick={() => setView("signup")} className="font-medium text-primary hover:underline">
          Daftar gratis
        </button>
      </p>
    </AuthShell>
  );
}

function SignupForm() {
  const { setAuth, setView } = useApp();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pwScore = passwordStrength(password);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { user } = await api.signup({ username, email, password, displayName: username });
      const { quota } = await api.getMe();
      setAuth(user, quota);
      setView("dashboard");
      toast({ title: "Akun dibuat!", description: "Anda dapat 3 analisis gratis setiap bulan." });
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Buat akun gratis" subtitle="3 analisis kontrak gratis setiap bulan. Tanpa kartu kredit.">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="username">Username</Label>
          <Input id="username" value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))} autoComplete="username" placeholder="cth: budi_s" required minLength={3} maxLength={32} />
          <p className="text-xs text-muted-foreground">3-32 karakter: huruf, angka, titik, strip, underscore.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="nama@email.com" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw">Password</Label>
          <div className="relative">
            <Input id="pw" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required minLength={8} />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={show ? "Sembunyikan" : "Tampilkan"}>
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {password.length > 0 && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full ${i < pwScore.level ? pwScore.color : "bg-muted"}`} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{pwScore.label} · min. 8 karakter, ada huruf & angka</p>
            </div>
          )}
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Daftar
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Dengan mendaftar, Anda memahami bahwa layanan ini bersifat edukasi dan bukan nasihat hukum definitif.
        </p>
      </form>
      <Separator className="my-6" />
      <p className="text-center text-sm text-muted-foreground">
        Sudah punya akun?{" "}
        <button onClick={() => setView("signin")} className="font-medium text-primary hover:underline">
          Masuk
        </button>
      </p>
    </AuthShell>
  );
}

function ForgotForm() {
  const { setView, setResetToken } = useApp();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ token?: string; message: string } | null>(null);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.forgotPassword(email);
      setResult({ token: res.resetToken, message: res.message });
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Lupa password" subtitle="Kami buatkan tautan reset (mode demo menampilkan token langsung).">
      {result ? (
        <div className="space-y-4">
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
          {result.token && (
            <>
              <Alert>
                <KeyRound className="h-4 w-4" />
                <AlertDescription className="space-y-2">
                  <span className="block">Token reset (mode demo — di produksi ini dikirim via email):</span>
                  <code className="block break-all rounded bg-muted p-2 text-xs">{result.token}</code>
                </AlertDescription>
              </Alert>
              <Button className="w-full" onClick={() => { setResetToken(result.token); setView("reset"); }}>
                Gunakan token ini untuk reset
              </Button>
            </>
          )}
          <Button variant="ghost" className="w-full" onClick={() => setView("signin")}>
            Kembali ke masuk
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email akun Anda</Label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-8" placeholder="nama@email.com" required />
            </div>
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Kirim tautan reset
          </Button>
          <button type="button" onClick={() => setView("signin")} className="flex items-center justify-center gap-1 w-full text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Kembali ke masuk
          </button>
        </form>
      )}
    </AuthShell>
  );
}

function ResetForm() {
  const { setView, resetToken } = useApp();
  const [token, setToken] = useState(resetToken || "");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthShell title="Password diubah" subtitle="">
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>Password berhasil diubah. Silakan masuk dengan password baru.</AlertDescription>
        </Alert>
        <Button className="mt-4 w-full" onClick={() => setView("signin")}>Ke halaman masuk</Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Reset password" subtitle="Masukkan token reset & password baru.">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="token">Token reset</Label>
          <Input id="token" value={token} onChange={(e) => setToken(e.target.value)} required placeholder="Tempel token di sini" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw">Password baru</Label>
          <div className="relative">
            <Input id="pw" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={show ? "Sembunyikan" : "Tampilkan"}>
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Min. 8 karakter, ada huruf & angka.</p>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Ubah password
        </Button>
      </form>
    </AuthShell>
  );
}

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const setView = useApp((s) => s.setView);
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 flex flex-col items-center text-center">
        <button onClick={() => setView("home")} className="mb-4 flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-background shadow-soft">
            <span className="font-display text-lg font-bold leading-none">K</span>
            <span className="absolute -bottom-0.5 left-2 right-2 h-0.5 rounded-full bg-amber-400" />
          </div>
        </button>
      </div>
      <Card className="border-border/60 shadow-soft-lg">
        <CardHeader>
          <CardTitle className="font-display text-2xl font-semibold tracking-tight text-ink">{title}</CardTitle>
          {subtitle && <CardDescription>{subtitle}</CardDescription>}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}

function passwordStrength(pw: string): { level: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^a-zA-Z0-9]/.test(pw)) score++;
  const levels = [
    { level: 0, label: "Terlalu lemah", color: "bg-red-500" },
    { level: 1, label: "Lemah", color: "bg-red-500" },
    { level: 2, label: "Cukup", color: "bg-amber-500" },
    { level: 3, label: "Kuat", color: "bg-emerald-500" },
    { level: 4, label: "Sangat kuat", color: "bg-emerald-600" },
  ];
  return levels[Math.min(score, 4)];
}
