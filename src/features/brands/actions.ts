"use server";

import { routes } from "@/config/routes";
import { createServerClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export type EnsureBrandResult = { ok: true } | { error: string };

export async function ensureBrandProfile(): Promise<EnsureBrandResult> {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: existing } = await supabase
    .from("brands")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return { ok: true };

  const metaName = user.user_metadata?.full_name;
  const name =
    (typeof metaName === "string" && metaName.trim()) ||
    user.email?.split("@")[0] ||
    "My brand";

  const { error } = await supabase.from("brands").insert({ user_id: user.id, name });
  if (error) return { error: error.message };

  revalidatePath(routes.dashboard);
  return { ok: true };
}
