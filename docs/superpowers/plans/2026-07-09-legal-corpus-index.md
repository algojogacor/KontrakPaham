# Legal Corpus Index Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fast legal corpus database for Indonesian laws, articles, and legal references so KontrakPaham can use local indexed legal context as the primary source before calling You.com as an additional freshness layer.

**Architecture:** Turso remains the fast query/index layer and source of truth for curated legal references. Google Drive is optional cold storage for large source files, not the search engine. The app translates messy user/contract language into normalized legal issues, searches Turso indexes first, and calls You.com only as additional support when local confidence is low or the issue needs freshness beyond the curated corpus.

**Tech Stack:** Next.js 16, Prisma 7 with `@prisma/adapter-libsql`, Turso/libSQL, Bun tests, optional Google Drive API OAuth.

---

## Design Summary

Users will not search with formal legal wording. The search path must accept messy, layperson text from contracts and convert it into stable legal retrieval signals.

The retrieval flow is:

```text
contract text
  -> issue extraction (rules + optional LLM translator)
  -> Turso LegalArticleIndex keyword/tag search
  -> LegalArticle context returned with source/citation
  -> if confidence is low or freshness is needed, call You.com as additional research
```

Google Drive is used only after Turso has already found a record. Drive stores original PDFs, OCR text, or large snapshots. Turso stores the searchable metadata, pasal text, tags, normalized tokens, and Drive file IDs.

The local legal corpus is the primary source. You.com is not the default source once a relevant local result has medium or high confidence. You.com remains useful for current-law freshness, newly issued regulation checks, or gaps in the curated corpus.

## Comprehensive Tagging Taxonomy

The tagging system must be broad from the first implementation. User wording is expected to be informal, incomplete, or emotionally phrased. The app should translate that wording into stable legal tags before searching.

Tag families:

- `contract_formation`: `syarat_sah_perjanjian`, `kesepakatan`, `kecakapan`, `objek_tertentu`, `sebab_halal`, `itikad_baik`, `wanprestasi`, `perbuatan_melawan_hukum`.
- `consumer_protection`: `perlindungan_konsumen`, `klausul_baku`, `pengalihan_tanggung_jawab`, `pembatasan_ganti_rugi`, `larangan_pengembalian`, `pembuktian_sepihak`, `perubahan_sepihak`.
- `payment_and_penalty`: `denda`, `bunga`, `biaya_tersembunyi`, `keterlambatan_pembayaran`, `penagihan`, `refund`, `deposit`, `pembayaran_berulang`, `auto_debit`.
- `termination_and_default`: `pemutusan_sepihak`, `pembatalan`, `pengakhiran`, `cidera_janji`, `masa_tenggang`, `somasi`, `akselerasi_pembayaran`.
- `risk_allocation`: `pengalihan_risiko`, `indemnity`, `hold_harmless`, `limitation_of_liability`, `force_majeure`, `asuransi`, `kerusakan_barang`.
- `dispute_resolution`: `sengketa`, `arbitrase`, `mediasi`, `forum_hukum`, `domisili_hukum`, `choice_of_law`, `pengadilan`, `bani`, `small_claim`.
- `privacy_and_data`: `data_pribadi`, `persetujuan_data`, `pemrosesan_data`, `transfer_data`, `retensi_data`, `kebocoran_data`, `hak_subjek_data`, `nik_ktp`, `nomor_hp`.
- `digital_and_platform`: `akun`, `suspensi_akun`, `moderasi_konten`, `e_commerce`, `marketplace`, `tanda_tangan_elektronik`, `transaksi_elektronik`, `akses_layanan`.
- `employment_and_services`: `hubungan_kerja`, `kontraktor_independen`, `upah`, `lembur`, `non_compete`, `non_solicit`, `kerahasiaan`, `hak_kekayaan_intelektual`.
- `property_and_rent`: `sewa`, `deposit_sewa`, `pengosongan`, `perawatan`, `kerusakan_properti`, `kenaikan_sewa`, `jaminan`.
- `financing_and_credit`: `pinjaman`, `jaminan_fidusia`, `agunan`, `cicilan`, `restrukturisasi`, `kolektibilitas`, `pinjol`, `leasing`.
- `financial_services`: `perbankan`, `ojk`, `bi`, `asuransi`, `fintech`, `paylater`, `investasi`, `sekuritas`, `anti_pencucian_uang`.
- `corporate_and_commercial`: `jual_beli`, `distribusi`, `agen`, `franchise`, `saham`, `direksi`, `komisaris`, `kuasa`, `perizinan_usaha`.
- `intellectual_property`: `hak_cipta`, `merek`, `paten`, `lisensi`, `royalti`, `pengalihan_hak`, `konten`, `software`.
- `public_law_and_compliance`: `perizinan`, `sanksi_administratif`, `pidana`, `pajak`, `kepatuhan`, `pelaporan`, `larangan`, `kewajiban_regulator`.
- `evidence_and_procedure`: `alat_bukti`, `dokumen_elektronik`, `tanda_tangan`, `notaris`, `legalisasi`, `pembuktian`, `surat_kuasa`.

Each tag should have aliases in Bahasa Indonesia casual wording, formal legal terms, English loanwords, and common typo-ish phrases. The first version should not aim for perfect semantic search; it should aim for broad deterministic coverage and clear citations.

## Google Drive Connection Model

Google Drive API keys alone are not enough for private Drive files. For a personal Google One account, use OAuth 2.0:

1. Create a Google Cloud project.
2. Enable Google Drive API.
3. Configure OAuth consent screen.
4. Create OAuth Client ID for a web app or local bootstrap script.
5. Run a one-time local OAuth flow with the Google account that owns the 5TB Google One storage.
6. Store the refresh token in Koyeb env as `GOOGLE_DRIVE_REFRESH_TOKEN`.
7. Store `GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`, and `GOOGLE_DRIVE_ARCHIVE_FOLDER_ID`.

Service accounts are not the best default for Google One personal storage because they do not simply inherit a personal account's Google One quota. They are better for Workspace/domain-managed setups. For this project, OAuth user consent is the practical route.

### Google Console OAuth Client Setup

If the Google Console screen is **Create OAuth client ID**:

Recommended for this project:

- Application type: `Web application`
- Name: `KontrakPaham Drive Archive`
- Authorized JavaScript origins:
  - `http://localhost:3000`
  - `https://original-gypsy-bot-ternak-gacor-a8fada76.koyeb.app`
- Authorized redirect URIs:
  - `http://localhost:3000/api/google-drive/oauth/callback`
  - `https://original-gypsy-bot-ternak-gacor-a8fada76.koyeb.app/api/google-drive/oauth/callback`

Use the production Koyeb domain that is actually attached to the service if it changes. Google redirect URIs must match exactly, including scheme, host, path, and trailing slash behavior.

