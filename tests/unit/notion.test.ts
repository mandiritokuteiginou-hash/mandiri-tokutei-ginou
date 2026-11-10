// All fixtures are FICTIONAL, shaped like Notion API page JSON. No live Notion data is used.
import { describe, expect, it } from 'vitest';
import { evaluateMatch, normalizeSector } from '../../packages/shared/src';
import {
  createNotionReadonlyClient,
  mapNotionJob,
  WriteBlockedError,
  type FetchLike,
  type NotionPage,
} from '../../packages/integrations/src';
import { candidate } from './matching/fixtures';

const T = (s: string) => ({ type: 'title', title: [{ plain_text: s }] });
const R = (s: string) => ({ type: 'rich_text', rich_text: [{ plain_text: s }] });
const S = (s: string | null) => ({ type: 'select', select: s ? { name: s } : null });
const C = (b: boolean) => ({ type: 'checkbox', checkbox: b });
const N = (n: number | null) => ({ type: 'number', number: n });
const D = (s: string) => ({ type: 'date', date: { start: s } });
const NOW = new Date('2026-11-10T00:00:00Z');

const page = (props: Record<string, unknown>): NotionPage => ({
  id: 'aaaaaaaa-0000-0000-0000-000000000001',
  url: 'https://notion.invalid/p',
  last_edited_time: '2026-11-01T00:00:00Z',
  properties: props as NotionPage['properties'],
});
const v1 = (o: Record<string, unknown> = {}) =>
  page({
    'Job Title': T('介護スタッフ'),
    'Job Number': R('MTG--1'),
    'Job ID': { type: 'unique_id', unique_id: { number: 282 } },
    Status: S('PUBLISHED'),
    'MTG QC Status': S('QC Approved'),
    'Job Verified': C(true),
    'Source Verified': C(true),
    'Employer Verified': C(true),
    Field: S('介護'),
    'Visa Track': S('TG'),
    'Pool Type': S('Jepang+Indonesia'),
    'CoE Support': S('Confirmed'),
    Prefecture: R('Test-ken'),
    'Source URL': { type: 'url', url: 'https://example.invalid/j/1' },
    'JLPT Required': S('N4'),
    'Experience Required': S('No'),
    'License Required': S('No'),
    'Monthly Salary Min': N(210000),
    'Dormitory Available': S('Yes'),
    ...o,
  });

describe('read-only Notion client', () => {
  const calls: { method: string; url: string }[] = [];
  const fakeFetch: FetchLike = async (url, init) => {
    calls.push({ method: init.method, url });
    return {
      ok: true,
      status: 200,
      json: async () => ({ results: [], has_more: false, next_cursor: null }),
    };
  };
  const client = () => createNotionReadonlyClient({ token: 'test-token', fetchImpl: fakeFetch });
  const id = 'a454e35c352641e9aacf18a4b41e4edd';

  it('allows reads: get database/page and paginated query', async () => {
    const c = client();
    await c.getDatabase(id);
    await c.getPage(id);
    for await (const _ of c.queryAll(id)) void _;
    expect(calls.map((x) => x.method + ' ' + x.url.replace('https://api.notion.com', ''))).toEqual([
      `GET /v1/databases/${id}`,
      `GET /v1/pages/${id}`,
      `POST /v1/databases/${id}/query`,
    ]);
  });
  it('exposes no write methods at all', () => {
    expect(Object.keys(client()).sort()).toEqual(['getDatabase', 'getPage', 'queryAll']);
  });
  it('the request guard blocks writes even if someone tries to reach them (PATCH/POST pages/DELETE/blocks/comments)', async () => {
    // Re-create the allowlist behaviour through a hostile fetch: any non-allowed path never reaches the network.
    const before = calls.length;
    const c = createNotionReadonlyClient({
      token: 't',
      fetchImpl: fakeFetch,
      baseUrl: 'https://api.notion.com',
    });
    const anyClient = c as unknown as Record<string, (...a: unknown[]) => Promise<unknown>>;
    await expect(anyClient.getPage('../../v1/blocks/x')).rejects.toBeInstanceOf(WriteBlockedError);
    await expect(anyClient.getPage(`${id}/../../comments`)).rejects.toBeInstanceOf(
      WriteBlockedError,
    );
    expect(calls.length).toBe(before);
  });
  it('errors never echo the token', async () => {
    const bad: FetchLike = async () => ({ ok: false, status: 401, json: async () => ({}) });
    const e = await createNotionReadonlyClient({ token: 'SECRET-123', fetchImpl: bad })
      .getPage(id)
      .catch((x: Error) => x);
    expect(String((e as Error).message)).not.toContain('SECRET-123');
  });
  it('retries 429/5xx a bounded number of times then fails', async () => {
    let n = 0;
    const flaky: FetchLike = async () => {
      n++;
      return { ok: false, status: 503, json: async () => ({}) };
    };
    await expect(
      createNotionReadonlyClient({ token: 't', fetchImpl: flaky, maxRetries: 2 }).getPage(id),
    ).rejects.toThrow('HTTP 503');
    expect(n).toBe(3);
  });
});

