"use server";

import { campaignDetailRoute } from "@/config/routes";
import { createServerClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseInfluencerForm } from "./schemas";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

type AuthContext =
  | { supabase: ReturnType<typeof createServerClient> }
  | { error: string };

async function getAuthenticatedSupabase(): Promise<AuthContext> {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };
  return { supabase };
}

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export async function createInfluencerAction(formData: FormData): Promise<void> {
  const campaignId = str(formData, "campaignId");
  const returnTo = campaignDetailRoute(campaignId);

  const ctx = await getAuthenticatedSupabase();
  if ("error" in ctx)
    redirect(`${returnTo}?error=${encodeURIComponent(ctx.error)}`);

  const brandId = str(formData, "brandId");
  if (!brandId) redirect(`${returnTo}?error=Brand+not+found`);
  if (!campaignId) redirect(`${returnTo}?error=Campaign+not+found`);

  const parsed = parseInfluencerForm(formData);
  if ("error" in parsed)
    redirect(`${returnTo}?error=${encodeURIComponent(parsed.error)}`);

  const { handle, platform, follower_count, agreed_fee } = parsed.data;

  const { error } = await ctx.supabase.from("influencers").insert({
    brand_id: brandId,
    campaign_id: campaignId,
    handle,
    platform,
    follower_count: follower_count ?? null,
    agreed_fee,
  });

  if (error) redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);

  revalidatePath(returnTo);
  redirect(`${returnTo}?added=1`);
}

export async function updateInfluencerAction(formData: FormData): Promise<void> {
  const campaignId = str(formData, "campaignId");
  const returnTo = campaignDetailRoute(campaignId);

  const ctx = await getAuthenticatedSupabase();
  if ("error" in ctx)
    redirect(`${returnTo}?error=${encodeURIComponent(ctx.error)}`);

  const id = str(formData, "id");
  const brandId = str(formData, "brandId");
  if (!id) redirect(`${returnTo}?error=Influencer+id+is+required`);
  if (!brandId) redirect(`${returnTo}?error=Brand+not+found`);

  const parsed = parseInfluencerForm(formData);
  if ("error" in parsed)
    redirect(`${returnTo}?error=${encodeURIComponent(parsed.error)}`);

  const { handle, platform, follower_count, agreed_fee } = parsed.data;

  const { error, data } = await ctx.supabase
    .from("influencers")
    .update({
      handle,
      platform,
      follower_count: follower_count ?? null,
      agreed_fee,
    })
    .eq("id", id)
    .eq("brand_id", brandId)
    .select("id")
    .maybeSingle();

  if (error) redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);
  if (!data) redirect(`${returnTo}?error=Influencer+not+found`);

  revalidatePath(returnTo);
  redirect(`${returnTo}?updated=1`);
}

export async function deleteInfluencerAction(formData: FormData): Promise<void> {
  const campaignId = str(formData, "campaignId");
  const returnTo = campaignDetailRoute(campaignId);

  const ctx = await getAuthenticatedSupabase();
  if ("error" in ctx)
    redirect(`${returnTo}?error=${encodeURIComponent(ctx.error)}`);

  const id = str(formData, "id");
  const brandId = str(formData, "brandId");
  if (!id) redirect(`${returnTo}?error=Influencer+id+is+required`);
  if (!brandId) redirect(`${returnTo}?error=Brand+not+found`);

  const { error } = await ctx.supabase
    .from("influencers")
    .delete()
    .eq("id", id)
    .eq("brand_id", brandId);

  if (error) redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);

  revalidatePath(returnTo);
  redirect(`${returnTo}?deleted=1`);
}
