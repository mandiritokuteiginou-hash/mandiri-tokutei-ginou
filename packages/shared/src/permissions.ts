export const PUBLIC_ROLES = ['job_seeker', 'student', 'employer'] as const;
export const INTERNAL_ROLES = [
  'super_admin',
  'admin',
  'recruitment_officer',
  'education_admin',
  'content_manager',
  'customer_support',
  'ai_ops_manager',
] as const;
export const ROLES = [...PUBLIC_ROLES, ...INTERNAL_ROLES] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  'profile.read_own',
  'profile.write_own',
  'candidate.read_all',
  'candidate.write_all',
  'candidate.documents_read',
  'job.read_published',
  'job.read_all',
  'job.write',
  'job.qc_review',
  'job.publish',
  'company.read_all',
  'company.write',
  'company.verify',
  'employer.manage_own_company',
  'employer.review_consented_candidates',
  'matching.run',
  'matching.review',
  'application.read_own',
  'application.write_own',
  'recruitment.manage',
  'learning.read',
  'learning.manage',
  'community.post',
  'community.moderate',
  'content.manage',
  'support.manage',
  'ai.view_runs',
  'ai.manage_agents',
  'reports.view',
  'settings.manage',
  'users.manage',
  'roles.manage',
  'audit.read',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const own: Permission[] = ['profile.read_own', 'profile.write_own'];

/**
 * Role → permission matrix. This mirrors the seed in supabase/migrations/0001_foundation.sql;
 * a unit test keeps both in sync. Server code must call can(); the UI may only use it for display.
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  job_seeker: [
    ...own,
    'job.read_published',
    'application.read_own',
    'application.write_own',
    'learning.read',
    'community.post',
  ],
  student: [...own, 'job.read_published', 'learning.read', 'community.post'],
  employer: [
    ...own,
    'job.read_published',
    'employer.manage_own_company',
    'employer.review_consented_candidates',
  ],
  super_admin: [...PERMISSIONS],
  admin: PERMISSIONS.filter((p) => p !== 'roles.manage'),
  recruitment_officer: [
    ...own,
    'candidate.read_all',
    'candidate.write_all',
    'candidate.documents_read',
    'job.read_all',
    'job.write',
    'job.qc_review',
    'company.read_all',
    'matching.run',
    'matching.review',
    'recruitment.manage',
    'reports.view',
  ],
  education_admin: [...own, 'learning.read', 'learning.manage', 'reports.view'],
  content_manager: [
    ...own,
    'content.manage',
    'community.post',
    'community.moderate',
    'learning.read',
  ],
  customer_support: [...own, 'candidate.read_all', 'support.manage', 'community.moderate'],
  ai_ops_manager: [...own, 'ai.view_runs', 'ai.manage_agents', 'reports.view'],
};

/** Job publication and company verification are deliberately limited to admin roles. */
export function can(roles: readonly string[], permission: Permission): boolean {
  return roles.some((r) => {
    const perms = (ROLE_PERMISSIONS as Record<string, readonly Permission[] | undefined>)[r];
    return perms?.includes(permission) ?? false;
  });
}

export function isInternalRole(role: string): boolean {
  return (INTERNAL_ROLES as readonly string[]).includes(role);
}