describe('sector normalisation across sources', () => {
  it('maps Japanese and Indonesian labels to the same key', () => {
    expect(normalizeSector('介護')).toBe('kaigo');
    expect(normalizeSector('Kaigo')).toBe('kaigo');
    expect(normalizeSector('外食')).toBe(normalizeSector('Restoran'));
    expect(normalizeSector('Manufaktur Makanan & Minuman')).toBe(normalizeSector('食品製造'));
  });
  it('unknown labels are null (UNKNOWN downstream), never guessed', () => {
    expect(normalizeSector('Teknik & IT')).toBeNull();
    expect(normalizeSector('その他')).toBeNull();
    expect(normalizeSector(null)).toBeNull();
  });
});

describe('Notion -> Job mapping (proposed, owner confirmation pending)', () => {
  it('maps a fully verified published v1 job and keeps source identifiers', () => {
    const m = mapNotionJob(v1(), 'master_v1', NOW);
    expect(m.job.lifecycle).toBe('PUBLISHED');
    expect(m.job.sector).toBe('kaigo');
    expect(m.job.acceptsPool).toBe('BOTH');
    expect(m.job.coeSupport).toBe('CONFIRMED');
    expect(m.meta.legacyJobId).toBe(282);
    expect(m.job.jobNumber).toBe('MTG--1');
    expect(m.meta.sourceRef).toBe('aaaaaaaa-0000-0000-0000-000000000001');
    expect(m.meta.originalStatus).toBe('PUBLISHED');
  });
  it('does not trust a Notion PUBLISHED status without QC approval', () => {
    const m = mapNotionJob(v1({ 'MTG QC Status': S('QC Review') }), 'master_v1', NOW);
    expect(m.job.lifecycle).toBe('QC_REVIEW');
    expect(m.warnings).toContain('source_status_published_without_qc_approval');
  });
  it('expired and closed jobs', () => {
    expect(
      mapNotionJob(v1({ 'Expiry Date': D('2026-10-01') }), 'master_v1', NOW).job.lifecycle,
    ).toBe('EXPIRED');
    expect(mapNotionJob(v1({ Status: S('CLOSED') }), 'master_v1', NOW).job.lifecycle).toBe(
      'ARCHIVED',
    );
  });
  it('requirements are tri-state: Unknown/missing are not invented', () => {
    const m = mapNotionJob(
      v1({
        'JLPT Required': S('Unknown'),
        'Experience Required': S('Yes'),
        'License Required': S('Yes'),
      }),
      'master_v1',
      NOW,
    );
    expect(m.job.requirements.jlpt.kind).toBe('unknown');
    expect(m.job.requirements.experience.kind).toBe('unknown'); // "Yes" but no years -> not invented
    expect(m.job.requirements.certificates.kind).toBe('unknown'); // "Yes" but no type -> not invented
    expect(m.warnings).toEqual(
      expect.arrayContaining([
        'experience_required_but_years_missing',
        'license_required_but_type_missing',
      ]),
    );
  });
  it('license and experience when stated', () => {
    const m = mapNotionJob(
      v1({
        'License Required': S('Preferred'),
        'License Type': R('普通自動車免許, 介護福祉士'),
        'Experience Required': S('Yes'),
        'Experience Years Min': N(2),
      }),
      'master_v1',
      NOW,
    );
    expect(m.job.requirements.certificates).toEqual({
      kind: 'required',
      mandatory: false,
      names: ['普通自動車免許', '介護福祉士'],
    });
    expect(m.job.requirements.experience).toEqual({
      kind: 'required',
      mandatory: true,
      minYears: 2,
      sector: 'kaigo',
    });
  });
  it('v2 uses Muse verification and Indonesian pool/visa labels', () => {
    const m = mapNotionJob(
      page({
        'Job Title': T('Kaigo'),
        Status: S('APPROVED'),
        'QC Decision': S('APPROVED'),
        'Verifikasi Muse': S('Terverifikasi Muse'),
        'Source Verified': C(true),
        Field: S('Kaigo'),
        'Kategori Visa': S('Tokutei Ginou 1'),
        'Bisa Dilamar Dari': S('Indonesia'),
      }),
      'master_v2',
      NOW,
    );
    expect(m.job.verification).toMatchObject({ qcStatus: 'QC_APPROVED', jobVerified: true });
    expect(m.job.acceptsPool).toBe('KOKUGAI');
    expect(m.job.visaTrack).toBe('TG');
    expect(m.job.lifecycle).toBe('APPROVED');
  });
  it('support/union/HR roles are excluded from candidate matching', () => {
    const m = mapNotionJob(
      v1({ 'Role Type': S('Support / Kumiai / HR / Interpreter') }),
      'master_v1',
      NOW,
    );
    expect(m.meta.excludeFromMatching).toBe(true);
  });
  it('same input gives the same source hash; a changed property changes it', () => {
    const a = mapNotionJob(v1(), 'master_v1', NOW).meta.sourceHash;
    expect(mapNotionJob(v1(), 'master_v1', NOW).meta.sourceHash).toBe(a);
    expect(
      mapNotionJob(v1({ Prefecture: R('Other-ken') }), 'master_v1', NOW).meta.sourceHash,
    ).not.toBe(a);
  });
  it('end to end: imported jobs cannot reach ACCEPTABLE salary because the source has no base pay', () => {
    const m = mapNotionJob(v1(), 'master_v1', NOW);
    const r = evaluateMatch(candidate({ pool: 'KOKUNAI' }), m.job);
    expect(m.warnings).toContain('base_pay_not_available_in_source');
    expect(r.salary.verdict).toBe('REVIEW');
    expect(r.salary.notes).toContain('gross_only_composition_unknown');
  });
});
