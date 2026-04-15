import { createServerClient } from "@/lib/supabase";

/**
 * All influencers for a campaign, with click_count joined from utm_links.
 * utm_links has UNIQUE(campaign_id, influencer_id) so the array is always
 * 0 or 1 items — use utm_links?.[0]?.click_count ?? 0 to read it.
 */
export async function getInfluencersByCampaign(
  campaignId: string,
  brandId: string
) {
  const supabase = createServerClient();
  return supabase
    .from("influencers")
    .select(
      "id, handle, platform, follower_count, agreed_fee, utm_links(click_count)"
    )
    .eq("campaign_id", campaignId)
    .eq("brand_id", brandId)
    .order("created_at", { ascending: true });
}

export async function getInfluencerById(id: string, brandId: string) {
  const supabase = createServerClient();
  return supabase
    .from("influencers")
    .select("id, handle, platform, follower_count, agreed_fee, campaign_id")
    .eq("id", id)
    .eq("brand_id", brandId)
    .maybeSingle();
}
