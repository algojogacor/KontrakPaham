import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: "KontrakPaham — Pahami Kontrak Anda Sebelum Tanda Tangan",
  description:
    "Unggah kontrak (PDF/DOCX/teks) dalam Bahasa Indonesia. Sistem mendeteksi klausul bermasalah, menjelaskan risiko dalam bahasa awam, dan memberi saran tindakan.",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
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
