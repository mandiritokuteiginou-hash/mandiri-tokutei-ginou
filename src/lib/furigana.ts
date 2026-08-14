export type FuriganaSegment =
  | { type: "text"; value: string }
  | { type: "ruby"; base: string; reading: string };

// The base group is restricted to CJK ideographs (kanji) so that plain text
// immediately preceding a bracket (e.g. the "を" in "を止[と]める") is never
// swallowed into the next ruby annotation's base — only the kanji run
// directly touching "[" is.
const FURIGANA_PATTERN = /([一-龯]+)\[([^[\]]+)\]/g;

/**
 * Parses text with `kanji[reading]` markup into plain-text and ruby
 * segments. Text outside brackets (kana, punctuation, romaji, tildes)
 * passes through as plain-text segments unchanged.
 */
export function parseFurigana(text: string): FuriganaSegment[] {
  const segments: FuriganaSegment[] = [];
  const regex = new RegExp(FURIGANA_PATTERN);
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: "ruby", base: match[1], reading: match[2] });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  return segments;
}
