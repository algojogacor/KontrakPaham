"use client";

import { useApp } from "@/lib/store";
import { ALL_LEGAL_DOCS, LEGAL_LAST_UPDATED, type LegalDoc } from "@/lib/legal-content";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Lock, Scale, ShieldAlert, FileWarning, Calendar } from "lucide-react";
import { ConsultationCard } from "@/components/app/consultation-card";

const ICONS: Record<string, any> = {
  FileText,
  Lock,
  Scale,
  ShieldAlert,
  FileWarning,
};

export function LegalView() {
  const { legalDocSlug, setView } = useApp();
  const doc = ALL_LEGAL_DOCS.find((d) => d.slug === legalDocSlug) || ALL_LEGAL_DOCS[0];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Button variant="ghost" size="sm" className="mb-4 gap-1" onClick={() => setView("home")}>
        <ArrowLeft className="h-4 w-4" /> Beranda
      </Button>

      {/* Doc selector */}
      <div className="mb-6 flex flex-wrap gap-2">
        {ALL_LEGAL_DOCS.map((d) => {
          const Icon = ICONS[d.icon] || FileText;
          const active = d.slug === doc.slug;
          return (
            <button
              key={d.slug}
              onClick={() => useApp.setState({ legalDocSlug: d.slug })}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted"
              }`}
            >
              <Icon className="h-3 w-3" />
              {d.title}
            </button>
          );
        })}
      </div>

      <Card className="overflow-hidden border-border/60 shadow-soft">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary to-amber-500" />
        <CardContent className="p-6 sm:p-8">
          {/* Title */}
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {(() => {
                const Icon = ICONS[doc.icon] || FileText;
                return <Icon className="h-6 w-6" />;
              })()}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                {doc.title}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">{doc.subtitle}</p>
            </div>
          </div>

          {/* Last updated */}
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>Terakhir diperbarui: {LEGAL_LAST_UPDATED}</span>
          </div>

          <div className="my-6 divider-ink" />

          {/* Sections */}
          <div className="space-y-6">
            {doc.sections.map((section, i) => (
              <LegalSectionView key={i} section={section} />
            ))}
          </div>

          {/* Footer nav to other docs */}
          <div className="my-6 divider-ink" />
          <h3 className="font-display text-sm font-semibold text-ink">Halaman legal lainnya</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {ALL_LEGAL_DOCS.filter((d) => d.slug !== doc.slug).map((d) => {
              const Icon = ICONS[d.icon] || FileText;
              return (
                <button
                  key={d.slug}
                  onClick={() => useApp.setState({ legalDocSlug: d.slug })}
                  className="group flex items-center gap-2 rounded-lg border border-border/60 p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/40"
                >
                  <Icon className="h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm font-medium text-ink group-hover:text-primary">{d.title}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Consultation CTA for disclaimer/liability */}
      {(doc.slug === "disclaimer" || doc.slug === "liability") && (
        <div className="mt-6">
          <ConsultationCard />
        </div>
      )}
    </div>
  );
}

function LegalSectionView({ section }: { section: any }) {
  return (
    <section>
      <h2 className="font-display text-lg font-semibold text-ink">{section.heading}</h2>
      <div className="mt-2 space-y-2">
        {section.body.map((para: string, i: number) => (
          <p key={i} className="text-sm leading-relaxed text-ink-soft">{para}</p>
        ))}
      </div>
      {section.list && section.list.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {section.list.map((item: string, i: number) => (
            <li key={i} className="flex items-start gap-2 text-sm text-ink-soft">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      )}
      {section.bodyAfterList && section.bodyAfterList.length > 0 && (
        <div className="mt-3 space-y-2">
          {section.bodyAfterList.map((para: string, i: number) => (
            <p key={i} className="text-sm leading-relaxed text-ink-soft">{para}</p>
          ))}
        </div>
      )}
    </section>
  );
}
