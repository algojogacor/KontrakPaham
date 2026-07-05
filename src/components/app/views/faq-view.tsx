"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { FAQ_ITEMS } from "@/lib/content";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, Search, MessageCircle, Mail, Instagram, ArrowLeft, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { key: "all", label: "Semua" },
  { key: "umum", label: "Umum" },
  { key: "teknis", label: "Teknis" },
  { key: "hukum", label: "Hukum" },
  { key: "akun", label: "Akun" },
] as const;

export function FaqView() {
  const { setView } = useApp();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("all");

  const filtered = FAQ_ITEMS.filter((f) => {
    const matchCat = cat === "all" || f.category === cat;
    const q = query.toLowerCase();
    const matchQ =
      !q ||
      f.q.toLowerCase().includes(q) ||
      f.a.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Button variant="ghost" size="sm" className="mb-4 gap-1" onClick={() => setView("home")}>
        <ArrowLeft className="h-4 w-4" /> Beranda
      </Button>

      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <HelpCircle className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Pertanyaan Umum</h1>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
          Jawaban untuk pertanyaan yang sering ditanyakan soal KontrakPaham, analisis, dan kontrak.
        </p>
      </div>

      <div className="relative mt-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari pertanyaan…"
          className="pl-9"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              cat === c.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Tidak ada pertanyaan yang cocok dengan "{query}".
            </CardContent>
          </Card>
        ) : (
          <Accordion type="single" collapsible className="space-y-2">
            {filtered.map((f, i) => (
              <Card key={i} className="overflow-hidden">
                <AccordionItem value={`item-${i}`} className="border-b-0">
                  <AccordionTrigger className="px-4 py-4 text-left hover:no-underline">
                    <span className="pr-2 text-sm font-medium">{f.q}</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              </Card>
            ))}
          </Accordion>
        )}
      </div>

      <Card className="mt-8 border-primary/20 bg-primary/5">
        <CardContent className="p-6 text-center">
          <BookOpen className="mx-auto mb-2 h-6 w-6 text-primary" />
          <h3 className="font-semibold">Pertanyaan Anda tidak terjawab?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Hubungi kami langsung. Atau pelajari istilah hukum di glosarium.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button size="sm" onClick={() => setView("glossary")} variant="outline">Buka Glosarium</Button>
            <Button size="sm" asChild>
              <a href="https://wa.me/628999021644" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-1 h-4 w-4" /> Tanya via WhatsApp
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
