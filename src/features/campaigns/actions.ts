"use server";

import { routes } from "@/config/routes";
import { createServerClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizeSlug, parseCampaignForm } from "./schemas";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

type BrandLookup =
  | { supabase: ReturnType<typeof createServerClient>; brandId: string }
  | { error: string };

async function getBrandIdForCurrentUser(): Promise<BrandLookup> {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: brand } = await supabase
    .from("brands")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!brand) return { error: "Brand profile not found" };

  return { supabase, brandId: brand.id };
}

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export async function createCampaignAction(formData: FormData): Promise<void> {
  const ctx = await getBrandIdForCurrentUser();
  if ("error" in ctx) redirect(`${routes.campaigns}?error=${encodeURIComponent(ctx.error)}`);

  const parsed = parseCampaignForm(formData);
  if ("error" in parsed) redirect(`${routes.campaigns}?error=${encodeURIComponent(parsed.error)}`);

  const { name, slug: slugInput, platform, startDate, endDate, status, budget } = parsed.data;
  const slug = normalizeSlug(slugInput || name);
  if (!slug) redirect(`${routes.campaigns}?error=Slug+is+required`);

  const { error } = await ctx.supabase.from("campaigns").insert({
    brand_id: ctx.brandId,
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

  revalidatePath(routes.dashboard);
  revalidatePath(routes.campaigns);
  redirect(`${routes.campaigns}?created=1&t=${Date.now()}`);
}

export async function updateCampaignAction(formData: FormData): Promise<void> {
  const ctx = await getBrandIdForCurrentUser();
  const returnTo = str(formData, "returnTo") || routes.campaigns;
  if ("error" in ctx) redirect(`${returnTo}?error=${encodeURIComponent(ctx.error)}`);

  const id = str(formData, "id");
  if (!id) redirect(`${returnTo}?error=Campaign+id+is+required`);

  const parsed = parseCampaignForm(formData);
  if ("error" in parsed) redirect(`${returnTo}?error=${encodeURIComponent(parsed.error)}`);

  const { name, slug: slugInput, platform, startDate, endDate, status, budget } = parsed.data;
  const slug = normalizeSlug(slugInput || name);
  if (!slug) redirect(`${returnTo}?error=Slug+is+required`);

  const { error, data } = await ctx.supabase
    .from("campaigns")
    .update({ name, slug, budget, platform: platform || null, start_date: startDate || null, end_date: endDate || null, status })
    .eq("id", id)
    .eq("brand_id", ctx.brandId)
    .select("id")
    .maybeSingle();

  if (error) {
    const msg = error.message.toLowerCase().includes("duplicate key")
      ? "Slug already exists. Try a different slug."
      : error.message;
    redirect(`${returnTo}?error=${encodeURIComponent(msg)}`);
  }
  if (!data) redirect(`${returnTo}?error=Campaign+not+found`);

  revalidatePath(routes.dashboard);
  revalidatePath(routes.campaigns);
  redirect(`${returnTo}?updated=1`);
}

export async function setCampaignStatusAction(formData: FormData): Promise<void> {
  const ctx = await getBrandIdForCurrentUser();
  const returnTo = str(formData, "returnTo") || routes.campaigns;
  if ("error" in ctx) redirect(`${returnTo}?error=${encodeURIComponent(ctx.error)}`);

  const id = str(formData, "id");
  const status = str(formData, "status");
  if (!id) redirect(`${returnTo}?error=Campaign+id+is+required`);
  if (!["draft", "active", "completed"].includes(status)) {
    redirect(`${returnTo}?error=Invalid+campaign+status`);
  }

  const { error, data } = await ctx.supabase
    .from("campaigns")
    .update({ status })
    .eq("id", id)
    .eq("brand_id", ctx.brandId)
    .select("id")
    .maybeSingle();

  if (error) redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);
  if (!data) redirect(`${returnTo}?error=Campaign+not+found`);

  revalidatePath(routes.dashboard);
  revalidatePath(routes.campaigns);
  redirect(`${returnTo}?updated=1`);
}

export async function archiveCampaignAction(formData: FormData): Promise<void> {
  const ctx = await getBrandIdForCurrentUser();
  const returnTo = str(formData, "returnTo") || routes.campaigns;
  if ("error" in ctx) redirect(`${returnTo}?error=${encodeURIComponent(ctx.error)}`);

  const id = str(formData, "id");
  if (!id) redirect(`${returnTo}?error=Campaign+id+is+required`);

  const { error, data } = await ctx.supabase
    .from("campaigns")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("brand_id", ctx.brandId)
    .select("id")
    .maybeSingle();

  if (error) redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);
  if (!data) redirect(`${returnTo}?error=Campaign+not+found`);

  revalidatePath(routes.dashboard);
  revalidatePath(routes.campaigns);
  redirect(`${routes.campaigns}?archived=1`);
}

export async function restoreCampaignAction(formData: FormData): Promise<void> {
  const ctx = await getBrandIdForCurrentUser();
  const returnTo = str(formData, "returnTo") || routes.campaigns;
  if ("error" in ctx) redirect(`${returnTo}?error=${encodeURIComponent(ctx.error)}`);

  const id = str(formData, "id");
  if (!id) redirect(`${returnTo}?error=Campaign+id+is+required`);

  const { error, data } = await ctx.supabase
    .from("campaigns")
    .update({ archived_at: null })
    .eq("id", id)
    .eq("brand_id", ctx.brandId)
    .select("id")
    .maybeSingle();

  if (error) redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);
  if (!data) redirect(`${returnTo}?error=Campaign+not+found`);

  revalidatePath(routes.dashboard);
  revalidatePath(routes.campaigns);
  redirect(`${routes.campaigns}?restored=1`);
}

export async function deleteCampaignAction(formData: FormData): Promise<void> {
  const ctx = await getBrandIdForCurrentUser();
  const returnTo = str(formData, "returnTo") || routes.campaigns;
  if ("error" in ctx) redirect(`${returnTo}?error=${encodeURIComponent(ctx.error)}`);

  const id = str(formData, "id");
  if (!id) redirect(`${returnTo}?error=Campaign+id+is+required`);

  const { error } = await ctx.supabase
    .from("campaigns")
    .delete()
    .eq("id", id)
    .eq("brand_id", ctx.brandId);

  if (error) redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);

  revalidatePath(routes.dashboard);
  revalidatePath(routes.campaigns);
  redirect(`${routes.campaigns}?deleted=1`);
}
