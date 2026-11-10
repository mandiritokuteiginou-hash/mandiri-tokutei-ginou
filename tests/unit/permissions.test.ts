import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  can,
  INTERNAL_ROLES,
  PERMISSIONS,
  ROLES,
  ROLE_PERMISSIONS,
} from '../../packages/shared/src';

describe('RBAC matrix', () => {
  it('grants nothing to unknown roles', () => {
    expect(can(['hacker'], 'job.publish')).toBe(false);
    expect(can([], 'profile.read_own')).toBe(false);
  });
  it('public roles never receive internal/admin permissions', () => {
    for (const r of ['job_seeker', 'student', 'employer'] as const) {
      for (const p of [
        'candidate.read_all',
        'job.publish',
        'users.manage',
        'settings.manage',
        'audit.read',
      ] as const) {
        expect(can([r], p), `${r} must not have ${p}`).toBe(false);
      }
    }
  });
  it('employers can only review consented candidates, not read all', () => {
    expect(can(['employer'], 'employer.review_consented_candidates')).toBe(true);
    expect(can(['employer'], 'candidate.read_all')).toBe(false);
  });
  it('only admin roles can publish jobs and verify companies', () => {
    const holders = ROLES.filter((r) => can([r], 'job.publish'));
    expect(holders.sort()).toEqual(['admin', 'super_admin']);
    expect(ROLES.filter((r) => can([r], 'company.verify')).sort()).toEqual([
      'admin',
      'super_admin',
    ]);
  });
  it('only super_admin manages roles', () => {
    expect(ROLES.filter((r) => can([r], 'roles.manage'))).toEqual(['super_admin']);
  });
  it('multiple roles union their permissions', () => {
    expect(can(['student', 'content_manager'], 'community.moderate')).toBe(true);
  });
  it('every role has profile access and every permission is defined', () => {
    for (const r of ROLES) {
      expect(can([r], 'profile.read_own')).toBe(true);
      for (const p of ROLE_PERMISSIONS[r]) expect(PERMISSIONS).toContain(p);
    }
    expect(INTERNAL_ROLES.length).toBe(7);
  });
  it('SQL migration seed stays in sync with the TS matrix', () => {
    const sql = readFileSync('supabase/migrations/20261110000001_foundation.sql', 'utf8');
    for (const r of ROLES) expect(sql).toContain(`('${r}',`);
    for (const p of PERMISSIONS) expect(sql).toContain(`('${p}')`);
    const pairs = [...sql.matchAll(/^\s+\('([a-z_]+)', '([a-z_.]+)'\)(?:,|$)/gm)].map(
      (m) => `${m[1]}:${m[2]}`,
    );
    const expected = ROLES.flatMap((r) => ROLE_PERMISSIONS[r].map((p) => `${r}:${p}`));
    for (const e of expected) expect(pairs).toContain(e);
  });
});
