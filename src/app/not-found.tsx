import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <FileQuestion className="h-8 w-8" />
        </div>
        <p className="font-display text-6xl font-bold text-ink">404</p>
        <h1 className="mt-2 font-display text-xl font-semibold text-ink">
          Halaman tidak ditemukan
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Halaman yang Anda cari tidak ada atau sudah dipindahkan.
        </p>
        <Button asChild className="mt-6 gap-2">
          <Link href="/">
            <Home className="h-4 w-4" /> Kembali ke beranda
          </Link>
        </Button>
      </div>
    </div>
  );
}
