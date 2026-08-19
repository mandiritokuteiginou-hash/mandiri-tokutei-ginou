import { describe, expect, it } from "vitest";
import { ARTICLES, getArticleBySlug } from "./articles";

describe("ARTICLES data integrity", () => {
  it("has no duplicate slugs", () => {
    const slugs = ARTICLES.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("gives every article non-empty content", () => {
    for (const article of ARTICLES) {
      expect(article.content.length, article.slug).toBeGreaterThan(0);
      for (const paragraph of article.content) {
        expect(paragraph.trim().length, article.slug).toBeGreaterThan(0);
      }
    }
  });

  it("gives every article a positive read time", () => {
    for (const article of ARTICLES) {
      expect(article.readMinutes, article.slug).toBeGreaterThan(0);
    }
  });
});

describe("getArticleBySlug", () => {
  it("finds an existing article", () => {
    const first = ARTICLES[0];
    expect(getArticleBySlug(first.slug)).toEqual(first);
  });

  it("returns undefined for an unknown slug", () => {
    expect(getArticleBySlug("does-not-exist")).toBeUndefined();
  });
});
