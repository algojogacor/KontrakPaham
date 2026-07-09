"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BrainCircuit,
  Copy,
  KeyRound,
  Loader2,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ViewShell, MetricCard } from "@/components/app/view-shell";
import {
  api,
  friendlyError,
  type AdminUserDto,
  type AdminUsersSummaryDto,
  type LicenseCodeDto,
  type LlmProviderDto,
  type LlmProviderInput,
} from "@/lib/api-client";
import { useApp } from "@/lib/store";
import { toast } from "@/hooks/use-toast";

export function AdminView() {
  const { user, setView } = useApp();
  const [licenses, setLicenses] = useState<LicenseCodeDto[]>([]);
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [llmProviders, setLlmProviders] = useState<LlmProviderDto[]>([]);
  const [summary, setSummary] = useState<AdminUsersSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [providerBusyId, setProviderBusyId] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState("");
  const [plan, setPlan] = useState<"LITE" | "PRO">("LITE");
  const [durationMonths, setDurationMonths] = useState(1);
  const [maxUses, setMaxUses] = useState(1);
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [note, setNote] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [providerForm, setProviderForm] = useState<LlmProviderInput & { id?: string; apiKey: string }>({
    name: "",
    provider: "deepseek",
    baseUrl: "https://api.deepseek.com/v1",
    apiKey: "",
    model: "deepseek-v4-pro",
    enabled: true,
    priority: 10,
    useJsonResponse: false,
    maxTokens: 4096,
    temperature: 0.1,
    timeoutMs: 120000,
  });
  const [modelOptions, setModelOptions] = useState<string[]>([]);

  const isAdmin = user?.plan === "ADMIN";
  const activeCount = useMemo(() => licenses.filter(isLicenseUsable).length, [licenses]);
  const redeemedCount = useMemo(() => licenses.filter((l) => l.redeemedAt).length, [licenses]);
  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.username, u.email, u.displayName || "", u.plan].some((v) => v.toLowerCase().includes(q)),
    );
  }, [userSearch, users]);

  const load = async () => {
    setLoading(true);
    try {
      const [licenseData, userData, llmData] = await Promise.all([api.listLicenses(), api.listAdminUsers(), api.listLlmProviders()]);
      setLicenses(licenseData.licenses);
      setUsers(userData.users);
      setSummary(userData.summary);
      setLlmProviders(llmData.providers);
    } catch (e) {
      toast({ title: friendlyError(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setGeneratedCode("");
    try {
      const data = await api.createLicense({ plan, durationMonths, maxUses, expiresInDays, note });
      setGeneratedCode(data.license.code);
      setNote("");
      await load();
      toast({ title: "License code dibuat.", description: "Copy sekarang. Kode lengkap hanya tampil sekali." });
    } catch (e) {
      toast({ title: friendlyError(e), variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const deleteLicense = async (license: LicenseCodeDto, revokeUser: boolean) => {
    const message = revokeUser
      ? `Hapus key ${license.codePrefix}... dan cabut akses ${license.redeemedBy?.username || "user"}?`
      : `Hapus key ${license.codePrefix}...?`;
    if (!window.confirm(message)) return;

    setDeletingId(license.id);
    try {
      const res = await api.deleteLicense(license.id, revokeUser);
      await load();
      toast({ title: res.message });
    } catch (e) {
      toast({ title: friendlyError(e), variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const copyCode = async () => {
    if (!generatedCode) return;
    await navigator.clipboard.writeText(generatedCode);
    toast({ title: "Kode license disalin." });
  };

  const editProvider = (provider: LlmProviderDto) => {
    setProviderForm({
      id: provider.id,
      name: provider.name,
      provider: provider.provider,
      baseUrl: provider.baseUrl,
      apiKey: "",
      model: provider.model,
      enabled: provider.enabled,
      priority: provider.priority,
      useJsonResponse: provider.useJsonResponse,
      maxTokens: provider.maxTokens,
      temperature: provider.temperature,
      timeoutMs: provider.timeoutMs,
    });
    setModelOptions([]);
  };

  const resetProviderForm = () => {
    setProviderForm({
      name: "",
      provider: "deepseek",
      baseUrl: "https://api.deepseek.com/v1",
      apiKey: "",
      model: "deepseek-v4-pro",
      enabled: true,
      priority: 10,
      useJsonResponse: false,
      maxTokens: 4096,
      temperature: 0.1,
      timeoutMs: 120000,
    });
    setModelOptions([]);
  };

  const saveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (providerForm.id) {
        const { id, apiKey, ...rest } = providerForm;
        await api.updateLlmProvider(id, apiKey.trim() ? { ...rest, apiKey } : rest);
        toast({ title: "Provider LLM diperbarui." });
      } else {
        if (!providerForm.apiKey.trim()) {
          toast({ title: "API key wajib diisi untuk provider baru.", variant: "destructive" });
          return;
        }
        const { id: _id, ...body } = providerForm;
        await api.createLlmProvider(body);
        toast({ title: "Provider LLM ditambahkan." });
      }
      resetProviderForm();
      await load();
    } catch (e) {
      toast({ title: friendlyError(e), variant: "destructive" });
    }
  };

  const fetchModels = async (provider?: LlmProviderDto) => {
    if (!provider) return;
    setProviderBusyId(provider.id);
    try {
      const result = await api.fetchLlmModels(provider.id);
      setModelOptions(result.models);
      toast({ title: `/models berhasil: ${result.models.length} model`, description: `${result.latencyMs} ms` });
      await load();
    } catch (e) {
      toast({ title: friendlyError(e), variant: "destructive" });
    } finally {
      setProviderBusyId(null);
    }
  };

  const testProvider = async (provider: LlmProviderDto) => {
    setProviderBusyId(provider.id);
    try {
      const result = await api.testLlmProvider(provider.id);
      toast({ title: result.ok ? "Provider sehat." : "Provider gagal.", description: `${result.latencyMs} ms - ${result.model || provider.model}` });
      await load();
    } catch (e) {
      toast({ title: friendlyError(e), variant: "destructive" });
    } finally {
      setProviderBusyId(null);
    }
  };

  const handleFormFetchModels = async () => {
    if (!providerForm.baseUrl || !providerForm.apiKey) {
      toast({ title: "Base URL dan API key wajib diisi untuk mendeteksi model.", variant: "destructive" });
      return;
    }
    setProviderBusyId("form-busy");
    try {
      const result = await api.detectLlmModels(providerForm.baseUrl, providerForm.apiKey);
      setModelOptions(result.models);
      toast({ title: `/models berhasil: ${result.models.length} model`, description: `${result.latencyMs} ms` });
    } catch (e) {
      toast({ title: friendlyError(e), variant: "destructive" });
    } finally {
      setProviderBusyId(null);
    }
  };

  const handleFormTestConnection = async () => {
    if (!providerForm.baseUrl || !providerForm.apiKey || !providerForm.model) {
      toast({ title: "Base URL, API key, dan Model wajib diisi untuk tes.", variant: "destructive" });
      return;
    }
    setProviderBusyId("form-busy");
    try {
      const result = await api.testLlmConnection({
        name: providerForm.name || "Test Connection",
        provider: providerForm.provider,
        baseUrl: providerForm.baseUrl,
        apiKey: providerForm.apiKey,
        model: providerForm.model,
        enabled: providerForm.enabled,
        priority: providerForm.priority,
        useJsonResponse: providerForm.useJsonResponse,
        maxTokens: providerForm.maxTokens,
        temperature: providerForm.temperature,
        timeoutMs: providerForm.timeoutMs,
      });
      toast({ 
        title: result.ok ? "Koneksi sehat." : "Koneksi gagal.", 
        description: `${result.latencyMs} ms - ${result.message}` 
      });
    } catch (e) {
      toast({ title: friendlyError(e), variant: "destructive" });
    } finally {
      setProviderBusyId(null);
    }
  };

  const removeProvider = async (provider: LlmProviderDto) => {
    if (!window.confirm(`Hapus provider ${provider.name}?`)) return;
    setProviderBusyId(provider.id);
    try {
      await api.deleteLlmProvider(provider.id);
      toast({ title: "Provider LLM dihapus." });
      await load();
    } catch (e) {
      toast({ title: friendlyError(e), variant: "destructive" });
    } finally {
      setProviderBusyId(null);
    }
  };

  if (!isAdmin) {
    return (
      <ViewShell
        size="narrow"
        eyebrow="Admin"
        title="Akses khusus admin"
        description="Masuk memakai akun admin untuk membuat dan memantau license code."
        icon={ShieldCheck}
      >
        <Card className="border-amber-300/50 bg-amber-50/60 dark:bg-amber-950/20">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Akun ini bukan admin. Silakan keluar lalu masuk dengan akun admin.</p>
            <Button className="mt-4" onClick={() => setView("signin")}>Ke halaman masuk</Button>
          </CardContent>
        </Card>
      </ViewShell>
    );
  }

  return (
    <ViewShell
      size="wide"
      eyebrow="Admin"
      title="Admin Center"
      description="Pantau pengguna, pemakaian, dan license code. Kode penuh hanya tampil sekali saat dibuat."
      icon={ShieldCheck}
      actions={<Badge variant="secondary">{activeCount} key aktif</Badge>}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total user" value={summary?.totalUsers ?? 0} icon={Users} />
        <MetricCard label="User aktif" value={summary?.activeUsers ?? 0} icon={Activity} />
        <MetricCard label="Paid/Admin" value={summary?.paidUsers ?? 0} icon={ShieldCheck} />
        <MetricCard label="Analisis bulan ini" value={summary?.analysesThisMonth ?? 0} icon={Sparkles} />
      </div>

      <Tabs defaultValue="licenses" className="mt-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="licenses">License keys</TabsTrigger>
          <TabsTrigger value="users">User usage</TabsTrigger>
          <TabsTrigger value="llm">LLM providers</TabsTrigger>
        </TabsList>

        <TabsContent value="licenses" className="mt-5">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.4fr)]">
            <CreateLicenseCard
              plan={plan}
              setPlan={setPlan}
              durationMonths={durationMonths}
              setDurationMonths={setDurationMonths}
              maxUses={maxUses}
              setMaxUses={setMaxUses}
              expiresInDays={expiresInDays}
              setExpiresInDays={setExpiresInDays}
              note={note}
              setNote={setNote}
              creating={creating}
              generatedCode={generatedCode}
              onCreate={create}
              onCopy={copyCode}
            />
            <LicenseList
              licenses={licenses}
              loading={loading}
              redeemedCount={redeemedCount}
              deletingId={deletingId}
              onDelete={deleteLicense}
            />
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-5">
          <Card className="shadow-soft">
            <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2 font-display text-xl text-ink">
                <UserRound className="h-5 w-5 text-primary" /> User usage
              </CardTitle>
              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Cari user, email, plan..."
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Memuat user usage...</p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Tidak ada user yang cocok.</p>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.map((u) => <UserUsageRow key={u.id} user={u} />)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="llm" className="mt-5">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.4fr)]">
            <LlmProviderForm
              form={providerForm}
              setForm={setProviderForm}
              modelOptions={modelOptions}
              busy={providerBusyId === "form-busy"}
              onFetchModels={handleFormFetchModels}
              onTestConnection={handleFormTestConnection}
              onSubmit={saveProvider}
              onReset={resetProviderForm}
            />
            <LlmProviderList
              providers={llmProviders}
              busyId={providerBusyId}
              onEdit={editProvider}
              onModels={fetchModels}
              onTest={testProvider}
              onDelete={removeProvider}
            />
          </div>
        </TabsContent>
      </Tabs>
    </ViewShell>
  );
}

function CreateLicenseCard(props: {
  plan: "LITE" | "PRO";
  setPlan: (plan: "LITE" | "PRO") => void;
  durationMonths: number;
  setDurationMonths: (n: number) => void;
  maxUses: number;
  setMaxUses: (n: number) => void;
  expiresInDays: number;
  setExpiresInDays: (n: number) => void;
  note: string;
  setNote: (v: string) => void;
  creating: boolean;
  generatedCode: string;
  onCreate: (e: React.FormEvent) => void;
  onCopy: () => void;
}) {
  return (
    <Card className="border-primary/20 shadow-soft">
      <CardHeader>
        <CardTitle className="font-display text-xl text-ink">Buat license code</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={props.onCreate} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Plan</Label>
              <Select value={props.plan} onValueChange={(v) => props.setPlan(v as "LITE" | "PRO")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LITE">Lite - 20 analisis/bulan</SelectItem>
                  <SelectItem value="PRO">Pro - 75 analisis/bulan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Durasi akses setelah redeem</Label>
              <Select value={String(props.durationMonths)} onValueChange={(v) => props.setDurationMonths(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 bulan</SelectItem>
                  <SelectItem value="3">3 bulan</SelectItem>
                  <SelectItem value="6">6 bulan</SelectItem>
                  <SelectItem value="12">12 bulan</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Lama Lite/Pro aktif di akun user setelah code dipakai.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="maxUses">Maks. user/pemakaian</Label>
              <Input id="maxUses" type="number" min={1} max={50} value={props.maxUses} onChange={(e) => props.setMaxUses(Number(e.target.value))} />
              <p className="text-xs text-muted-foreground">Biasanya 1 agar satu code hanya untuk satu user.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expiresInDays">Batas redeem code (hari)</Label>
              <Input id="expiresInDays" type="number" min={1} max={365} value={props.expiresInDays} onChange={(e) => props.setExpiresInDays(Number(e.target.value))} />
              <p className="text-xs text-muted-foreground">Lewat tanggal ini code hangus jika belum diredeem.</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note">Catatan internal</Label>
            <Textarea id="note" value={props.note} onChange={(e) => props.setNote(e.target.value)} placeholder="cth: Budi WA 0812..., bayar Lite 1 bulan" />
          </div>
          <Button type="submit" className="w-full gap-2" disabled={props.creating}>
            {props.creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Generate code
          </Button>
        </form>

        {props.generatedCode && (
          <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Kode baru - copy sekarang</p>
            <div className="mt-2 flex gap-2">
              <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-lg bg-background px-3 py-2 font-mono text-sm">{props.generatedCode}</code>
              <Button size="icon" onClick={props.onCopy} aria-label="Copy license code"><Copy className="h-4 w-4" /></Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Kode lengkap tidak disimpan plaintext di database.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LicenseList({
  licenses,
  loading,
  redeemedCount,
  deletingId,
  onDelete,
}: {
  licenses: LicenseCodeDto[];
  loading: boolean;
  redeemedCount: number;
  deletingId: string | null;
  onDelete: (license: LicenseCodeDto, revokeUser: boolean) => void;
}) {
  return (
    <Card className="shadow-soft">
      <CardHeader className="gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2 font-display text-xl text-ink">
          <Sparkles className="h-5 w-5 text-primary" /> Riwayat key
        </CardTitle>
        <Badge variant="secondary">{redeemedCount} sudah redeem</Badge>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Memuat license...</p>
        ) : licenses.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada license code.</p>
        ) : (
          <div className="space-y-3">
            {licenses.map((l) => (
              <div key={l.id} className="rounded-xl border bg-background/60 p-4 transition-all hover:border-primary/30 hover:shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold">{l.codePrefix}...</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {l.plan} - {l.durationMonths} bulan - {l.uses}/{l.maxUses} dipakai - {l.analysesLimit} analisis/bulan
                    </p>
                  </div>
                  <Badge variant={isLicenseUsable(l) ? "default" : "secondary"}>{licenseStatus(l)}</Badge>
                </div>
                {l.note && <p className="mt-2 text-sm text-muted-foreground">{l.note}</p>}
                <div className="mt-3 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                  <span>Dibuat: {formatDate(l.createdAt)}</span>
                  <span>Kedaluwarsa: {formatDate(l.expiresAt)}</span>
                  <span>Redeem: {formatDate(l.redeemedAt)}</span>
                  <span>User: {l.redeemedBy?.username || "-"}</span>
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                    disabled={deletingId === l.id}
                    onClick={() => onDelete(l, false)}
                  >
                    {deletingId === l.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Hapus key
                  </Button>
                  {l.redeemedBy && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      disabled={deletingId === l.id}
                      onClick={() => onDelete(l, true)}
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Cabut akses user
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UserUsageRow({ user }: { user: AdminUserDto }) {
  const percent = user.quota.limit > 0 ? Math.min(100, Math.round((user.quota.used / user.quota.limit) * 100)) : 0;
  return (
    <div className="rounded-xl border bg-background/60 p-4 transition-all hover:border-primary/30 hover:shadow-soft">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-ink">{user.displayName || user.username}</p>
            <Badge variant={user.plan === "FREE" ? "secondary" : "default"}>{user.plan}</Badge>
            {user.storedPlan !== user.plan && <Badge variant="outline">expired: {user.storedPlan}</Badge>}
          </div>
          <p className="mt-1 break-all text-xs text-muted-foreground">{user.username} - {user.email}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Bergabung {formatDate(user.createdAt)} - Expiry {formatDate(user.planExpiresAt)} - Total analisis {user.totalAnalyses}
          </p>
        </div>
        <div className="min-w-[180px] text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Usage bulan ini</span>
            <span className="font-semibold">{user.quota.used}/{user.quota.limit}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>
      {user.lastAnalysis && (
        <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          Terakhir: <span className="font-medium text-foreground">{user.lastAnalysis.title}</span>
          {user.lastAnalysis.overallRisk ? ` - ${user.lastAnalysis.overallRisk}` : ""}
          {typeof user.lastAnalysis.riskScore === "number" ? ` (${user.lastAnalysis.riskScore})` : ""}
          {" - "}
          {formatDate(user.lastAnalysis.createdAt)}
        </div>
      )}
    </div>
  );
}

function LlmProviderForm({
  form,
  setForm,
  modelOptions,
  busy,
  onFetchModels,
  onTestConnection,
  onSubmit,
  onReset,
}: {
  form: LlmProviderInput & { id?: string; apiKey: string };
  setForm: React.Dispatch<React.SetStateAction<LlmProviderInput & { id?: string; apiKey: string }>>;
  modelOptions: string[];
  busy: boolean;
  onFetchModels: () => void;
  onTestConnection: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
}) {
  return (
    <Card className="border-primary/20 shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-xl text-ink">
          <BrainCircuit className="h-5 w-5 text-primary" />
          {form.id ? "Edit provider LLM" : "Tambah provider LLM"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama">
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="DeepSeek V4 Pro" />
            </Field>
            <Field label="Provider tag">
              <Input value={form.provider} onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))} placeholder="deepseek / nvidia / iamhc / anthropic" />
            </Field>
          </div>
          <Field label="Base URL">
            <Input value={form.baseUrl} onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))} placeholder="https://api.deepseek.com/v1" />
          </Field>
          <Field label={form.id ? "API key baru (opsional)" : "API key"}>
            <Input
              value={form.apiKey}
              onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
              placeholder={form.id ? "Kosongkan kalau tidak diganti" : "sk-... / nvapi-..."}
              type="password"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <Field label="Model">
              <div className="flex gap-2">
                <div className="flex-1">
                  {modelOptions.length > 0 ? (
                    <Select value={form.model} onValueChange={(v) => setForm((f) => ({ ...f, model: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {modelOptions.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} placeholder="Tulis model manual" />
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  disabled={busy}
                  onClick={onFetchModels}
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Cek Model
                </Button>
              </div>
            </Field>
            <Field label="Priority">
              <Input className="w-28" type="number" min={1} max={999} value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Max tokens">
              <Input type="number" min={128} max={32768} value={form.maxTokens} onChange={(e) => setForm((f) => ({ ...f, maxTokens: Number(e.target.value) }))} />
            </Field>
            <Field label="Temperature">
              <Input type="number" min={0} max={2} step={0.1} value={form.temperature} onChange={(e) => setForm((f) => ({ ...f, temperature: Number(e.target.value) }))} />
            </Field>
            <Field label="Timeout ms">
              <Input type="number" min={5000} max={300000} value={form.timeoutMs} onChange={(e) => setForm((f) => ({ ...f, timeoutMs: Number(e.target.value) }))} />
            </Field>
          </div>
          <div className="grid gap-3 rounded-xl border bg-muted/30 p-3 text-sm sm:grid-cols-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.enabled} onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))} />
              Aktif dalam fallback chain
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.useJsonResponse} onChange={(e) => setForm((f) => ({ ...f, useJsonResponse: e.target.checked }))} />
              Kirim response_format JSON
            </label>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Priority kecil dicoba lebih dulu. Untuk DeepSeek V4 Pro, matikan response_format JSON bila output kosong/finish length.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" className="gap-2" disabled={busy}>
              <Save className="h-4 w-4" />
              {form.id ? "Simpan provider" : "Tambah provider"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={busy}
              onClick={onTestConnection}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Test Koneksi
            </Button>
            <Button type="button" variant="outline" onClick={onReset}>Reset form</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function LlmProviderList({
  providers,
  busyId,
  onEdit,
  onModels,
  onTest,
  onDelete,
}: {
  providers: LlmProviderDto[];
  busyId: string | null;
  onEdit: (provider: LlmProviderDto) => void;
  onModels: (provider: LlmProviderDto) => void;
  onTest: (provider: LlmProviderDto) => void;
  onDelete: (provider: LlmProviderDto) => void;
}) {
  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-xl text-ink">
          <BrainCircuit className="h-5 w-5 text-primary" /> Fallback chain
        </CardTitle>
      </CardHeader>
      <CardContent>
        {providers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada provider di database. Env masih dipakai sebagai fallback.</p>
        ) : (
          <div className="space-y-3">
            {providers.map((p) => (
              <div key={p.id} className="rounded-xl border bg-background/60 p-4 transition-all hover:border-primary/30 hover:shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink">{p.priority}. {p.name}</p>
                      <Badge variant={p.enabled ? "default" : "secondary"}>{p.enabled ? "Aktif" : "Off"}</Badge>
                      <Badge variant="outline">{p.provider}</Badge>
                    </div>
                    <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{p.model}</p>
                    <p className="mt-1 break-all text-xs text-muted-foreground">{p.baseUrl} - {p.apiKeyMasked}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{p.lastLatencyMs ? `${p.lastLatencyMs} ms` : "-"}</p>
                    <p>{p.lastStatus || "Belum dites"}</p>
                  </div>
                </div>
                <div className="mt-3 grid gap-1 text-xs text-muted-foreground sm:grid-cols-3">
                  <span>JSON format: {p.useJsonResponse ? "on" : "off"}</span>
                  <span>Max tokens: {p.maxTokens}</span>
                  <span>Timeout: {p.timeoutMs} ms</span>
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => onEdit(p)}>Edit</Button>
                  <Button size="sm" variant="outline" className="gap-2" disabled={busyId === p.id} onClick={() => onModels(p)}>
                    {busyId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    /models
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2" disabled={busyId === p.id} onClick={() => onTest(p)}>
                    {busyId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Test chat
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10" disabled={busyId === p.id} onClick={() => onDelete(p)}>
                    <Trash2 className="h-4 w-4" />
                    Hapus
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function isLicenseUsable(license: LicenseCodeDto) {
  const notFullyUsed = license.uses < license.maxUses;
  const notExpired = !license.expiresAt || new Date(license.expiresAt).getTime() > Date.now();
  return notFullyUsed && notExpired;
}

function licenseStatus(license: LicenseCodeDto) {
  if (license.uses >= license.maxUses) return "Terpakai";
  if (license.expiresAt && new Date(license.expiresAt).getTime() <= Date.now()) return "Expired";
  return "Aktif";
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID");
}
