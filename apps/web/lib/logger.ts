type Level = 'debug' | 'info' | 'warn' | 'error';
const REDACT = /(password|token|secret|authorization|apikey|api_key|cookie)/i;

function scrub(v: unknown, depth = 0): unknown {
  if (depth > 4 || v === null || typeof v !== 'object') return v;
  return Object.fromEntries(
    Object.entries(v as Record<string, unknown>).map(([k, val]) => [
      k,
      REDACT.test(k) ? '[redacted]' : scrub(val, depth + 1),
    ]),
  );
}

/** Structured JSON logger; never logs credential-like fields. */
export function log(level: Level, msg: string, ctx: Record<string, unknown> = {}): void {
  const line = JSON.stringify({
    t: new Date().toISOString(),
    level,
    msg,
    ...(scrub(ctx) as object),
  });
  (level === 'error' ? console.error : level === 'warn' ? console.warn : console.log)(line);
}
