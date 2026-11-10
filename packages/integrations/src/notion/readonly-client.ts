/**
 * READ-ONLY Notion client prototype.
 *
 * Safety design: the only way to reach the network is `request()`, which refuses anything except an allowlist of
 * read endpoints. There is no code path that can create, update, archive or delete a Notion object, so even a
 * buggy caller cannot write. UNVERIFIED against the live API: it has never been run with a real token.
 */
export type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body?: string },
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

const UUID = '[0-9a-fA-F-]{32,36}';
const ALLOWED: { method: 'GET' | 'POST'; path: RegExp }[] = [
  { method: 'GET', path: new RegExp(`^/v1/databases/${UUID}$`) },
  { method: 'GET', path: new RegExp(`^/v1/data_sources/${UUID}$`) },
  { method: 'GET', path: new RegExp(`^/v1/pages/${UUID}$`) },
  // Query endpoints use POST but are read-only by definition.
  { method: 'POST', path: new RegExp(`^/v1/databases/${UUID}/query$`) },
  { method: 'POST', path: new RegExp(`^/v1/data_sources/${UUID}/query$`) },
];

export class WriteBlockedError extends Error {}

export interface NotionReadonlyOptions {
  token: string;
  fetchImpl?: FetchLike;
  version?: string;
  baseUrl?: string;
  maxRetries?: number;
}

export function createNotionReadonlyClient(opts: NotionReadonlyOptions) {
  const base = opts.baseUrl ?? 'https://api.notion.com';
  const f: FetchLike = opts.fetchImpl ?? ((url, init) => fetch(url, init) as ReturnType<FetchLike>);
  const maxRetries = opts.maxRetries ?? 3;

  async function request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    if (!ALLOWED.some((a) => a.method === method && a.path.test(path)))
      throw new WriteBlockedError(`Blocked: ${method} ${path} is not an allowed read endpoint`);
    for (let attempt = 0; ; attempt++) {
      const res = await f(base + path, {
        method,
        headers: {
          Authorization: `Bearer ${opts.token}`,
          'Notion-Version': opts.version ?? '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (res.ok) return (await res.json()) as T;
      if ((res.status === 429 || res.status >= 500) && attempt < maxRetries) continue; // bounded retry; real backoff added with the live adapter
      throw new Error(`Notion read failed with HTTP ${res.status}`); // never echo headers/token
    }
  }

  return {
    getDatabase: (id: string) => request<unknown>('GET', `/v1/databases/${id}`),
    getPage: (id: string) => request<unknown>('GET', `/v1/pages/${id}`),
    /** Async generator over all pages of a database; read-only, cursor-paginated. */
    async *queryAll(databaseId: string, pageSize = 100): AsyncGenerator<NotionPage> {
      let cursor: string | undefined;
      do {
        const r = await request<{
          results: NotionPage[];
          has_more: boolean;
          next_cursor: string | null;
        }>('POST', `/v1/databases/${databaseId}/query`, {
          page_size: pageSize,
          ...(cursor ? { start_cursor: cursor } : {}),
        });
        for (const p of r.results) yield p;
        cursor = r.has_more && r.next_cursor ? r.next_cursor : undefined;
      } while (cursor);
    },
  };
}

export interface NotionPage {
  id: string;
  url?: string;
  last_edited_time?: string;
  created_time?: string;
  archived?: boolean;
  properties: Record<string, NotionProp>;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type NotionProp = { type: string; [k: string]: any };
