import { loginSchema, passwordResetSchema, passwordSchema, registerSchema } from '@mtg/validation';
import { log } from './logger';

export type FormState = {
  status: 'idle' | 'error' | 'ok';
  code?: string;
  fieldErrors?: Record<string, string>;
};

/** The slice of the Supabase auth client we use; lets tests inject a fake (no real Supabase involved). */
export interface AuthClient {
  signUp(a: {
    email: string;
    password: string;
    options?: { data?: Record<string, unknown>; emailRedirectTo?: string };
  }): Promise<{ error: { message: string; status?: number } | null }>;
  signInWithPassword(a: {
    email: string;
    password: string;
  }): Promise<{ error: { message: string } | null }>;
  resetPasswordForEmail(
    email: string,
    o?: { redirectTo?: string },
  ): Promise<{ error: { message: string; status?: number } | null }>;
  updateUser(a: { password: string }): Promise<{ error: { message: string } | null }>;
  getUser(): Promise<{ data: { user: { id: string } | null } }>;
}
export interface Deps {
  sb: AuthClient | null;
  ip: string;
  limit: (key: string, max: number, windowMs: number) => boolean;
  siteUrl: string | null;
}

const MIN15 = 15 * 60_000;
const fe = (issues: { path: (string | number)[]; message: string }[]) => {
  const o: Record<string, string> = {};
  for (const i of issues) o[String(i.path[0])] ??= i.message;
  return o;
};
const invalid = (issues: { path: (string | number)[]; message: string }[]): FormState => ({
  status: 'error',
  code: 'validation',
  fieldErrors: fe(issues),
});

export async function login(d: Deps, raw: unknown): Promise<FormState> {
  const p = loginSchema.safeParse(raw);
  if (!p.success) return invalid(p.error.issues);
  if (!d.limit(`login:ip:${d.ip}`, 20, MIN15) || !d.limit(`login:email:${p.data.email}`, 8, MIN15))
    return { status: 'error', code: 'tooMany' };
  if (!d.sb) return { status: 'error', code: 'notConfigured' };
  const { error } = await d.sb.signInWithPassword(p.data);
  if (error) {
    log('info', 'login failed', { ip: d.ip });
    return { status: 'error', code: 'invalidCredentials' };
  } // same answer for unknown user / wrong password / unconfirmed
  return { status: 'ok' };
}

export async function register(d: Deps, raw: unknown): Promise<FormState> {
  const p = registerSchema.safeParse(raw);
  if (!p.success) return invalid(p.error.issues);
  if (!d.limit(`register:ip:${d.ip}`, 5, 60 * 60_000)) return { status: 'error', code: 'tooMany' };
  if (!d.sb) return { status: 'error', code: 'notConfigured' };
  const { email, password, fullName, role, locale } = p.data;
  const { error } = await d.sb.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role, locale },
      ...(d.siteUrl ? { emailRedirectTo: `${d.siteUrl}/auth/callback` } : {}),
    },
  });
  if (error && !/already/i.test(error.message)) {
    log('error', 'signup failed', { status: error.status });
    return { status: 'error', code: 'genericError' };
  }
  return { status: 'ok', code: 'checkEmail' }; // identical whether or not the email already exists
}

export async function requestPasswordReset(d: Deps, raw: unknown): Promise<FormState> {
  const p = passwordResetSchema.safeParse(raw);
  if (!p.success) return invalid(p.error.issues);
  if (
    !d.limit(`reset:ip:${d.ip}`, 5, 60 * 60_000) ||
    !d.limit(`reset:email:${p.data.email}`, 3, 60 * 60_000)
  )
    return { status: 'error', code: 'tooMany' };
  if (!d.sb) return { status: 'error', code: 'notConfigured' };
  const { error } = await d.sb.resetPasswordForEmail(
    p.data.email,
    d.siteUrl ? { redirectTo: `${d.siteUrl}/auth/callback?next=/reset-password` } : undefined,
  );
  if (error) log('warn', 'password reset request failed', { status: error.status }); // never reveal to the caller
  return { status: 'ok', code: 'resetSent' }; // always the same answer: no account enumeration
}

export async function updatePassword(
  d: Deps,
  raw: { password?: unknown; confirm?: unknown },
): Promise<FormState> {
  const p = passwordSchema.safeParse(raw.password);
  if (!p.success)
    return {
      status: 'error',
      code: 'validation',
      fieldErrors: { password: p.error.issues[0]?.message ?? 'password_too_short' },
    };
  if (raw.password !== raw.confirm)
    return { status: 'error', code: 'validation', fieldErrors: { confirm: 'password_mismatch' } };
  if (!d.sb) return { status: 'error', code: 'notConfigured' };
  const { data } = await d.sb.getUser();
  if (!data.user) return { status: 'error', code: 'sessionExpired' }; // must arrive via the emailed recovery link
  if (!d.limit(`pwupdate:${data.user.id}`, 5, MIN15)) return { status: 'error', code: 'tooMany' };
  const { error } = await d.sb.updateUser({ password: p.data });
  if (error) {
    log('warn', 'password update failed');
    return { status: 'error', code: 'genericError' };
  }
  return { status: 'ok', code: 'passwordUpdated' };
}
