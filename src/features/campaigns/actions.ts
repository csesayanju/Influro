"use server";

import { routes } from "@/config/routes";
import { createServerClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizeSlug, parseCampaignForm } from "./schemas";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

type AuthContext =
  | { supabase: ReturnType<typeof createServerClient> }
  | { error: string };

/**
 * Verify the session is valid. Does NOT query the brands table — brand
 * ownership is enforced by Supabase RLS on every query, so the extra round
 * trip is redundant. brandId is passed from the form as a hidden field.
 */
async function getAuthenticatedSupabase(): Promise<AuthContext> {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };
  return { supabase };
}

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export async function createCampaignAction(formData: FormData): Promise<void> {
  const ctx = await getAuthenticatedSupabase();
  if ("error" in ctx) redirect(`${routes.campaigns}?error=${encodeURIComponent(ctx.error)}`);

  const brandId = str(formData, "brandId");
  if (!brandId) redirect(`${routes.campaigns}?error=Brand+not+found`);

  const parsed = parseCampaignForm(formData);
  if ("error" in parsed) redirect(`${routes.campaigns}?error=${encodeURIComponent(parsed.error)}`);

  const { name, slug: slugInput, platform, startDate, endDate, status, budget } = parsed.data;
  const slug = normalizeSlug(slugInput || name);
  if (!slug) redirect(`${routes.campaigns}?error=Slug+is+required`);

  const { error } = await ctx.supabase.from("campaigns").insert({
    brand_id: brandId,
    name,
    slug,
    budget,
    platform: platform || null,
    start_date: startDate || null,
    end_date: endDate || null,
    status,
  });

  if (error) {
    const msg = error.message.toLowerCase().includes("duplicate key")
      ? "Slug already exists. Try a different slug."
      : error.message;
    redirect(`${routes.campaigns}?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath(routes.campaigns);
  redirect(`${routes.campaigns}?created=1&t=${Date.now()}`);
}

export async function updateCampaignAction(formData: FormData): Promise<void> {
  const ctx = await getAuthenticatedSupabase();
  const returnTo = str(formData, "returnTo") || routes.campaigns;
  if ("error" in ctx) redirect(`${returnTo}?error=${encodeURIComponent(ctx.error)}`);

  const id = str(formData, "id");
  const brandId = str(formData, "brandId");
  if (!id) redirect(`${returnTo}?error=Campaign+id+is+required`);
  if (!brandId) redirect(`${returnTo}?error=Brand+not+found`);

  const parsed = parseCampaignForm(formData);
  if ("error" in parsed) redirect(`${returnTo}?error=${encodeURIComponent(parsed.error)}`);

  const { name, slug: slugInput, platform, startDate, endDate, status, budget } = parsed.data;
  const slug = normalizeSlug(slugInput || name);
  if (!slug) redirect(`${returnTo}?error=Slug+is+required`);

  const { error, data } = await ctx.supabase
    .from("campaigns")
    .update({ name, slug, budget, platform: platform || null, start_date: startDate || null, end_date: endDate || null, status })
    .eq("id", id)
    .eq("brand_id", brandId)
    .select("id")
    .maybeSingle();

  if (error) {
    const msg = error.message.toLowerCase().includes("duplicate key")
      ? "Slug already exists. Try a different slug."
      : error.message;
    redirect(`${returnTo}?error=${encodeURIComponent(msg)}`);
  }
  if (!data) redirect(`${returnTo}?error=Campaign+not+found`);

  revalidatePath(routes.campaigns);
  redirect(`${returnTo}?updated=1`);
}

export async function setCampaignStatusAction(formData: FormData): Promise<void> {
  const ctx = await getAuthenticatedSupabase();
  const returnTo = str(formData, "returnTo") || routes.campaigns;
  if ("error" in ctx) redirect(`${returnTo}?error=${encodeURIComponent(ctx.error)}`);

  const id = str(formData, "id");
  const brandId = str(formData, "brandId");
  const status = str(formData, "status");
  if (!id) redirect(`${returnTo}?error=Campaign+id+is+required`);
  if (!brandId) redirect(`${returnTo}?error=Brand+not+found`);
  if (!["draft", "active", "completed"].includes(status)) {
    redirect(`${returnTo}?error=Invalid+campaign+status`);
  }

  const { error, data } = await ctx.supabase
    .from("campaigns")
    .update({ status })
    .eq("id", id)
    .eq("brand_id", brandId)
    .select("id")
    .maybeSingle();

  if (error) redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);
  if (!data) redirect(`${returnTo}?error=Campaign+not+found`);

  revalidatePath(routes.campaigns);
  redirect(`${returnTo}?updated=1`);
}

export async function archiveCampaignAction(formData: FormData): Promise<void> {
  const ctx = await getAuthenticatedSupabase();
  const returnTo = str(formData, "returnTo") || routes.campaigns;
  if ("error" in ctx) redirect(`${returnTo}?error=${encodeURIComponent(ctx.error)}`);

  const id = str(formData, "id");
  const brandId = str(formData, "brandId");
  if (!id) redirect(`${returnTo}?error=Campaign+id+is+required`);
  if (!brandId) redirect(`${returnTo}?error=Brand+not+found`);

  const { error, data } = await ctx.supabase
    .from("campaigns")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("brand_id", brandId)
    .select("id")
    .maybeSingle();

  if (error) redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);
  if (!data) redirect(`${returnTo}?error=Campaign+not+found`);

  revalidatePath(routes.campaigns);
  redirect(`${routes.campaigns}?archived=1`);
}

export async function restoreCampaignAction(formData: FormData): Promise<void> {
  const ctx = await getAuthenticatedSupabase();
  const returnTo = str(formData, "returnTo") || routes.campaigns;
  if ("error" in ctx) redirect(`${returnTo}?error=${encodeURIComponent(ctx.error)}`);

  const id = str(formData, "id");
  const brandId = str(formData, "brandId");
  if (!id) redirect(`${returnTo}?error=Campaign+id+is+required`);
  if (!brandId) redirect(`${returnTo}?error=Brand+not+found`);

  const { error, data } = await ctx.supabase
    .from("campaigns")
    .update({ archived_at: null })
    .eq("id", id)
    .eq("brand_id", brandId)
    .select("id")
    .maybeSingle();

  if (error) redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);
  if (!data) redirect(`${returnTo}?error=Campaign+not+found`);

  revalidatePath(routes.campaigns);
  redirect(`${routes.campaigns}?restored=1`);
}

export async function deleteCampaignAction(formData: FormData): Promise<void> {
  const ctx = await getAuthenticatedSupabase();
  const returnTo = str(formData, "returnTo") || routes.campaigns;
  if ("error" in ctx) redirect(`${returnTo}?error=${encodeURIComponent(ctx.error)}`);

  const id = str(formData, "id");
  const brandId = str(formData, "brandId");
  if (!id) redirect(`${returnTo}?error=Campaign+id+is+required`);
  if (!brandId) redirect(`${returnTo}?error=Brand+not+found`);

  const { error } = await ctx.supabase
    .from("campaigns")
    .delete()
    .eq("id", id)
    .eq("brand_id", brandId);

  if (error) redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);

  revalidatePath(routes.campaigns);
  redirect(`${routes.campaigns}?deleted=1`);
}
