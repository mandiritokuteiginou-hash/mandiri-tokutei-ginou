import type { Job } from './types';

const n = (s: string | null | undefined) =>
  (s ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s　・,，.。\-_()（）]+/g, '');
const urlKey = (u: string | null | undefined) => {
  if (!u) return '';
  try {
    const x = new URL(u);
    return `${x.hostname}${x.pathname}`.replace(/\/+$/, '').toLowerCase();
  } catch {
    return n(u);
  }
};

/** Keys under which two postings are considered the same job. A shared key means "possible duplicate". */
export function duplicateKeys(j: Job): string[] {
  const keys: string[] = [];
  if (j.sourceUrl) keys.push(`url:${urlKey(j.sourceUrl)}`);
  if (j.jobNumber) keys.push(`num:${n(j.jobNumber)}`);
  if (j.employerKey && j.prefecture)
    keys.push(`emp:${n(j.employerKey)}|${n(j.title)}|${n(j.prefecture)}`);
  return keys;
}

export interface DuplicateGroup {
  canonicalId: string;
  duplicateIds: string[];
  keys: string[];
}

/**
 * Groups possible duplicates (union-find over shared keys). The canonical job is the best-verified, then lowest id.
 * Nothing is deleted or merged: the output is advisory and the duplicates keep their own records and audit history.
 */
export function findDuplicateJobs(jobs: Job[]): DuplicateGroup[] {
  const parent = new Map<string, string>(jobs.map((j) => [j.id, j.id]));
  const find = (x: string): string => {
    let r = x;
    while (parent.get(r) !== r) r = parent.get(r)!;
    return r;
  };
  const byKey = new Map<string, string>();
  const keysOf = new Map<string, string[]>();
  for (const j of jobs) {
    const ks = duplicateKeys(j);
    keysOf.set(j.id, ks);
    for (const k of ks) {
      const other = byKey.get(k);
      if (other) parent.set(find(j.id), find(other));
      else byKey.set(k, j.id);
    }
  }
  const groups = new Map<string, Job[]>();
  for (const j of jobs) {
    const r = find(j.id);
    groups.set(r, [...(groups.get(r) ?? []), j]);
  }
  const quality = (j: Job) =>
    (j.verification.qcStatus === 'QC_APPROVED' ? 2 : 0) + (j.verification.jobVerified ? 1 : 0);
  const out: DuplicateGroup[] = [];
  for (const members of groups.values()) {
    if (members.length < 2) continue;
    const sorted = [...members].sort((a, b) => quality(b) - quality(a) || a.id.localeCompare(b.id));
    const [canon, ...rest] = sorted as [Job, ...Job[]];
    out.push({
      canonicalId: canon.id,
      duplicateIds: rest.map((j) => j.id).sort(),
      keys: [...new Set(members.flatMap((m) => keysOf.get(m.id) ?? []))].sort(),
    });
  }
  return out.sort((a, b) => a.canonicalId.localeCompare(b.canonicalId));
}

/** Returns jobs with possible non-canonical duplicates removed (originals untouched). */
export function dropDuplicates(jobs: Job[]): { jobs: Job[]; groups: DuplicateGroup[] } {
  const groups = findDuplicateJobs(jobs);
  const drop = new Set(groups.flatMap((g) => g.duplicateIds));
  return { jobs: jobs.filter((j) => !drop.has(j.id)), groups };
}
