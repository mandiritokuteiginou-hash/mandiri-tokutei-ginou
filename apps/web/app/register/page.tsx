import { getTranslations } from 'next-intl/server';
import { RegisterForm } from '@/components/AuthForms';
import { Card } from '@/components/ui';

export default async function RegisterPage() {
  const t = await getTranslations('auth');
  return (
    <Card className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-bold">{t('registerTitle')}</h1>
      <RegisterForm />
    </Card>
  );
}
