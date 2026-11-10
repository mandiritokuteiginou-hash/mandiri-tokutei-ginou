import { getTranslations } from 'next-intl/server';
import { ResetPasswordForm } from '@/components/AuthForms';
import { Card } from '@/components/ui';

export default async function ResetPasswordPage() {
  const t = await getTranslations('auth');
  return (
    <Card className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-bold">{t('resetTitle')}</h1>
      <ResetPasswordForm />
    </Card>
  );
}
