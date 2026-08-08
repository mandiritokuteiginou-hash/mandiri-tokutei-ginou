import { createClient } from "@supabase/supabase-js";

// Server-side client for public, unauthenticated reads (e.g. active job
// listings on the landing page). No cookies/session needed since these
// rows are readable by the `anon` role per RLS policy.
//
// Returns null instead of throwing when the env vars aren't configured, so
// a deployment missing Supabase config still builds and serves the rest of
// the site instead of failing static generation.
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}
