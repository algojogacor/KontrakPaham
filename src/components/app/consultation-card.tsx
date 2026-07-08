"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Instagram, Mail, GraduationCap, AlertTriangle } from "lucide-react";
import { useApp } from "@/lib/store";

const CONTACTS = {
  whatsapp: "08999021644",
  whatsappLink: "https://wa.me/628999021644",
  instagram: "@aryarizky04",
  instagramLink: "https://instagram.com/aryarizky04",
  email: "aryarizkyardhipratama@gmail.com",
};

export function ConsultationCard({ compact = false }: { compact?: boolean }) {
  const setView = useApp((s) => s.setView);
  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/30">
      <CardContent className={compact ? "p-4" : "p-6"}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground">Butuh diskusi lebih lanjut?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Hubungi untuk mendiskusikan hasil analisis. <span className="font-medium text-foreground">Jujur soal kredensial:</span>{" "}
              ini dikelola oleh mahasiswa hukum UNAIR, <strong>bukan advokat berlisensi</strong>.
              Bisa bantu memahami & memetakan opsi, bukan memberi nasihat hukum definitif.
            </p>

            <div className={compact ? "mt-3 grid grid-cols-1 gap-2" : "mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3"}>
              <Button asChild size="sm" className="bg-[#25D366] text-white hover:bg-[#1da851]">
                <a href={CONTACTS.whatsappLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </Button>
              <Button asChild size="sm" variant="outline">
                <a href={CONTACTS.instagramLink} target="_blank" rel="noopener noreferrer">
                  <Instagram className="h-4 w-4" /> Instagram
                </a>
              </Button>
              <Button asChild size="sm" variant="outline">
                <a href={`mailto:${CONTACTS.email}`}>
                  <Mail className="h-4 w-4" /> Email
                </a>
              </Button>
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-md bg-amber-50 p-2.5 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Untuk keputusan penting (tanda tangan kontrak, sengketa, transaksi besar), konsultasikan
                dengan advokat berlisensi. {!compact && <button onClick={() => setView("consultation")} className="font-semibold underline underline-offset-2">Pelajari lebih lanjut</button>}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