Alternative for a one-time local bootstrap only:

- Application type: `Desktop app`
- Name: `KontrakPaham Drive Archive Local Bootstrap`
- No JavaScript origins or redirect URIs are needed.

The `Desktop app` route is easier for getting a refresh token locally. The `Web application` route is better if the app will later have an admin page/button to connect Google Drive from the browser.

## Files To Create Or Modify

- Modify: `prisma/schema.prisma`
  - Add `LegalDocument`, `LegalArticle`, `LegalArticleIndex`, and optional `LegalSourceBlob`.
- Modify: `scripts/apply-core-schema.mjs`
  - Include legal corpus tables for new Turso database bootstrap.
- Create: `scripts/apply-legal-corpus-schema.mjs`
  - Idempotent schema migration for local SQLite and Turso.
- Create: `src/lib/legal-corpus.ts`
  - Normalization, issue extraction, index search, scoring, and context formatting.
- Create: `src/lib/legal-taxonomy.ts`
  - Comprehensive tag taxonomy and alias mapping for layperson-to-legal issue translation.
- Create: `src/lib/legal-corpus.test.ts`
  - Unit tests for query normalization, issue aliases, scoring, and context formatting.
- Modify: `src/lib/research.ts`
  - Search legal corpus before You.com and treat You.com as additional research.
- Create: `src/lib/legal-corpus-seed.ts`
  - Seed helpers for known legal documents/articles.
- Create: `scripts/seed-legal-corpus.mjs`
  - CLI seed script for curated pasal data.
- Optional create: `src/lib/google-drive-archive.ts`
  - OAuth client and file metadata helper for archive-only use.
- Optional create: `scripts/google-drive-oauth.mjs`
  - One-time local OAuth helper to obtain refresh token.
- Optional create: `scripts/google-drive-verify.mjs`
  - Verify OAuth refresh token and archive folder permissions.
- Modify: `worklog.md`
  - Record each completed implementation task.

---

### Task 1: Legal Corpus Helper Tests

**Files:**
- Create: `src/lib/legal-corpus.test.ts`
- Create later in Task 2: `src/lib/legal-taxonomy.ts`
- Create later in Task 2: `src/lib/legal-corpus.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, test } from "bun:test";
import {
  buildLegalCorpusContext,
  extractLegalIssueSignals,
  normalizeLegalSearchText,
  scoreLegalArticle,
} from "./legal-corpus";

describe("legal corpus helpers", () => {
  test("normalizes layperson wording into searchable text", () => {
    expect(normalizeLegalSearchText("  Denda 2% / HARI!!! telat bayar  "))
      .toBe("denda 2 hari telat bayar");
  });

  test("extracts legal issue signals from messy user language", () => {
    const signals = extractLegalIssueSignals(
      "Kalau telat bayar dendanya gede banget dan kontrak bisa diputus sepihak.",
    );

    expect(signals.tags).toContain("denda");
    expect(signals.tags).toContain("pemutusan_sepihak");
    expect(signals.keywords).toContain("telat bayar");
  });

  test("maps layperson complaints into comprehensive legal tag families", () => {
    const signals = extractLegalIssueSignals(
      "Akun saya tiba-tiba dibekukan, saldo ditahan, data KTP dipakai, refund ditolak, katanya semua risiko saya tanggung.",
    );

    expect(signals.tags).toContain("suspensi_akun");
    expect(signals.tags).toContain("data_pribadi");
    expect(signals.tags).toContain("refund");
    expect(signals.tags).toContain("pengalihan_risiko");
    expect(signals.tagFamilies).toEqual(
      expect.arrayContaining([
        "digital_and_platform",
        "privacy_and_data",
        "payment_and_penalty",
        "risk_allocation",
      ]),
    );
  });

  test("scores exact tags higher than loose keyword matches", () => {
    const score = scoreLegalArticle(
      {
        tags: ["klausul_baku", "denda"],
        normalizedText: "pasal klausul baku denda konsumen",
      },
      {
        tags: ["denda"],
        keywords: ["denda telat bayar"],
        normalizedQuery: "denda telat bayar sepihak",
      },
    );

    expect(score).toBeGreaterThanOrEqual(12);
  });

  test("formats legal corpus context with citation and source url", () => {
    const context = buildLegalCorpusContext([
      {
        documentTitle: "UU Perlindungan Konsumen",
        articleNumber: "Pasal 18",
        articleText: "Pelaku usaha dilarang mencantumkan klausul baku tertentu.",
        plainSummary: "Klausul baku yang terlalu sepihak dapat bermasalah.",
        sourceUrl: "https://peraturan.bpk.go.id/Details/45288/uu-no-8-tahun-1999",
        score: 18,
      },
    ]);

    expect(context.content).toContain("UU Perlindungan Konsumen Pasal 18");
    expect(context.content).toContain("https://peraturan.bpk.go.id/Details/45288/uu-no-8-tahun-1999");
    expect(context.sources[0]?.url).toContain("peraturan.bpk.go.id");
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `bun test src/lib/legal-corpus.test.ts`

Expected: FAIL because `src/lib/legal-corpus.ts` does not exist.

- [x] **Step 3: Commit failing tests**

```bash
git add src/lib/legal-corpus.test.ts
git commit -m "test: define legal corpus retrieval helpers"
```

---

### Task 2: Legal Corpus Helper Implementation

**Files:**
- Create: `src/lib/legal-taxonomy.ts`
- Create: `src/lib/legal-corpus.ts`

- [x] **Step 1: Create comprehensive taxonomy module**

Create `src/lib/legal-taxonomy.ts`:

```ts
export interface LegalTagDefinition {
  tag: string;
  family: string;
  aliases: string[];
}

