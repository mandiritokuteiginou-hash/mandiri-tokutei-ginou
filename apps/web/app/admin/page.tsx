import { getTranslations } from 'next-intl/server';
import { EmptyState } from '@/components/ui';
import { requirePermission } from '@/lib/session';

export default async function AdminHome() {
  await requirePermission('reports.view');
  const t = await getTranslations('admin');
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('overview')}</h1>
      <EmptyState title={t('emptyTitle')} body={t('emptyBody')} />
    </div>
  );
}
