import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema } from '../../packages/validation/src';

const base = {
  email: ' User@Example.com ',
  password: 'Abcdefghi1',
  fullName: 'Budi Santoso',
  role: 'job_seeker',
  acceptTerms: true,
};

describe('registerSchema', () => {
  it('normalises email and defaults locale', () => {
    const r = registerSchema.parse(base);
    expect(r.email).toBe('user@example.com');
    expect(r.locale).toBe('id');
  });
  it('rejects self-assigned internal roles', () => {
    for (const role of ['super_admin', 'admin', 'recruitment_officer']) {
      expect(registerSchema.safeParse({ ...base, role }).success).toBe(false);
    }
  });
  it('enforces password strength and terms', () => {
    expect(registerSchema.safeParse({ ...base, password: 'short1A' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, password: 'alllowercase1' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, acceptTerms: false }).success).toBe(false);
  });
});
describe('loginSchema', () => {
  it('requires valid email and password', () => {
    expect(loginSchema.safeParse({ email: 'x', password: 'p' }).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'a@b.co', password: '' }).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'p' }).success).toBe(true);
  });
});
