import { describe, expect, test } from "bun:test";
import { parseArticles, isTitle, tagArticle } from "../../scripts/legal-scrape/extract-articles.mjs";

describe("Legal Scraper - Parser & Heuristics", () => {
  test("isTitle correctly classifies titles and normal text", () => {
    // Valid titles
    expect(isTitle("Klausul Baku")).toBe(true);
    expect(isTitle("Ganti Rugi")).toBe(true);
    expect(isTitle("Hak Cipta")).toBe(true);

    // Invalid titles (contain punctuation or common verbs/sentence structures)
    expect(isTitle("Pelaku usaha periklanan dilarang memproduksi iklan yang:")).toBe(false);
    expect(isTitle("Dalam Undang-Undang ini yang dimaksud dengan:")).toBe(false);
    expect(isTitle("a. mengelabui konsumen mengenai kualitas;")).toBe(false);
    expect(isTitle("Syarat sah perjanjian.")).toBe(false); // ends with dot
  });

  test("parseArticles extracts articles and handles titles appropriately", () => {
    const text = `
Pasal 1
Ketentuan Umum
Dalam Undang-Undang ini yang dimaksud dengan:
1. Konsumen adalah...

Pasal 18
Klausul Baku
(1) Pelaku usaha dilarang membuat klausula baku.

Pasal 19
Pelaku usaha bertanggung jawab memberikan ganti rugi.
    `;
    const articles = parseArticles(text);
    
    expect(articles).toHaveLength(3);
    
    expect(articles[0].articleNumber).toBe("Pasal 1");
    expect(articles[0].title).toBe("Ketentuan Umum");
    expect(articles[0].text).toContain("Dalam Undang-Undang ini");

    expect(articles[1].articleNumber).toBe("Pasal 18");
    expect(articles[1].title).toBe("Klausul Baku");
    expect(articles[1].text).toBe("(1) Pelaku usaha dilarang membuat klausula baku.");

    expect(articles[2].articleNumber).toBe("Pasal 19");
    expect(articles[2].title).toBeNull();
    expect(articles[2].text).toBe("Pelaku usaha bertanggung jawab memberikan ganti rugi.");
  });

  test("tagArticle assigns correct tags based on aliases and document families", () => {
    const docFamilies = ["consumer_protection"];
    
    // Exact match in document family
    const tags1 = tagArticle("klausul baku yang merugikan pelanggan", docFamilies);
    expect(tags1).toContain("klausul_baku");
    
    // Check fallback to first document family when no keywords match
    const tags2 = tagArticle("ketentuan umum yang tidak mengandung kata kunci apapun", docFamilies);
    expect(tags2).toEqual(["consumer_protection"]);

    // Checks matching tags from other families if no document-specific tags match
    const tags3 = tagArticle("pelaku usaha membayar denda dan bunga keterlambatan", docFamilies);
    expect(tags3).toContain("denda");
    expect(tags3).toContain("bunga");
  });
});
