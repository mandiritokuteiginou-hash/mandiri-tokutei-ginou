import { describe, expect, it } from 'vitest';
import { dropDuplicates, findDuplicateJobs } from '../../../packages/shared/src';
import { job } from './fixtures';

describe('duplicate jobs', () => {
  it('groups postings sharing a source URL (case/trailing slash insensitive) and keeps the better-verified one canonical', () => {
    const a = job({ id: 'J-2', jobNumber: 'X1', sourceUrl: 'https://Example.test/job/9/' });
    const b = job({
      id: 'J-1',
      jobNumber: 'X2',
      sourceUrl: 'https://example.test/job/9',
      verification: {
        qcStatus: 'QC_REVIEW',
        jobVerified: false,
        sourceVerified: false,
        employerVerified: false,
      },
    });
    const g = findDuplicateJobs([b, a]);
    expect(g).toHaveLength(1);
    expect(g[0]?.canonicalId).toBe('J-2'); // verified wins over lower id
    expect(g[0]?.duplicateIds).toEqual(['J-1']);
  });
  it('groups by job number and by employer+title+prefecture', () => {
    const x = job({ id: 'A', jobNumber: '13010-1', sourceUrl: null, employerKey: null });
    const y = job({ id: 'B', jobNumber: '13010-1', sourceUrl: null, employerKey: null });
    expect(findDuplicateJobs([x, y])[0]?.duplicateIds).toEqual(['B']);
    const p = job({
      id: 'P',
      jobNumber: null,
      sourceUrl: null,
      employerKey: 'Acme Co.',
      title: 'Care Worker',
      prefecture: 'Test-ken',
    });
    const q = job({
      id: 'Q',
      jobNumber: null,
      sourceUrl: null,
      employerKey: 'acme co',
      title: 'care  worker',
      prefecture: 'Test-ken',
    });
    expect(findDuplicateJobs([p, q])).toHaveLength(1);
  });
  it('is transitive (A~B, B~C => one group)', () => {
    const a = job({ id: 'A', jobNumber: 'N1', sourceUrl: 'https://e.test/a', employerKey: null });
    const b = job({ id: 'B', jobNumber: 'N1', sourceUrl: 'https://e.test/b', employerKey: null });
    const c = job({ id: 'C', jobNumber: 'N3', sourceUrl: 'https://e.test/b', employerKey: null });
    const g = findDuplicateJobs([a, b, c]);
    expect(g).toHaveLength(1);
    expect(g[0]?.duplicateIds.length).toBe(2);
  });
  it('different jobs are not grouped; dropDuplicates never mutates or deletes originals', () => {
    const a = job({
      id: 'A',
      jobNumber: 'N1',
      sourceUrl: 'https://e.test/a',
      employerKey: 'x',
      prefecture: 'P1',
    });
    const b = job({
      id: 'B',
      jobNumber: 'N2',
      sourceUrl: 'https://e.test/b',
      employerKey: 'y',
      prefecture: 'P2',
    });
    expect(findDuplicateJobs([a, b])).toEqual([]);
    const input = [a, { ...b, jobNumber: 'N1' }];
    const before = JSON.stringify(input);
    const out = dropDuplicates(input);
    expect(out.jobs).toHaveLength(1);
    expect(JSON.stringify(input)).toBe(before);
  });
});
