'use server';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { loginSchema, registerSchema } from '@mtg/validation';
import { log } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';
import { safeNext } from '@/lib/safe-redirect';
import { createClient } from '@/lib/supabase/server';

export type FormState = {
  status: 'idle' | 'error' | 'ok';
  code?: string;
  fieldErrors?: Record<string, string>;
};

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}
function fieldErrors(issues: { path: (string | number)[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) out[String(i.path[0])] ??= i.message;
  return out;
}

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success)
    return { status: 'error', code: 'validation', fieldErrors: fieldErrors(parsed.error.issues) };
  const ip = await clientIp();
  if (
    !rateLimit(`login:${ip}`, 20, 15 * 60_000) ||
    !rateLimit(`login:${parsed.data.email}`, 8, 15 * 60_000)
  ) {
    log('warn', 'login rate limited', { ip });
    return { status: 'error', code: 'tooMany' };
  }
  const sb = await createClient();
  if (!sb) return { status: 'error', code: 'notConfigured' };
  const { error } = await sb.auth.signInWithPassword(parsed.data);
  if (error) {
    log('info', 'login failed', { ip });
    return { status: 'error', code: 'invalidCredentials' }; // same message for unknown user / wrong password
  }
  redirect(safeNext(fd.get('next'), '/'));
}

export async function registerAction(_: FormState, fd: FormData): Promise<FormState> {
  const raw = { ...Object.fromEntries(fd), acceptTerms: fd.get('acceptTerms') === 'on' };
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success)
    return { status: 'error', code: 'validation', fieldErrors: fieldErrors(parsed.error.issues) };
  const ip = await clientIp();
  if (!rateLimit(`register:${ip}`, 5, 60 * 60_000)) return { status: 'error', code: 'tooMany' };
  const sb = await createClient();
  if (!sb) return { status: 'error', code: 'notConfigured' };
  const { email, password, fullName, role, locale } = parsed.data;
  const { error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role, locale } },
  });
  if (error && !/already/i.test(error.message)) {
    log('error', 'signup failed', { status: error.status });
    return { status: 'error', code: 'genericError' };
  }
  // Identical response whether or not the email already exists (no account enumeration).
  return { status: 'ok', code: 'checkEmail' };
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
