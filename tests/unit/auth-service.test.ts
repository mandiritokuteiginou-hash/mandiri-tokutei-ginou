// Tests the app's auth LOGIC against a fake auth client. They do NOT prove that real Supabase authentication works.
import { describe, expect, it } from 'vitest';
import {
  login,
  register,
  requestPasswordReset,
  updatePassword,
  type AuthClient,
  type Deps,
} from '../../apps/web/lib/auth-service';
import { _resetRateLimit, rateLimit } from '../../apps/web/lib/rate-limit';

type Call = { fn: string; args: unknown[] };
function fake(over: Partial<Record<keyof AuthClient, unknown>> = {}) {
  const calls: Call[] = [];
  const rec =
    (fn: string, ret: unknown) =>
    async (...args: unknown[]) => {
      calls.push({ fn, args });
      return ret;
    };
  const sb = {
    signUp: rec('signUp', { error: null }),
    signInWithPassword: rec('signIn', { error: null }),
    resetPasswordForEmail: rec('reset', { error: null }),
    updateUser: rec('update', { error: null }),
    getUser: rec('getUser', { data: { user: { id: 'u1' } } }),
    ...over,
  } as unknown as AuthClient;
  return { sb, calls };
}
const deps = (sb: AuthClient | null, ip = '1.1.1.1'): Deps => ({
  sb,
  ip,
  limit: rateLimit,
  siteUrl: 'https://dev.example.invalid',
});
const reg = {
  email: 'A@B.co',
  password: 'Abcdefghi1',
  fullName: 'Budi Santoso',
  role: 'job_seeker',
  acceptTerms: true,
};

describe('register', () => {
  it('passes only validated, normalised data and the chosen public role as metadata', async () => {
    _resetRateLimit();
    const { sb, calls } = fake();
    expect(await register(deps(sb), reg)).toEqual({ status: 'ok', code: 'checkEmail' });
    const a = calls[0]?.args[0] as {
      email: string;
      options: { data: Record<string, unknown>; emailRedirectTo: string };
    };
    expect(a.email).toBe('a@b.co');
    expect(a.options.data).toMatchObject({ role: 'job_seeker', full_name: 'Budi Santoso' });
    expect(a.options.emailRedirectTo).toBe('https://dev.example.invalid/auth/callback');
  });
  it('rejects internal roles before reaching the auth client', async () => {
    _resetRateLimit();
    const { sb, calls } = fake();
    const r = await register(deps(sb), { ...reg, role: 'super_admin' });
    expect(r.status).toBe('error');
    expect(calls).toHaveLength(0);
  });
  it('gives the SAME answer for an already-registered email (no enumeration)', async () => {
    _resetRateLimit();
    const { sb } = fake({
      signUp: async () => ({ error: { message: 'User already registered' } }),
    });
    expect(await register(deps(sb), reg)).toEqual({ status: 'ok', code: 'checkEmail' });
  });
  it('real failures are generic and rate limiting applies per IP', async () => {
    _resetRateLimit();
    const { sb } = fake({
      signUp: async () => ({ error: { message: 'smtp exploded', status: 500 } }),
    });
    expect((await register(deps(sb), reg)).code).toBe('genericError');
    for (let i = 0; i < 6; i++) await register(deps(sb), reg);
    expect((await register(deps(sb), reg)).code).toBe('tooMany');
  });
  it('reports not-configured instead of pretending', async () => {
    _resetRateLimit();
    expect((await register(deps(null), reg)).code).toBe('notConfigured');
  });
});

describe('login', () => {
  it('returns one generic error for any auth failure and never leaks the provider message', async () => {
    _resetRateLimit();
    const { sb } = fake({
      signInWithPassword: async () => ({ error: { message: 'Email not confirmed' } }),
    });
    const r = await login(deps(sb), { email: 'a@b.co', password: 'x' });
    expect(r).toEqual({ status: 'error', code: 'invalidCredentials' });
  });
  it('locks out after repeated attempts for one email even from different IPs', async () => {
    _resetRateLimit();
    const { sb } = fake({ signInWithPassword: async () => ({ error: { message: 'bad' } }) });
    let last = '';
    for (let i = 0; i < 10; i++)
      last =
        (await login(deps(sb, `9.9.9.${i}`), { email: 'victim@b.co', password: 'x' })).code ?? '';
    expect(last).toBe('tooMany');
  });
  it('validates input first', async () => {
    _resetRateLimit();
    const { sb, calls } = fake();
    expect((await login(deps(sb), { email: 'nope', password: '' })).code).toBe('validation');
    expect(calls).toHaveLength(0);
  });
});

describe('password reset', () => {
  it('always answers the same, whether or not the email exists or the provider errors', async () => {
    _resetRateLimit();
    const ok = await requestPasswordReset(deps(fake().sb), { email: 'a@b.co' });
    const failing = await requestPasswordReset(
      deps(
        fake({ resetPasswordForEmail: async () => ({ error: { message: 'User not found' } }) }).sb,
        '2.2.2.2',
      ),
      { email: 'ghost@b.co' },
    );
    expect(ok).toEqual({ status: 'ok', code: 'resetSent' });
    expect(failing).toEqual(ok);
  });
  it('sends the recovery link back through the callback route', async () => {
    _resetRateLimit();
    const { sb, calls } = fake();
    await requestPasswordReset(deps(sb), { email: 'a@b.co' });
    expect(calls[0]?.args[1]).toEqual({
      redirectTo: 'https://dev.example.invalid/auth/callback?next=/reset-password',
    });
  });
  it('is rate limited per email', async () => {
    _resetRateLimit();
    const { sb } = fake();
    let last = '';
    for (let i = 0; i < 5; i++)
      last = (await requestPasswordReset(deps(sb, `3.3.3.${i}`), { email: 'a@b.co' })).code ?? '';
    expect(last).toBe('tooMany');
  });
});

describe('update password (after recovery link)', () => {
  it('requires a session, a strong password and a matching confirmation', async () => {
    _resetRateLimit();
    expect(
      (
        await updatePassword(deps(fake({ getUser: async () => ({ data: { user: null } }) }).sb), {
          password: 'Abcdefghi1',
          confirm: 'Abcdefghi1',
        })
      ).code,
    ).toBe('sessionExpired');
    const { sb, calls } = fake();
    expect((await updatePassword(deps(sb), { password: 'weak', confirm: 'weak' })).code).toBe(
      'validation',
    );
    expect(
      (await updatePassword(deps(sb), { password: 'Abcdefghi1', confirm: 'Different1A' }))
        .fieldErrors,
    ).toEqual({ confirm: 'password_mismatch' });
    expect(calls.filter((c) => c.fn === 'update')).toHaveLength(0);
    expect(
      await updatePassword(deps(sb), { password: 'Abcdefghi1', confirm: 'Abcdefghi1' }),
    ).toEqual({ status: 'ok', code: 'passwordUpdated' });
  });
});
