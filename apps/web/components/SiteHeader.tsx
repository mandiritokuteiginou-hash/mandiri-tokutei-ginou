import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { logoutAction, setLocaleAction } from '@/app/actions';
import { hasInternalAccess, type Session } from '@/lib/session';
import { Button } from './ui';

export async function SiteHeader({ session }: { session: Session }) {
  const t = await getTranslations();
  const items = [
    ['/', 'home'],
    ['/jobs', 'jobs'],
    ['/matching', 'matching'],
    ['/learning', 'learning'],
    ['/profile', 'profile'],
  ] as const;
  return (
    <header className="border-b border-navy/10 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="inline-block size-3 rounded-full bg-sakura" aria-hidden />
          {t('brand')}
        </Link>
        <nav aria-label="Main" className="flex flex-1 flex-wrap gap-4 text-sm">
          {items.map(([href, k]) => (
            <Link key={k} href={href} className="hover:text-sakura">
              {t(`nav.${k}`)}
            </Link>
          ))}
          {hasInternalAccess(session) && (
            <Link href="/admin" className="font-semibold text-sakura">
              {t('admin.title')}
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
          <form action={setLocaleAction} className="flex gap-1" aria-label={t('common.language')}>
            <button
              name="locale"
              value="id"
              className="px-2 text-sm underline-offset-4 hover:underline"
            >
              ID
            </button>
            <button
              name="locale"
              value="ja"
              className="px-2 text-sm underline-offset-4 hover:underline"
            >
              日本語
            </button>
          </form>
          {session ? (
            <form action={logoutAction}>
              <Button variant="ghost" type="submit">
                {t('nav.logout')}
              </Button>
            </form>
          ) : (
            <>
              <Link href="/login" className="text-sm">
                {t('nav.login')}
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-sakura px-3 py-2 text-sm font-semibold text-white"
              >
                {t('nav.register')}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
