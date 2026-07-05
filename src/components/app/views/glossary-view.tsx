"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { GLOSSARY_ITEMS } from "@/lib/content";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Search, ArrowLeft, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

const CATS = [
  { key: "all", label: "Semua", emoji: "📚" },
  { key: "umum", label: "Umum", emoji: "📌" },
  { key: "kewajiban", label: "Kewajiban", emoji: "🧾" },
  { key: "sengketa", label: "Sengketa", emoji: "⚖️" },
  { key: "properti", label: "Properti", emoji: "🏠" },
  { key: "kerja", label: "Ketenagakerjaan", emoji: "💼" },
] as const;

export function GlossaryView() {
  const { setView } = useApp();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("all");

  const filtered = GLOSSARY_ITEMS.filter((g) => {
    const matchCat = cat === "all" || g.category === cat;
    const q = query.toLowerCase();
    const matchQ =
      !q ||
      g.term.toLowerCase().includes(q) ||
      g.definition.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Button variant="ghost" size="sm" className="mb-4 gap-1" onClick={() => setView("home")}>
        <ArrowLeft className="h-4 w-4" /> Beranda
      </Button>

      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <BookOpen className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Glosarium Istilah Hukum</h1>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
          Istilah hukum yang sering muncul di kontrak, dijelaskan dalam bahasa awam. Cari atau telusuri per kategori.
        </p>
      </div>

      <div className="relative mt-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari istilah… (cth: denda, arbitrase, deposit)"
          className="pl-9"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {CATS.map((c) => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              cat === c.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted"
            )}
          >
            <span>{c.emoji}</span>
            {c.label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {filtered.length === 0 ? (
          <Card className="border-dashed sm:col-span-2">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Tidak ada istilah yang cocok dengan "{query}".
            </CardContent>
          </Card>
        ) : (
          filtered.map((g, i) => (
            <Card key={i} className="h-full transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground">{g.term}</h3>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {CATS.find((c) => c.key === g.category)?.label}
                  </Badge>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{g.definition}</p>
                {g.example && (
                  <div className="mt-3 flex items-start gap-2 rounded-md bg-amber-50 p-2.5 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span><strong>Contoh:</strong> {g.example}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card className="mt-8 border-primary/20 bg-primary/5">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Glosarium ini terus berkembang. Ada istilah yang belum ada?{" "}
            <button onClick={() => setView("consultation")} className="font-semibold text-primary hover:underline">
              Sarankan istilah baru
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