export const LEGAL_TAG_DEFINITIONS: LegalTagDefinition[] = [
  { tag: "syarat_sah_perjanjian", family: "contract_formation", aliases: ["syarat sah", "perjanjian sah", "kontrak sah", "pasal 1320"] },
  { tag: "kesepakatan", family: "contract_formation", aliases: ["sepakat", "setuju", "persetujuan", "dipaksa tanda tangan", "tidak sadar setuju"] },
  { tag: "kecakapan", family: "contract_formation", aliases: ["belum dewasa", "anak di bawah umur", "tidak cakap", "wali"] },
  { tag: "objek_tertentu", family: "contract_formation", aliases: ["objek tidak jelas", "barang tidak jelas", "jasa tidak jelas", "yang diperjanjikan tidak jelas"] },
  { tag: "sebab_halal", family: "contract_formation", aliases: ["melanggar hukum", "tujuan ilegal", "sebab terlarang", "perjanjian ilegal"] },
  { tag: "itikad_baik", family: "contract_formation", aliases: ["itikad baik", "tidak fair", "tidak jujur", "menjebak", "menipu"] },
  { tag: "wanprestasi", family: "contract_formation", aliases: ["ingkar janji", "tidak memenuhi janji", "wanprestasi", "gagal memenuhi kewajiban"] },
  { tag: "perbuatan_melawan_hukum", family: "contract_formation", aliases: ["melawan hukum", "merugikan", "perbuatan melawan hukum", "pmh"] },

  { tag: "perlindungan_konsumen", family: "consumer_protection", aliases: ["konsumen", "pelanggan", "pembeli", "penyewa", "pengguna layanan"] },
  { tag: "klausul_baku", family: "consumer_protection", aliases: ["klausul baku", "syarat sepihak", "tidak bisa dinegosiasi", "take it or leave it", "aturan sepihak"] },
  { tag: "pengalihan_tanggung_jawab", family: "consumer_protection", aliases: ["tanggung jawab dialihkan", "semua risiko saya", "tidak bertanggung jawab", "lepas tanggung jawab"] },
  { tag: "pembatasan_ganti_rugi", family: "consumer_protection", aliases: ["ganti rugi dibatasi", "kompensasi kecil", "tidak dapat ganti rugi", "maksimal penggantian"] },
  { tag: "larangan_pengembalian", family: "consumer_protection", aliases: ["tidak boleh retur", "barang tidak bisa dikembalikan", "no return", "pengembalian ditolak"] },
  { tag: "pembuktian_sepihak", family: "consumer_protection", aliases: ["bukti sepihak", "keputusan final sepihak", "catatan perusahaan yang berlaku", "menentukan sendiri"] },
  { tag: "perubahan_sepihak", family: "consumer_protection", aliases: ["ubah sepihak", "syarat bisa berubah", "harga bisa berubah", "ketentuan berubah sewaktu waktu"] },

  { tag: "denda", family: "payment_and_penalty", aliases: ["denda", "penalty", "penalti", "sanksi uang", "biaya hukuman"] },
  { tag: "bunga", family: "payment_and_penalty", aliases: ["bunga", "interest", "bunga harian", "bunga berjalan"] },
  { tag: "biaya_tersembunyi", family: "payment_and_penalty", aliases: ["biaya tersembunyi", "admin fee", "biaya admin", "biaya tambahan", "charge tambahan"] },
  { tag: "keterlambatan_pembayaran", family: "payment_and_penalty", aliases: ["telat bayar", "terlambat bayar", "nunggak", "jatuh tempo", "keterlambatan"] },
  { tag: "penagihan", family: "payment_and_penalty", aliases: ["ditagih", "debt collector", "kolektor", "penagihan kasar", "diteror"] },
  { tag: "refund", family: "payment_and_penalty", aliases: ["refund", "pengembalian dana", "uang kembali", "refund ditolak", "dana ditahan"] },
  { tag: "deposit", family: "payment_and_penalty", aliases: ["deposit", "uang jaminan", "jaminan ditahan", "security deposit"] },
  { tag: "pembayaran_berulang", family: "payment_and_penalty", aliases: ["langganan", "subscription", "tagihan bulanan", "perpanjang otomatis"] },
  { tag: "auto_debit", family: "payment_and_penalty", aliases: ["auto debit", "debet otomatis", "potong otomatis", "kartu ditagih"] },

  { tag: "pemutusan_sepihak", family: "termination_and_default", aliases: ["putus sepihak", "diputus sepihak", "mengakhiri sepihak", "kontrak dihentikan sepihak"] },
  { tag: "pembatalan", family: "termination_and_default", aliases: ["batal", "dibatalkan", "pembatalan", "cancel"] },
  { tag: "pengakhiran", family: "termination_and_default", aliases: ["pengakhiran", "berakhir", "terminasi", "termination"] },
  { tag: "cidera_janji", family: "termination_and_default", aliases: ["cidera janji", "cedera janji", "default", "breach"] },
  { tag: "masa_tenggang", family: "termination_and_default", aliases: ["masa tenggang", "grace period", "waktu perbaikan", "kesempatan memperbaiki"] },
  { tag: "somasi", family: "termination_and_default", aliases: ["somasi", "teguran", "surat peringatan", "peringatan tertulis"] },
  { tag: "akselerasi_pembayaran", family: "termination_and_default", aliases: ["langsung lunas", "semua cicilan jatuh tempo", "akselerasi", "pelunasan dipercepat"] },

  { tag: "pengalihan_risiko", family: "risk_allocation", aliases: ["risiko ditanggung saya", "semua risiko saya", "pengalihan risiko", "beban risiko"] },
  { tag: "indemnity", family: "risk_allocation", aliases: ["indemnity", "ganti rugi semua", "membebaskan dari tuntutan", "menanggung klaim"] },
  { tag: "hold_harmless", family: "risk_allocation", aliases: ["hold harmless", "tidak menuntut", "membebaskan tanggung jawab"] },
  { tag: "limitation_of_liability", family: "risk_allocation", aliases: ["batas tanggung jawab", "liability dibatasi", "tanggung jawab maksimal"] },
  { tag: "force_majeure", family: "risk_allocation", aliases: ["force majeure", "keadaan kahar", "bencana", "di luar kuasa", "wabah"] },
  { tag: "asuransi", family: "risk_allocation", aliases: ["asuransi", "pertanggungan", "klaim asuransi", "polis"] },
  { tag: "kerusakan_barang", family: "risk_allocation", aliases: ["barang rusak", "kerusakan", "hilang", "cacat barang"] },

  { tag: "sengketa", family: "dispute_resolution", aliases: ["sengketa", "perselisihan", "dispute", "masalah hukum"] },
  { tag: "arbitrase", family: "dispute_resolution", aliases: ["arbitrase", "bani", "arbitration", "arbiter"] },
  { tag: "mediasi", family: "dispute_resolution", aliases: ["mediasi", "mediator", "musyawarah", "negosiasi sengketa"] },
  { tag: "forum_hukum", family: "dispute_resolution", aliases: ["forum hukum", "pengadilan mana", "kompetensi pengadilan", "venue"] },
  { tag: "domisili_hukum", family: "dispute_resolution", aliases: ["domisili hukum", "kedudukan hukum", "alamat hukum"] },
  { tag: "choice_of_law", family: "dispute_resolution", aliases: ["hukum yang berlaku", "choice of law", "governing law", "hukum asing"] },
  { tag: "pengadilan", family: "dispute_resolution", aliases: ["pengadilan", "pn", "gugatan", "litigasi"] },
  { tag: "small_claim", family: "dispute_resolution", aliases: ["gugatan sederhana", "small claim", "nilai kecil"] },

  { tag: "data_pribadi", family: "privacy_and_data", aliases: ["data pribadi", "nik", "ktp", "privasi", "nomor hp", "foto ktp"] },
  { tag: "persetujuan_data", family: "privacy_and_data", aliases: ["izin data", "persetujuan data", "consent", "setuju data dipakai"] },
  { tag: "pemrosesan_data", family: "privacy_and_data", aliases: ["olah data", "pemrosesan data", "data dipakai", "profiling"] },
  { tag: "transfer_data", family: "privacy_and_data", aliases: ["data dibagikan", "transfer data", "pihak ketiga", "data dijual"] },
  { tag: "retensi_data", family: "privacy_and_data", aliases: ["data disimpan", "hapus data", "retensi", "berapa lama data"] },
  { tag: "kebocoran_data", family: "privacy_and_data", aliases: ["data bocor", "kebocoran", "diretas", "leak"] },
  { tag: "hak_subjek_data", family: "privacy_and_data", aliases: ["hak akses data", "hak hapus", "koreksi data", "tarik persetujuan"] },

  { tag: "akun", family: "digital_and_platform", aliases: ["akun", "account", "login", "profil"] },
  { tag: "suspensi_akun", family: "digital_and_platform", aliases: ["akun dibekukan", "akun ditutup", "suspend", "banned", "saldo ditahan"] },
  { tag: "moderasi_konten", family: "digital_and_platform", aliases: ["konten dihapus", "moderasi", "take down", "pelanggaran konten"] },
  { tag: "e_commerce", family: "digital_and_platform", aliases: ["ecommerce", "e-commerce", "marketplace", "toko online"] },
  { tag: "tanda_tangan_elektronik", family: "digital_and_platform", aliases: ["tanda tangan elektronik", "esign", "e-sign", "tte"] },
  { tag: "transaksi_elektronik", family: "digital_and_platform", aliases: ["transaksi elektronik", "online", "digital", "sistem elektronik"] },
  { tag: "akses_layanan", family: "digital_and_platform", aliases: ["akses layanan", "layanan tidak bisa dipakai", "downtime", "fitur dicabut"] },

  { tag: "hubungan_kerja", family: "employment_and_services", aliases: ["karyawan", "hubungan kerja", "pegawai", "phk"] },
  { tag: "kontraktor_independen", family: "employment_and_services", aliases: ["freelance", "kontraktor", "mitra", "bukan karyawan"] },
  { tag: "upah", family: "employment_and_services", aliases: ["upah", "gaji", "honor", "fee jasa"] },
  { tag: "lembur", family: "employment_and_services", aliases: ["lembur", "overtime", "jam kerja lebih"] },
  { tag: "non_compete", family: "employment_and_services", aliases: ["non compete", "tidak boleh kerja di pesaing", "larangan bersaing"] },
  { tag: "non_solicit", family: "employment_and_services", aliases: ["non solicit", "tidak boleh ajak klien", "tidak boleh rekrut"] },
  { tag: "kerahasiaan", family: "employment_and_services", aliases: ["rahasia", "nda", "confidential", "kerahasiaan"] },
  { tag: "hak_kekayaan_intelektual", family: "employment_and_services", aliases: ["hak cipta kerja", "ip milik perusahaan", "hasil kerja milik"] },

  { tag: "sewa", family: "property_and_rent", aliases: ["sewa", "kontrak rumah", "ruko", "apartemen", "kos"] },
  { tag: "deposit_sewa", family: "property_and_rent", aliases: ["deposit sewa", "uang jaminan sewa", "deposit kos"] },
  { tag: "pengosongan", family: "property_and_rent", aliases: ["pengosongan", "diusir", "keluar dari rumah", "vacate"] },
  { tag: "perawatan", family: "property_and_rent", aliases: ["perawatan", "maintenance", "perbaikan", "renovasi"] },
  { tag: "kerusakan_properti", family: "property_and_rent", aliases: ["kerusakan properti", "tembok rusak", "barang sewaan rusak"] },
  { tag: "kenaikan_sewa", family: "property_and_rent", aliases: ["sewa naik", "kenaikan sewa", "harga sewa berubah"] },

  { tag: "pinjaman", family: "financing_and_credit", aliases: ["pinjaman", "utang", "loan", "kredit"] },
  { tag: "jaminan_fidusia", family: "financing_and_credit", aliases: ["fidusia", "jaminan fidusia", "bpkb", "objek jaminan"] },
  { tag: "agunan", family: "financing_and_credit", aliases: ["agunan", "jaminan", "collateral", "sertifikat"] },
  { tag: "cicilan", family: "financing_and_credit", aliases: ["cicilan", "angsuran", "installment", "bayar bulanan"] },
  { tag: "restrukturisasi", family: "financing_and_credit", aliases: ["restrukturisasi", "keringanan", "reschedule", "renegosiasi utang"] },
  { tag: "kolektibilitas", family: "financing_and_credit", aliases: ["slik", "bi checking", "kolektibilitas", "skor kredit"] },
  { tag: "pinjol", family: "financing_and_credit", aliases: ["pinjol", "pinjaman online", "fintech lending", "galbay"] },
  { tag: "leasing", family: "financing_and_credit", aliases: ["leasing", "pembiayaan", "kredit motor", "kredit mobil"] },

  { tag: "perbankan", family: "financial_services", aliases: ["bank", "rekening", "perbankan", "tabungan"] },
  { tag: "ojk", family: "financial_services", aliases: ["ojk", "otoritas jasa keuangan", "regulator keuangan"] },
  { tag: "bi", family: "financial_services", aliases: ["bank indonesia", "bi", "qris", "sistem pembayaran"] },
  { tag: "asuransi_keuangan", family: "financial_services", aliases: ["asuransi jiwa", "asuransi kesehatan", "premi", "klaim ditolak"] },
  { tag: "paylater", family: "financial_services", aliases: ["paylater", "bayar nanti", "spaylater", "gopaylater"] },
  { tag: "investasi", family: "financial_services", aliases: ["investasi", "return", "profit", "modal", "robot trading"] },
  { tag: "anti_pencucian_uang", family: "financial_services", aliases: ["aml", "pencucian uang", "kyc", "sumber dana"] },

  { tag: "jual_beli", family: "corporate_and_commercial", aliases: ["jual beli", "pembelian", "penjualan", "purchase"] },
  { tag: "distribusi", family: "corporate_and_commercial", aliases: ["distributor", "distribusi", "reseller", "stokis"] },
  { tag: "agen", family: "corporate_and_commercial", aliases: ["agen", "agency", "perwakilan"] },
  { tag: "franchise", family: "corporate_and_commercial", aliases: ["franchise", "waralaba", "franchisor", "franchisee"] },
  { tag: "saham", family: "corporate_and_commercial", aliases: ["saham", "shareholder", "pemegang saham", "equity"] },
  { tag: "direksi", family: "corporate_and_commercial", aliases: ["direksi", "direktur", "pengurus perusahaan"] },
  { tag: "komisaris", family: "corporate_and_commercial", aliases: ["komisaris", "dewan komisaris", "pengawas"] },
  { tag: "kuasa", family: "corporate_and_commercial", aliases: ["kuasa", "surat kuasa", "power of attorney", "wakil"] },
  { tag: "perizinan_usaha", family: "corporate_and_commercial", aliases: ["izin usaha", "nib", "oss", "perizinan usaha"] },

  { tag: "hak_cipta", family: "intellectual_property", aliases: ["hak cipta", "copyright", "ciptaan", "konten saya"] },
  { tag: "merek", family: "intellectual_property", aliases: ["merek", "brand", "trademark", "nama dagang"] },
  { tag: "paten", family: "intellectual_property", aliases: ["paten", "invensi", "patent"] },
  { tag: "lisensi", family: "intellectual_property", aliases: ["lisensi", "license", "izin pakai", "hak pakai"] },
  { tag: "royalti", family: "intellectual_property", aliases: ["royalti", "royalty", "bagi hasil ip"] },
  { tag: "pengalihan_hak", family: "intellectual_property", aliases: ["hak dialihkan", "assignment", "alih hak", "milik sepenuhnya"] },
  { tag: "software", family: "intellectual_property", aliases: ["software", "aplikasi", "source code", "kode sumber"] },

  { tag: "perizinan", family: "public_law_and_compliance", aliases: ["izin", "lisensi usaha", "izin pemerintah", "persetujuan regulator"] },
  { tag: "sanksi_administratif", family: "public_law_and_compliance", aliases: ["sanksi administratif", "denda administratif", "teguran regulator"] },
  { tag: "pidana", family: "public_law_and_compliance", aliases: ["pidana", "penjara", "lapor polisi", "tindak pidana"] },
  { tag: "pajak", family: "public_law_and_compliance", aliases: ["pajak", "ppn", "pph", "npwp", "faktur"] },
  { tag: "kepatuhan", family: "public_law_and_compliance", aliases: ["compliance", "kepatuhan", "wajib patuh", "aturan regulator"] },
  { tag: "pelaporan", family: "public_law_and_compliance", aliases: ["lapor", "pelaporan", "laporan berkala", "notifikasi regulator"] },
  { tag: "larangan", family: "public_law_and_compliance", aliases: ["dilarang", "larangan", "tidak boleh", "prohibited"] },
  { tag: "kewajiban_regulator", family: "public_law_and_compliance", aliases: ["wajib", "kewajiban regulator", "harus memenuhi", "mandatory"] },

  { tag: "alat_bukti", family: "evidence_and_procedure", aliases: ["bukti", "alat bukti", "evidence", "rekaman", "chat"] },
  { tag: "dokumen_elektronik", family: "evidence_and_procedure", aliases: ["dokumen elektronik", "email", "screenshot", "whatsapp"] },
  { tag: "tanda_tangan", family: "evidence_and_procedure", aliases: ["tanda tangan", "ttd", "ditandatangani", "signature"] },
  { tag: "notaris", family: "evidence_and_procedure", aliases: ["notaris", "akta", "waarmerking", "legalisasi"] },
  { tag: "legalisasi", family: "evidence_and_procedure", aliases: ["legalisasi", "apostille", "pengesahan", "dilegalisir"] },
  { tag: "pembuktian", family: "evidence_and_procedure", aliases: ["membuktikan", "beban pembuktian", "siapa yang harus bukti"] },
  { tag: "surat_kuasa", family: "evidence_and_procedure", aliases: ["surat kuasa", "kuasa khusus", "wakil hukum"] },
];
```

- [x] **Step 2: Implement helper module**

```ts
import { LEGAL_TAG_DEFINITIONS } from "@/lib/legal-taxonomy";
import type { ResearchSource } from "@/lib/research";

