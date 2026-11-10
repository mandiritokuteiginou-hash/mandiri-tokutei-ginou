'use client';
import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { loginAction, registerAction, type FormState } from '@/app/actions';
import { Alert, Button, Field } from './ui';

const init: FormState = { status: 'idle' };

function Status({ s }: { s: FormState }) {
  const t = useTranslations('auth');
  if (s.status === 'ok') return <Alert kind="ok">{t(s.code as 'checkEmail')}</Alert>;
  if (s.status === 'error' && s.code && s.code !== 'validation')
    return <Alert>{t(s.code as 'genericError')}</Alert>;
  return null;
}

export function LoginForm({ next }: { next: string }) {
  const t = useTranslations('auth');
  const v = useTranslations('validation');
  const [s, action, pending] = useActionState(loginAction, init);
  const fe = (k: string) =>
    s.fieldErrors?.[k] ? v(s.fieldErrors[k] as 'invalid_email') : undefined;
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <Status s={s} />
      <Field
        name="email"
        type="email"
        autoComplete="email"
        label={t('email')}
        error={fe('email')}
        required
      />
      <Field
        name="password"
        type="password"
        autoComplete="current-password"
        label={t('password')}
        error={fe('password')}
        required
      />
      <Button type="submit" disabled={pending} className="w-full">
        {t('submitLogin')}
      </Button>
    </form>
  );
}

export function RegisterForm() {
  const t = useTranslations('auth');
  const v = useTranslations('validation');
  const [s, action, pending] = useActionState(registerAction, init);
  const fe = (k: string) =>
    s.fieldErrors?.[k] ? v(s.fieldErrors[k] as 'invalid_email') : undefined;
  return (
    <form action={action} className="space-y-4" noValidate>
      <Status s={s} />
      <Field
        name="fullName"
        autoComplete="name"
        label={t('fullName')}
        error={fe('fullName')}
        required
      />
      <Field
        name="email"
        type="email"
        autoComplete="email"
        label={t('email')}
        error={fe('email')}
        required
      />
      <Field
        name="password"
        type="password"
        autoComplete="new-password"
        label={t('password')}
        error={fe('password')}
        required
      />
      <div className="space-y-1">
        <label htmlFor="role" className="text-sm font-medium">
          {t('role')}
        </label>
        <select
          id="role"
          name="role"
          className="min-h-11 w-full rounded-md border border-navy/20 bg-white px-3"
        >
          {(['job_seeker', 'student', 'employer'] as const).map((r) => (
            <option key={r} value={r}>
              {t(`roles.${r}`)}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="acceptTerms" className="mt-1 size-4" />{' '}
        <span>{t('terms')}</span>
      </label>
      {fe('acceptTerms') && (
        <p role="alert" className="text-sm text-danger">
          {fe('acceptTerms')}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {t('submitRegister')}
      </Button>
    </form>
  );
}
