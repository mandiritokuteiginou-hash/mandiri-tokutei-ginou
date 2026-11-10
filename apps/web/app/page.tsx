import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Alert } from '@/components/ui';

export default async function Home() {
  const t = await getTranslations('home');
  return (
    <section className="space-y-6 py-8">
      <h1 className="max-w-3xl text-3xl font-bold leading-tight md:text-5xl">{t('title')}</h1>
      <p className="max-w-2xl text-lg text-navy/80">{t('subtitle')}</p>
      <Link
        href="/register"
        className="inline-flex min-h-11 items-center rounded-md bg-sakura px-6 font-semibold text-white hover:bg-sakura-700"
      >
        {t('cta')}
      </Link>
      <Alert kind="warn">{t('notice')}</Alert>
    </section>
  );
}
