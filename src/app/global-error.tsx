"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="id">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#1a1a1a", color: "#f5f5f5" }}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1rem", textAlign: "center" }}>
          <div style={{ maxWidth: 420 }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>
              Aplikasi mengalami masalah
            </h1>
            <p style={{ color: "#a3a3a3", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              Terjadi kesalahan fatal. Silakan muat ulang halaman. Jika masalah berlanjut,
              hubungi kami di WhatsApp 08999021644.
            </p>
            <button
              onClick={() => reset()}
              style={{
                background: "#2a6f4f", color: "#fff", border: "none", padding: "0.6rem 1.5rem",
                borderRadius: "0.5rem", cursor: "pointer", fontWeight: 500, fontSize: "0.875rem",
              }}
            >
              Muat ulang
            </button>
            <p style={{ marginTop: "1rem", fontSize: "0.75rem", color: "#737373" }}>
              {error.digest ? `Kode: ${error.digest}` : ""}
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
