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

/**
 * Returns the set of influencer IDs that already have a UTM link row
 * for this campaign. Used to pre-populate the "copy" state in
 * GenerateLinkButton on server-render so a page refresh doesn't reset
 * the UI to "Generate link".
 */
export async function getExistingInfluencerIdsWithLinks(
  campaignId: string
): Promise<Set<string>> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("utm_links")
    .select("influencer_id")
    .eq("campaign_id", campaignId);

  if (error || !data) return new Set<string>();
  return new Set(data.map((r) => r.influencer_id as string));
}
