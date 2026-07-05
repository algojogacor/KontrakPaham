import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Space Grotesk — technical, precise, geometric. "Engineering blueprint" feel
// for display headlines. Pairs with the forensic/audit identity.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// JetBrains Mono — for contract text excerpts, dossier numbers, data readouts.
// Reinforces the "document forensics" identity.
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KontrakPaham — Audit Risiko Kontrak dalam 60 Detik",
  description:
    "Unggah kontrak (PDF/DOCX/teks) berbahasa Indonesia. Sistem mendeteksi klausul bermasalah, menjelaskan risiko dalam bahasa awam, dan memberi saran tindakan sebelum Anda tanda tangan.",
  keywords: [
    "analisis kontrak",
    "klausul kontrak",
    "hukum indonesia",
    "pahami kontrak",
    "risiko kontrak",
    "audit kontrak",
  ],
  authors: [{ name: "KontrakPaham" }],
  icons: { icon: "/logo.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
