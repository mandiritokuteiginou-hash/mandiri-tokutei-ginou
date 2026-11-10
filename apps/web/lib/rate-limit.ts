/** Fixed-window in-memory limiter. Per-instance only: replace with a shared store (Redis/KV) in production. */
const hits = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const e = hits.get(key);
  if (!e || e.reset <= now) {
    hits.set(key, { count: 1, reset: now + windowMs });
    if (hits.size > 10_000) for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
    return true;
  }
  e.count += 1;
  return e.count <= limit;
}
export function _resetRateLimit(): void {
  hits.clear();
}
