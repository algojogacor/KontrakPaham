import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
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

// Fraunces — characterful variable serif for editorial display headlines.
const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KontrakPaham — Baca Kontrak Seperti Ahli, dalam 60 Detik",
  description:
    "Unggah kontrak (PDF/DOCX/teks) berbahasa Indonesia. AI mendeteksi klausul bermasalah, menjelaskan risiko dalam bahasa awam, dan memberi saran tindakan sebelum Anda tanda tangan.",
  keywords: [
    "analisis kontrak",
    "klausul kontrak",
    "hukum indonesia",
    "pahami kontrak",
    "risiko kontrak",
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
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased bg-background text-foreground`}
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
