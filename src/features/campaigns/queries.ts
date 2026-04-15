import { createServerClient } from "@/lib/supabase";

export async function getActiveCampaigns(brandId: string) {
  const supabase = createServerClient();
  return supabase
    .from("campaigns")
    .select("id, name, slug, budget, status, platform, start_date, end_date")
    .eq("brand_id", brandId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });
}

export async function getArchivedCampaigns(brandId: string) {
  const supabase = createServerClient();
  return supabase
    .from("campaigns")
    .select("id, name, slug, budget, status, platform, archived_at")
    .eq("brand_id", brandId)
    .not("archived_at", "is", null)
    .order("archived_at", { ascending: false });
}

export async function getCampaignById(id: string, brandId: string) {
  const supabase = createServerClient();
  return supabase
    .from("campaigns")
    .select("id, name, slug, budget, status, platform, start_date, end_date, archived_at, destination_url")
    .eq("id", id)
    .eq("brand_id", brandId)
    .maybeSingle();
}
