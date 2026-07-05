import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

// Plus Jakarta Sans — Indonesian humanist sans. Friendly, readable, professional.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// Bricolage Grotesque — contemporary display with character. Warm-modern, not generic.
const bricolage = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// JetBrains Mono — ONLY for contract text excerpts (functional, not decorative terminal).
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KontrakPaham — Teman Baca Kontrak Anda",
  description:
    "Unggah kontrak (PDF/DOCX/teks) berbahasa Indonesia. Seorang 'teman baca' mendeteksi klausul berisiko, menjelaskan dalam bahasa awam, dan menemani Anda sampai paham — sebelum tanda tangan.",
  keywords: [
    "analisis kontrak",
    "klausul kontrak",
    "hukum indonesia",
    "pahami kontrak",
    "risiko kontrak",
    "teman baca kontrak",
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
        className={`${jakarta.variable} ${bricolage.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
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
