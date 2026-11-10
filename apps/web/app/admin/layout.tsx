import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Alert } from '@/components/ui';
import { getSession, hasInternalAccess } from '@/lib/session';

const NAV = [
  'overview',
  'candidates',
  'jobs',
  'companies',
  'recruitment',
  'education',
  'community',
  'ai',
  'reports',
  'settings',
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [t, session] = [await getTranslations('admin'), await getSession()];
  if (!session) redirect('/login?next=/admin');
  if (!hasInternalAccess(session)) return <Alert>{t('forbidden')}</Alert>; // authorization enforced server-side
  return (
    <div className="grid gap-6 md:grid-cols-[14rem_1fr]">
      <nav aria-label="Admin" className="rounded-xl bg-navy p-3 text-sm text-white">
        <p className="px-2 pb-2 font-semibold">{t('title')}</p>
        <ul className="space-y-1">
          {NAV.map((k) => (
            <li key={k}>
              <Link
                href={k === 'overview' ? '/admin' : `/admin/${k}`}
                className="block rounded px-2 py-2 hover:bg-navy-700"
              >
                {t(k)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <section>{children}</section>
    </div>
  );
}
