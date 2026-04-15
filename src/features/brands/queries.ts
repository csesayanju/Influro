import { createServerClient } from "@/lib/supabase";

export async function getBrandByUserId(userId: string) {
  const supabase = createServerClient();
  return supabase
    .from("brands")
    .select("id, name, plan, category")
    .eq("user_id", userId)
    .maybeSingle();
}
