'use client';
import { useTranslations } from 'next-intl';
import { Alert, Button } from '@/components/ui';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('common');
  return (
    <div className="space-y-3">
      <Alert>{t('error')}</Alert>
      <Button onClick={reset}>{t('retry')}</Button>
    </div>
  );
}
