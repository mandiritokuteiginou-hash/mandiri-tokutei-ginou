import { getTranslations } from 'next-intl/server';
export default async function NotFound() {
  const t = await getTranslations('common');
  return <h1 className="py-8 text-xl font-semibold">{t('notFound')}</h1>;
}
