/** Only allow same-origin relative paths (blocks open redirects such as //evil.com or /\evil.com). */
export function safeNext(next: unknown, fallback = '/'): string {
  if (typeof next !== 'string') return fallback;
  if (!next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return fallback;
  return next;
}
