import { ContractLoading } from "@/components/app/contract-loading";

export default function Loading() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm text-center">
        <ContractLoading title="Memuat KontrakPaham..." detail="Menyiapkan sesi dan ruang kerja." />
      </div>
    </div>
  );
}