export interface LegalIssueSignals {
  normalizedQuery: string;
  tags: string[];
  tagFamilies: string[];
  keywords: string[];
}

export interface LegalArticleSearchRow {
  tags: string[];
  normalizedText: string;
}

export interface LegalCorpusResult {
  documentTitle: string;
  articleNumber: string;
  articleText: string;
  plainSummary: string | null;
  sourceUrl: string | null;
  score: number;
}

export interface LegalCorpusContext {
  enabled: boolean;
  query: string;
  content: string;
  sources: ResearchSource[];
  latencyMs: number;
  confidence: "low" | "medium" | "high";
}

export function normalizeLegalSearchText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractLegalIssueSignals(text: string): LegalIssueSignals {
  const normalizedQuery = normalizeLegalSearchText(text);
  const tags = new Set<string>();
  const tagFamilies = new Set<string>();
  const keywords = new Set<string>();

  for (const definition of LEGAL_TAG_DEFINITIONS) {
    for (const phrase of definition.aliases) {
      if (normalizedQuery.includes(normalizeLegalSearchText(phrase))) {
        tags.add(definition.tag);
        tagFamilies.add(definition.family);
        keywords.add(phrase);
      }
    }
  }

  for (const token of normalizedQuery.split(" ")) {
    if (token.length >= 5) keywords.add(token);
  }

  return {
    normalizedQuery,
    tags: [...tags],
    tagFamilies: [...tagFamilies],
    keywords: [...keywords].slice(0, 24),
  };
}

