import { Fragment } from "react";
import { parseFurigana } from "@/lib/furigana";

/**
 * Renders text with `kanji[reading]` markup as <ruby> elements so the
 * reading appears as furigana above the kanji. Text outside brackets
 * (kana, punctuation, romaji, tildes) renders as plain text.
 */
export default function Furigana({ text }: { text: string }) {
  const segments = parseFurigana(text);

  return (
    <>
      {segments.map((segment, i) =>
        segment.type === "text" ? (
          <Fragment key={i}>{segment.value}</Fragment>
        ) : (
          <ruby key={i}>
            {segment.base}
            <rt className="text-[0.6em] font-normal text-neutral-400">{segment.reading}</rt>
          </ruby>
        )
      )}
    </>
  );
}
