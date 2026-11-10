import { getTranslations } from 'next-intl/server';
export default async function Loading() {
  const t = await getTranslations('common');
  return (
    <p role="status" className="py-8 text-navy/70">
      {t('loading')}
    </p>
  );
}