export function scoreLegalArticle(row: LegalArticleSearchRow, signals: LegalIssueSignals) {
  let score = 0;
  const rowTags = new Set(row.tags);
  for (const tag of signals.tags) {
    if (rowTags.has(tag)) score += 12;
  }
  for (const keyword of signals.keywords) {
    if (row.normalizedText.includes(normalizeLegalSearchText(keyword))) score += 2;
  }
  if (signals.normalizedQuery && row.normalizedText.includes(signals.normalizedQuery)) score += 8;
  return score;
}

export function confidenceFromScore(score: number): LegalCorpusContext["confidence"] {
  if (score >= 18) return "high";
  if (score >= 8) return "medium";
  return "low";
}

export function buildLegalCorpusContext(results: LegalCorpusResult[]): LegalCorpusContext {
  const top = results.slice(0, 6);
  const bestScore = top[0]?.score || 0;
  const sources = top
    .filter((item) => item.sourceUrl)
    .map((item) => ({
      title: `${item.documentTitle} ${item.articleNumber}`,
      url: item.sourceUrl as string,
    }));

  const content = top
    .map((item, index) => {
      const summary = item.plainSummary ? `Ringkasan: ${item.plainSummary}\n` : "";
      const source = item.sourceUrl ? `Sumber: ${item.sourceUrl}\n` : "";
      return `${index + 1}. ${item.documentTitle} ${item.articleNumber}\n${summary}Teks: ${item.articleText}\n${source}Skor: ${item.score}`;
    })
    .join("\n\n");

  return {
    enabled: top.length > 0,
    query: "",
    content,
    sources,
    latencyMs: 0,
    confidence: confidenceFromScore(bestScore),
  };
}
```

- [x] **Step 3: Run helper tests**

Run: `bun test src/lib/legal-corpus.test.ts`

Expected: PASS.

- [x] **Step 4: Commit helper implementation**

```bash
git add src/lib/legal-taxonomy.ts src/lib/legal-corpus.ts src/lib/legal-corpus.test.ts
git commit -m "feat: add legal corpus retrieval helpers"
```

---

### Task 3: Database Schema And Migration

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `scripts/apply-core-schema.mjs`
- Create: `scripts/apply-legal-corpus-schema.mjs`

- [x] **Step 1: Add Prisma models**

Add these models to `prisma/schema.prisma`:

```prisma
model LegalDocument {
  id              String   @id @default(cuid())
  title           String
  type            String
  number          String?
  year            Int?
  jurisdiction    String   @default("ID")
  sourceUrl       String?
  sourceHost      String?
  status          String   @default("ACTIVE")
  driveFileId     String?
  contentHash     String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  articles LegalArticle[]

  @@index([type, year])
  @@index([sourceHost])
}

