import { can, isInternalRole, type Permission } from '@mtg/shared';
import { createClient } from './supabase/server';

export type Session = { id: string; email: string; roles: string[] } | null;

/** Authoritative server-side session: verifies the JWT with Supabase (getUser) and loads roles under RLS. */
export async function getSession(): Promise<Session> {
  const sb = await createClient();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  if (!data.user) return null;
  const { data: rows } = await sb
    .from('user_roles')
    .select('roles(key)')
    .eq('user_id', data.user.id);
  const roles = (rows ?? []).flatMap((r: { roles: { key: string } | { key: string }[] | null }) =>
    Array.isArray(r.roles) ? r.roles.map((x) => x.key) : r.roles ? [r.roles.key] : [],
  );
  return { id: data.user.id, email: data.user.email ?? '', roles };
}

export const hasInternalAccess = (s: Session) => !!s && s.roles.some(isInternalRole);
export const sessionCan = (s: Session, p: Permission) => !!s && can(s.roles, p);

export class ForbiddenError extends Error {}

/** Call at the top of EVERY admin page / server action / route handler that touches data.
 *  Layout checks alone are not sufficient in Next.js (pages render independently of layouts). */
export async function requirePermission(p: Permission): Promise<NonNullable<Session>> {
  const s = await getSession();
  if (!s) throw new ForbiddenError('unauthenticated');
  if (!can(s.roles, p)) throw new ForbiddenError(`missing ${p}`);
  return s;
}
