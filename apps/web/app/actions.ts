'use server';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import * as svc from '@/lib/auth-service';
import type { AuthClient, Deps, FormState } from '@/lib/auth-service';
import { rateLimit } from '@/lib/rate-limit';
import { safeNext } from '@/lib/safe-redirect';
import { createClient } from '@/lib/supabase/server';

export type { FormState };

async function deps(): Promise<Deps> {
  const h = await headers();
  return {
    sb: (await createClient()) as unknown as AuthClient | null,
    ip: h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
    limit: rateLimit,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
  };
}

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const r = await svc.login(await deps(), Object.fromEntries(fd));
  if (r.status === 'ok') redirect(safeNext(fd.get('next'), '/'));
  return r;
}
export async function registerAction(_: FormState, fd: FormData): Promise<FormState> {
  return svc.register(await deps(), {
    ...Object.fromEntries(fd),
    acceptTerms: fd.get('acceptTerms') === 'on',
  });
}
export async function forgotPasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  return svc.requestPasswordReset(await deps(), Object.fromEntries(fd));
}
export async function resetPasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const r = await svc.updatePassword(await deps(), {
    password: fd.get('password'),
    confirm: fd.get('confirm'),
  });
  if (r.status === 'ok') redirect('/login');
  return r;
}
export async function logoutAction(): Promise<void> {
  const sb = await createClient();
  await sb?.auth.signOut();
  redirect('/');
}
export async function setLocaleAction(fd: FormData): Promise<void> {
  const l = fd.get('locale') === 'ja' ? 'ja' : 'id';
  (await cookies()).set('mtg_locale', l, { path: '/', maxAge: 31_536_000, sameSite: 'lax' });
  redirect(safeNext(fd.get('next'), '/'));
}
