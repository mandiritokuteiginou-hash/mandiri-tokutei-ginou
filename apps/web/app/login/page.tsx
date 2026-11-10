import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { LoginForm } from '@/components/AuthForms';
import { Card } from '@/components/ui';
import { safeNext } from '@/lib/safe-redirect';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const t = await getTranslations('auth');
  const { next } = await searchParams;
  return (
    <Card className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-bold">{t('loginTitle')}</h1>
      <LoginForm next={safeNext(next)} />
      <Link href="/forgot-password" className="text-sm text-navy-500 underline">
        {t('forgot')}
      </Link>
    </Card>
  );
}
