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
