import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server-side client for Route Handlers that must act as the signed-in
// user (reads the session from cookies), so RLS/is_admin() checks apply
// exactly as they do for the browser client.
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component render path with no
            // response to attach cookies to; safe to ignore here since
            // this client is only used from Route Handlers.
          }
        },
      },
    }
  );
}
