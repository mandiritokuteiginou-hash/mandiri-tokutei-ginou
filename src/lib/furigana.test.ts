import { describe, expect, it } from "vitest";
import { parseFurigana } from "./furigana";

describe("parseFurigana", () => {
  it("returns a single text segment for plain kana with no brackets", () => {
    expect(parseFurigana("おはようございます")).toEqual([
      { type: "text", value: "おはようございます" },
    ]);
  });

  it("parses a single kanji[reading] annotation", () => {
    expect(parseFurigana("大[おお]きい")).toEqual([
      { type: "ruby", base: "大", reading: "おお" },
      { type: "text", value: "きい" },
    ]);
  });

  it("parses multiple annotations interleaved with plain text", () => {
    expect(parseFurigana("私[わたし]は日本語[にほんご]を話[はな]します")).toEqual([
      { type: "ruby", base: "私", reading: "わたし" },
      { type: "text", value: "は" },
      { type: "ruby", base: "日本語", reading: "にほんご" },
      { type: "text", value: "を" },
      { type: "ruby", base: "話", reading: "はな" },
      { type: "text", value: "します" },
    ]);
  });

  it("handles an annotation at the very start and end of the string", () => {
    expect(parseFurigana("今日[きょう]")).toEqual([
      { type: "ruby", base: "今日", reading: "きょう" },
    ]);
  });

  it("passes through text with no annotations unchanged", () => {
    expect(parseFurigana("〜ましょう")).toEqual([{ type: "text", value: "〜ましょう" }]);
  });

  it("handles an empty string", () => {
    expect(parseFurigana("")).toEqual([]);
  });
});