model LegalArticle {
  id              String   @id @default(cuid())
  documentId      String
  articleNumber   String
  title           String?
  text            String
  plainSummary    String?
  tags            String
  normalizedText  String
  sourceUrl       String?
  contentHash     String   @unique
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  document LegalDocument @relation(fields: [documentId], references: [id], onDelete: Cascade)
  indexRows LegalArticleIndex[]

  @@index([documentId, articleNumber])
}

model LegalArticleIndex {
  id         String @id @default(cuid())
  articleId  String
  token      String
  tag        String?
  weight     Int    @default(1)

  article LegalArticle @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([tag])
  @@unique([articleId, token])
}
```

- [x] **Step 2: Write idempotent schema script**

Create `scripts/apply-legal-corpus-schema.mjs`:

```js
import { createClient } from "@libsql/client";
import { existsSync, readFileSync } from "node:fs";

if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    if (!process.env[key]) process.env[key] = trimmed.slice(eq + 1);
  }
}

const statements = [
  `CREATE TABLE IF NOT EXISTS "LegalDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "number" TEXT,
    "year" INTEGER,
    "jurisdiction" TEXT NOT NULL DEFAULT 'ID',
    "sourceUrl" TEXT,
    "sourceHost" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "driveFileId" TEXT,
    "contentHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "LegalDocument_type_year_idx" ON "LegalDocument"("type", "year")`,
  `CREATE INDEX IF NOT EXISTS "LegalDocument_sourceHost_idx" ON "LegalDocument"("sourceHost")`,
  `CREATE TABLE IF NOT EXISTS "LegalArticle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "articleNumber" TEXT NOT NULL,
    "title" TEXT,
    "text" TEXT NOT NULL,
    "plainSummary" TEXT,
    "tags" TEXT NOT NULL,
    "normalizedText" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "contentHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LegalArticle_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "LegalDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "LegalArticle_contentHash_key" ON "LegalArticle"("contentHash")`,
  `CREATE INDEX IF NOT EXISTS "LegalArticle_documentId_articleNumber_idx" ON "LegalArticle"("documentId", "articleNumber")`,
  `CREATE TABLE IF NOT EXISTS "LegalArticleIndex" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "tag" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "LegalArticleIndex_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "LegalArticle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "LegalArticleIndex_token_idx" ON "LegalArticleIndex"("token")`,
  `CREATE INDEX IF NOT EXISTS "LegalArticleIndex_tag_idx" ON "LegalArticleIndex"("tag")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "LegalArticleIndex_articleId_token_key" ON "LegalArticleIndex"("articleId", "token")`,
];

async function apply(client, label) {
  for (const statement of statements) {
    await client.execute(statement);
  }
  console.log(`${label}: legal corpus schema ready`);
}

async function withClient(config, label) {
  const client = createClient(config);
  try {
    await apply(client, label);
  } finally {
    client.close();
  }
}

await withClient({ url: process.env.LOCAL_SQLITE_URL || "file:db/custom.db" }, "local");

if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
  await withClient(
    { url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN },
    "turso",
  );
} else {
  console.log("turso: skipped (TURSO_DATABASE_URL/TURSO_AUTH_TOKEN missing)");
}
```

- [x] **Step 3: Add the same table statements to `scripts/apply-core-schema.mjs`**

Add legal corpus table/index statements near the other core schema statements so new databases are bootstrapped completely.

- [x] **Step 4: Run migration script**

Run: `node scripts/apply-legal-corpus-schema.mjs`

Expected:

```text
local: legal corpus schema ready
turso: legal corpus schema ready
```

- [x] **Step 5: Generate Prisma client**

Run: `bunx prisma generate`

Expected: Prisma Client generated successfully.

- [x] **Step 6: Commit schema**

```bash
git add prisma/schema.prisma scripts/apply-core-schema.mjs scripts/apply-legal-corpus-schema.mjs
git commit -m "feat: add legal corpus schema"
```

---

### Task 4: Seed Curated Legal Articles

**Files:**
- Create: `src/lib/legal-corpus-seed.ts`
- Create: `scripts/seed-legal-corpus.mjs`

- [x] **Step 1: Create seed data helper**

Create `src/lib/legal-corpus-seed.ts`:

```ts
import { createHash } from "crypto";
import { db } from "@/lib/db";
import { extractLegalIssueSignals, normalizeLegalSearchText } from "@/lib/legal-corpus";

export interface SeedLegalArticleInput {
  document: {
    title: string;
    type: string;
    number?: string;
    year?: number;
    sourceUrl?: string;
    sourceHost?: string;
  };
  articleNumber: string;
  title?: string;
  text: string;
  plainSummary?: string;
  tags: string[];
  sourceUrl?: string;
}

function hashArticle(input: SeedLegalArticleInput) {
  return createHash("sha256")
    .update(`${input.document.title}|${input.articleNumber}|${input.text}`, "utf8")
    .digest("hex");
}

function tokensForArticle(input: SeedLegalArticleInput) {
  const signals = extractLegalIssueSignals(`${input.text} ${input.plainSummary || ""} ${input.tags.join(" ")}`);
  return [...new Set([...signals.keywords, ...input.tags, ...signals.normalizedQuery.split(" ")])]
    .map(normalizeLegalSearchText)
    .filter((token) => token.length >= 3)
    .slice(0, 80);
}

