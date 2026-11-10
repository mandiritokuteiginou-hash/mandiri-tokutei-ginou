import { z } from 'zod';

const PUBLIC_SIGNUP_ROLES = ['job_seeker', 'student', 'employer'] as const;

export const passwordSchema = z
  .string()
  .min(10, 'password_too_short')
  .max(128)
  .regex(/[a-z]/, 'password_needs_lowercase')
  .regex(/[A-Z]/, 'password_needs_uppercase')
  .regex(/[0-9]/, 'password_needs_digit');

/** Internal roles can never be self-assigned at signup. */
export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('invalid_email').max(254),
  password: passwordSchema,
  fullName: z.string().trim().min(2, 'name_too_short').max(120),
  role: z.enum(PUBLIC_SIGNUP_ROLES),
  locale: z.enum(['id', 'ja']).default('id'),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'terms_required' }) }),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('invalid_email'),
  password: z.string().min(1, 'password_required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const passwordResetSchema = z.object({
  email: z.string().trim().toLowerCase().email('invalid_email'),
});
