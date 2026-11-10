import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { SiteHeader } from '@/components/SiteHeader';
import { getSession } from '@/lib/session';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Mandiri Tokutei Ginou', template: '%s · MTG' },
  description: 'Japan career & talent platform for Indonesian workers.',
  manifest: '/manifest.webmanifest',
};
export const viewport: Viewport = { themeColor: '#0B1F3A', width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, messages, session] = await Promise.all([getLocale(), getMessages(), getSession()]);
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SiteHeader session={session} />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
