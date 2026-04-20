"use server";

import { routes } from "@/config/routes";
import { createServerClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import type { User } from "@supabase/supabase-js";

export type BrandRow = {
  id: string;
  name: string;
  plan: string;
  category: string | null;
};

export type EnsureBrandResult = { brand: BrandRow } | { error: string };

/**
 * Returns the brand for the given user, creating one on first sign-in.
 *
 * Accepts `user` from the caller so this function never makes its own
 * `auth.getUser()` network call — the caller's existing user object is reused.
 * This eliminates one ~300 ms round-trip per page render.
 */
export async function ensureBrandProfile(
  user: User
): Promise<EnsureBrandResult> {
  const supabase = createServerClient();

  const { data: existing } = await supabase
    .from("brands")
    .select("id, name, plan, category")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return { brand: existing as BrandRow };

  // First sign-in — create the brand row
  const metaName = user.user_metadata?.full_name;
  const name =
    (typeof metaName === "string" && metaName.trim()) ||
    user.email?.split("@")[0] ||
    "My brand";

  const { data: created, error } = await supabase
    .from("brands")
    .insert({ user_id: user.id, name })
    .select("id, name, plan, category")
    .single();

  if (error || !created) return { error: error?.message ?? "Failed to create brand" };

  revalidatePath(routes.dashboard);
  return { brand: created as BrandRow };
}