export async function seedLegalArticles(items: SeedLegalArticleInput[]) {
  for (const item of items) {
    const document = await db.legalDocument.upsert({
      where: { id: createHash("sha256").update(item.document.title).digest("hex").slice(0, 24) },
      create: {
        id: createHash("sha256").update(item.document.title).digest("hex").slice(0, 24),
        title: item.document.title,
        type: item.document.type,
        number: item.document.number || null,
        year: item.document.year || null,
        sourceUrl: item.document.sourceUrl || null,
        sourceHost: item.document.sourceHost || null,
        updatedAt: new Date(),
      },
      update: {
        type: item.document.type,
        number: item.document.number || null,
        year: item.document.year || null,
        sourceUrl: item.document.sourceUrl || null,
        sourceHost: item.document.sourceHost || null,
        updatedAt: new Date(),
      },
    });

    const contentHash = hashArticle(item);
    const article = await db.legalArticle.upsert({
      where: { contentHash },
      create: {
        documentId: document.id,
        articleNumber: item.articleNumber,
        title: item.title || null,
        text: item.text,
        plainSummary: item.plainSummary || null,
        tags: JSON.stringify(item.tags),
        normalizedText: normalizeLegalSearchText(`${item.articleNumber} ${item.title || ""} ${item.text} ${item.plainSummary || ""} ${item.tags.join(" ")}`),
        sourceUrl: item.sourceUrl || item.document.sourceUrl || null,
        contentHash,
        updatedAt: new Date(),
      },
      update: {
        articleNumber: item.articleNumber,
        title: item.title || null,
        text: item.text,
        plainSummary: item.plainSummary || null,
        tags: JSON.stringify(item.tags),
        normalizedText: normalizeLegalSearchText(`${item.articleNumber} ${item.title || ""} ${item.text} ${item.plainSummary || ""} ${item.tags.join(" ")}`),
        sourceUrl: item.sourceUrl || item.document.sourceUrl || null,
        updatedAt: new Date(),
      },
    });

    for (const token of tokensForArticle(item)) {
      await db.legalArticleIndex.upsert({
        where: { articleId_token: { articleId: article.id, token } },
        create: {
          articleId: article.id,
          token,
          tag: item.tags.includes(token) ? token : null,
          weight: item.tags.includes(token) ? 5 : 1,
        },
        update: {
          tag: item.tags.includes(token) ? token : null,
          weight: item.tags.includes(token) ? 5 : 1,
        },
      });
    }
  }
}
```

- [x] **Step 2: Create seed script**

Create `scripts/seed-legal-corpus.mjs`:

```js
import { seedLegalArticles } from "../src/lib/legal-corpus-seed.ts";

await seedLegalArticles([
  {
    document: {
      title: "Undang-Undang Nomor 8 Tahun 1999 tentang Perlindungan Konsumen",
      type: "UU",
      number: "8",
      year: 1999,
      sourceUrl: "https://peraturan.bpk.go.id/Details/45288/uu-no-8-tahun-1999",
      sourceHost: "peraturan.bpk.go.id",
    },
    articleNumber: "Pasal 18",
    title: "Klausul Baku",
    text: "Pelaku usaha dalam menawarkan barang dan/atau jasa yang ditujukan untuk diperdagangkan dilarang membuat atau mencantumkan klausula baku pada setiap dokumen dan/atau perjanjian apabila menyatakan pengalihan tanggung jawab pelaku usaha.",
    plainSummary: "Klausul baku yang mengalihkan tanggung jawab secara sepihak dapat berisiko bagi konsumen.",
    tags: ["klausul_baku", "perlindungan_konsumen", "pengalihan_risiko"],
  },
  {
    document: {
      title: "Kitab Undang-Undang Hukum Perdata",
      type: "KUHPerdata",
      sourceUrl: "https://peraturan.bpk.go.id/Details/150927/kuhperdata",
      sourceHost: "peraturan.bpk.go.id",
    },
    articleNumber: "Pasal 1320",
    title: "Syarat Sah Perjanjian",
    text: "Supaya terjadi persetujuan yang sah, perlu dipenuhi empat syarat: kesepakatan mereka yang mengikatkan dirinya, kecakapan untuk membuat suatu perikatan, suatu pokok persoalan tertentu, dan suatu sebab yang tidak terlarang.",
    plainSummary: "Perjanjian perlu memenuhi kesepakatan, kecakapan, objek tertentu, dan sebab yang tidak terlarang.",
    tags: ["syarat_sah_perjanjian", "kesepakatan", "perjanjian"],
  },
]);

