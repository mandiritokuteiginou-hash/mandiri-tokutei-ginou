import { NextResponse, type NextRequest } from 'next/server';
import { log } from '@/lib/logger';
import { safeNext } from '@/lib/safe-redirect';
import { createClient } from '@/lib/supabase/server';

/** Email links (verification, recovery) land here with a one-time `code`; exchanged server-side for a session. */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next'), '/');
  const sb = await createClient();
  if (!sb || !code) return NextResponse.redirect(`${origin}/login`);
  const { error } = await sb.auth.exchangeCodeForSession(code);
  if (error) {
    log('warn', 'auth callback exchange failed');
    return NextResponse.redirect(`${origin}/login`);
  }
  return NextResponse.redirect(`${origin}${next}`); // relative-only: no open redirect
}
