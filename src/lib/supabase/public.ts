import { createClient } from "@supabase/supabase-js";

// Server-side client for public, unauthenticated reads (e.g. active job
// listings on the landing page). No cookies/session needed since these
// rows are readable by the `anon` role per RLS policy.
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
