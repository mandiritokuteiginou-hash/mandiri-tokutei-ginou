import { Fragment } from "react";

/**
 * Parses text with `kanji[reading]` markup and renders each annotated run as
 * a <ruby> element so the reading appears as furigana above the kanji.
 * Text outside brackets (kana, punctuation, romaji, tildes) passes through as-is.
 */
export default function Furigana({ text }: { text: string }) {
  const regex = /([^[\]]+)\[([^[\]]+)\]/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <Fragment key={key++}>{text.slice(lastIndex, match.index)}</Fragment>
      );
    }
    nodes.push(
      <ruby key={key++}>
        {match[1]}
        <rt className="text-[0.6em] font-normal text-neutral-400">{match[2]}</rt>
      </ruby>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    nodes.push(<Fragment key={key++}>{text.slice(lastIndex)}</Fragment>);
  }

  return <>{nodes}</>;
}