console.log("Legal corpus seed complete.");
```

- [x] **Step 3: Run seed script**

Run: `bun scripts/seed-legal-corpus.mjs`

Expected: `Legal corpus seed complete.`

- [x] **Step 4: Commit seed support**

```bash
git add src/lib/legal-corpus-seed.ts scripts/seed-legal-corpus.mjs
git commit -m "feat: seed initial legal corpus"
```

---

### Task 5: Database Search Integration

**Files:**
- Modify: `src/lib/legal-corpus.ts`
- Modify: `src/lib/legal-corpus.test.ts`

- [x] **Step 1: Add failing test for result formatting from DB-like rows**

Append to `src/lib/legal-corpus.test.ts`:

```ts
test("parses article tags from stored JSON", () => {
  const row = {
    tags: '["denda","klausul_baku"]',
    normalizedText: "denda klausul baku",
  };

  expect(parseStoredTags(row.tags)).toEqual(["denda", "klausul_baku"]);
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `bun test src/lib/legal-corpus.test.ts`

Expected: FAIL because `parseStoredTags` is not exported.

- [x] **Step 3: Implement `parseStoredTags` and `searchLegalCorpus`**

Add to `src/lib/legal-corpus.ts`:

```ts
import { db } from "@/lib/db";

export function parseStoredTags(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export async function searchLegalCorpus(text: string, limit = 6): Promise<LegalCorpusContext | null> {
  const started = Date.now();
  const signals = extractLegalIssueSignals(text);
  if (!signals.tags.length && !signals.keywords.length) return null;

  const tokens = [...new Set([...signals.tags, ...signals.keywords.map(normalizeLegalSearchText)])]
    .filter((token) => token.length >= 3)
    .slice(0, 24);

  const indexRows = await db.legalArticleIndex.findMany({
    where: {
      OR: [
        { token: { in: tokens } },
        { tag: { in: signals.tags } },
      ],
    },
    include: {
      article: {
        include: { document: true },
      },
    },
    take: 80,
  });

  const byArticle = new Map<string, LegalCorpusResult & { tags: string[]; normalizedText: string }>();
  for (const row of indexRows) {
    const article = row.article;
    const tags = parseStoredTags(article.tags);
    const existing = byArticle.get(article.id);
    const baseScore = scoreLegalArticle(
      { tags, normalizedText: article.normalizedText },
      signals,
    ) + row.weight;

    if (!existing || baseScore > existing.score) {
      byArticle.set(article.id, {
        documentTitle: article.document.title,
        articleNumber: article.articleNumber,
        articleText: article.text,
        plainSummary: article.plainSummary,
        sourceUrl: article.sourceUrl || article.document.sourceUrl,
        score: baseScore,
        tags,
        normalizedText: article.normalizedText,
      });
    }
  }

  const results = [...byArticle.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (!results.length) return null;
  const context = buildLegalCorpusContext(results);
  return {
    ...context,
    query: signals.normalizedQuery,
    latencyMs: Date.now() - started,
  };
}
```

- [x] **Step 4: Run tests**

Run: `bun test src/lib/legal-corpus.test.ts`

Expected: PASS.

- [x] **Step 5: Commit search integration**

```bash
git add src/lib/legal-corpus.ts src/lib/legal-corpus.test.ts
git commit -m "feat: search legal corpus index"
```

---

### Task 6: Use Legal Corpus As Primary Source Before You.com

**Files:**
- Modify: `src/lib/research.ts`

- [x] **Step 1: Add legal corpus import**

Add:

```ts
import { searchLegalCorpus } from "@/lib/legal-corpus";
```

- [x] **Step 2: Search corpus before You.com**

Inside `buildLegalResearchContext`, after the research plan is chosen and before `getCachedLegalResearch(researchPlan)`, add:

```ts
    const localCorpus = await searchLegalCorpus(`${researchPlan.query}\n\n${compactContract(contractText)}`);
    if (localCorpus && localCorpus.confidence !== "low") {
      console.log(`[TIMING] legal_corpus HIT: ${localCorpus.latencyMs}ms | confidence=${localCorpus.confidence}`);
      return {
        enabled: true,
        effort: researchPlan.effort,
        query: researchPlan.query,
        content: `Database pasal lokal sebagai sumber utama:\n\n${localCorpus.content}`,
        sources: localCorpus.sources,
        latencyMs: localCorpus.latencyMs,
        warning: "Konteks hukum diambil dari database pasal lokal; You.com tidak dipanggil karena confidence cukup.",
      };
    }
```

- [x] **Step 3: Keep additional research behavior**

Confirm the existing flow still calls `getCachedLegalResearch(researchPlan)` and You.com after a low-confidence corpus miss. You.com should be described as additional/freshness research, not the primary source.

- [x] **Step 4: Run focused tests**

Run:

```bash
bun test src/lib/legal-corpus.test.ts src/lib/research-cache.test.ts
```

Expected: PASS.

- [x] **Step 5: Run app checks**

Run:

```bash
bun run lint
```

Expected: PASS.

- [x] **Step 6: Commit research integration**

```bash
git add src/lib/research.ts
git commit -m "feat: use local legal corpus before web research"
```

---

### Task 7: Optional Google Drive Archive

**Files:**
- Create: `src/lib/google-drive-archive.ts`
- Create: `scripts/google-drive-oauth.mjs`
- Create: `scripts/google-drive-verify.mjs`
- Modify: `.env.example` if it exists in this repo at implementation time.
- Modify: `worklog.md`

- [x] **Step 1: Add env names to deployment notes**

Use these env vars:

```env
GOOGLE_DRIVE_CLIENT_ID=
GOOGLE_DRIVE_CLIENT_SECRET=
GOOGLE_DRIVE_REFRESH_TOKEN=
GOOGLE_DRIVE_ARCHIVE_FOLDER_ID=
```

- [x] **Step 2: Create local OAuth bootstrap script**

Created `scripts/google-drive-oauth.mjs` with two modes:

```bash
node scripts/google-drive-oauth.mjs --auth-url
node scripts/google-drive-oauth.mjs --code "PASTE_CODE_OR_CALLBACK_URL"
```

The script reads Google OAuth settings from `.env`, prints a consent URL, and exchanges the callback `code` for `GOOGLE_DRIVE_REFRESH_TOKEN`.

- [x] **Step 3: Store refresh token locally and verify Drive folder access**

`GOOGLE_DRIVE_REFRESH_TOKEN` was obtained via OAuth consent and stored only in `.env`.

Created `scripts/google-drive-verify.mjs` to refresh an access token and verify the configured archive folder:

```bash
node scripts/google-drive-verify.mjs
```

Expected verified output:

```json
{
  "name": "KontrakPaham Drive Archive",
  "mimeType": "application/vnd.google-apps.folder",
  "canAddChildren": true,
  "canEdit": true
}
```

- [x] **Step 4: Create archive helper**

Create `src/lib/google-drive-archive.ts`:

```ts
export function isGoogleDriveArchiveConfigured() {
  return Boolean(
    process.env.GOOGLE_DRIVE_CLIENT_ID &&
    process.env.GOOGLE_DRIVE_CLIENT_SECRET &&
    process.env.GOOGLE_DRIVE_REFRESH_TOKEN &&
    process.env.GOOGLE_DRIVE_ARCHIVE_FOLDER_ID,
  );
}

export function googleDriveArchiveWarning() {
  if (isGoogleDriveArchiveConfigured()) return null;
  return "Google Drive archive is not configured; legal corpus search still works from Turso.";
}
```

- [x] **Step 5: Defer upload implementation until OAuth is available**

Do not call Drive API from the analyze hot path. Add upload/download only after the OAuth refresh token is available and tested locally.

- [x] **Step 6: Commit archive config helper**

```bash
git add src/lib/google-drive-archive.ts worklog.md
git commit -m "chore: document google drive archive configuration"
```

---

### Task 8: Final Verification And Worklog

**Files:**
- Modify: `worklog.md`

- [x] **Step 1: Run all focused tests**

```bash
bun test src/lib/legal-corpus.test.ts src/lib/research-cache.test.ts src/lib/analysis-cache.test.ts
```

Expected: PASS.

- [x] **Step 2: Run lint**

```bash
bun run lint
```

Expected: PASS.

- [x] **Step 3: Run production build with build placeholders**

PowerShell:

```powershell
$env:DATABASE_URL='file:./build.db'
$env:TURSO_DATABASE_URL=''
$env:TURSO_AUTH_TOKEN=''
$env:JWT_SECRET='build-time-only-placeholder-change-in-runtime'
bun run build
```

Expected: PASS.

- [x] **Step 4: Update `worklog.md`**

Record:

- Legal corpus schema added.
- Search uses Turso index before You.com.
- Google Drive remains archive-only.
- Tests and build commands.
- Any Koyeb env changes needed.

- [x] **Step 5: Commit final docs**

```bash
git add worklog.md
git commit -m "docs: record legal corpus implementation"
git push origin main
```

---

## Execution Notes

- Do not store secrets in git.
- Do not read from Google Drive during request-time search.
- Do not call You.com when local legal corpus confidence is medium or high unless a future task adds an explicit "freshness check required" flag.
- Keep initial corpus small and curated; quality matters more than volume.
- Treat legal corpus citations as context, not legal advice.
- If an implementation worker changes the plan, update this checklist in the same commit.
