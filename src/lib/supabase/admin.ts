import { createClient } from "@supabase/supabase-js";

/**
 * Admin client — bypasses RLS. Use only in Server Components, Route Handlers,
 * middleware, or scripts. Requires SUPABASE_SECRET_KEY (never NEXT_PUBLIC_*).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY (server-only)."
    );
  }
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
