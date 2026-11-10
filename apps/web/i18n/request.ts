import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

export const LOCALES = ['id', 'ja'] as const;
export type Locale = (typeof LOCALES)[number];

export default getRequestConfig(async () => {
  const c = (await cookies()).get('mtg_locale')?.value;
  const locale: Locale = c === 'ja' ? 'ja' : 'id';
  return { locale, messages: (await import(`../messages/${locale}.json`)).default };
});
