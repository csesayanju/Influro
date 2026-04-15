/**
 * Supabase client exports for SERVER-SIDE use only (Server Components, Actions, Route Handlers).
 * ⚠️  Do NOT import this barrel in "use client" files — next/headers will break the bundle.
 *      Client Components should import directly: import { createClient } from "@/lib/supabase/client"
 *
 *   createServerClient  → Server Components, Server Actions, Route Handlers
 *   createAdminClient   → Bypasses RLS — Route Handlers + scripts only
 */
export { createClient as createServerClient } from "./server";
export { createAdminClient } from "./admin";
