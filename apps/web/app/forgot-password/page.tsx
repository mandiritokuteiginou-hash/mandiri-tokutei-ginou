import { getTranslations } from 'next-intl/server';
import { ForgotPasswordForm } from '@/components/AuthForms';
import { Card } from '@/components/ui';

export default async function ForgotPasswordPage() {
  const t = await getTranslations('auth');
  return (
    <Card className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-bold">{t('forgotTitle')}</h1>
      <ForgotPasswordForm />
    </Card>
  );
}
