import { describe, expect, it } from "vitest";
import { parseFurigana } from "./furigana";
import { JLPT_LEVELS, MATERIALS } from "./materials";

const KANJI_PATTERN = /[一-龯]/;
const NON_KANJI_PATTERN = /[^一-龯]/;

function hasUnbalancedBrackets(text: string): boolean {
  const opens = (text.match(/\[/g) ?? []).length;
  const closes = (text.match(/\]/g) ?? []).length;
  return opens !== closes;
}

describe("MATERIALS data integrity", () => {
  it("has no duplicate slugs", () => {
    const slugs = MATERIALS.map((m) => m.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("gives every module a jlptLevel from the known set", () => {
    for (const material of MATERIALS) {
      expect(JLPT_LEVELS, material.slug).toContain(material.jlptLevel);
    }
  });

  it("gives every module a non-empty intro", () => {
    for (const material of MATERIALS) {
      expect(material.intro.length, material.slug).toBeGreaterThan(0);
      for (const paragraph of material.intro) {
        expect(paragraph.trim().length, material.slug).toBeGreaterThan(0);
      }
    }
  });

  it("has at least one of vocab, chart, or tips so the page isn't empty", () => {
    for (const material of MATERIALS) {
      const hasContent =
        (material.vocab && material.vocab.length > 0) ||
        (material.chart && material.chart.length > 0) ||
        (material.tips && material.tips.length > 0);
      expect(hasContent, material.slug).toBe(true);
    }
  });

  it("has balanced furigana brackets in every vocab and example jp field", () => {
    for (const material of MATERIALS) {
      for (const entry of material.vocab ?? []) {
        expect(hasUnbalancedBrackets(entry.jp), `${material.slug}: ${entry.jp}`).toBe(false);
      }
      for (const example of material.examples ?? []) {
        expect(hasUnbalancedBrackets(example.jp), `${material.slug}: ${example.jp}`).toBe(false);
      }
    }
  });

  it("annotates every kanji-containing vocab/example jp field with furigana", () => {
    for (const material of MATERIALS) {
      for (const entry of material.vocab ?? []) {
        if (KANJI_PATTERN.test(entry.jp)) {
          expect(entry.jp, `${material.slug}: ${entry.jp}`).toContain("[");
        }
      }
      for (const example of material.examples ?? []) {
        if (KANJI_PATTERN.test(example.jp)) {
          expect(example.jp, `${material.slug}: ${example.jp}`).toContain("[");
        }
      }
    }
  });

  it("never lets a ruby base absorb non-kanji text from before the bracket (regression: an earlier version of the parser let a preceding particle like を get pulled into the next reading's base)", () => {
    for (const material of MATERIALS) {
      for (const entry of material.vocab ?? []) {
        for (const segment of parseFurigana(entry.jp)) {
          if (segment.type === "ruby") {
            expect(NON_KANJI_PATTERN.test(segment.base), `${material.slug}: ${entry.jp}`).toBe(
              false
            );
          }
        }
      }
      for (const example of material.examples ?? []) {
        for (const segment of parseFurigana(example.jp)) {
          if (segment.type === "ruby") {
            expect(NON_KANJI_PATTERN.test(segment.base), `${material.slug}: ${example.jp}`).toBe(
              false
            );
          }
        }
      }
    }
  });

  it("has no duplicate jp values within a single module's vocab (used as React keys)", () => {
    for (const material of MATERIALS) {
      if (!material.vocab) continue;
      const jpValues = material.vocab.map((v) => v.jp);
      expect(new Set(jpValues).size, material.slug).toBe(jpValues.length);
    }
  });
});
