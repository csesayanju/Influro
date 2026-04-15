"use server";

import { routes } from "@/config/routes";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function isDateRangeValid(startDate: string | null, endDate: string | null) {
  if (!startDate || !endDate) return true;
  return endDate >= startDate;
}

function toSingle(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

type BrandLookupResult =
  | { supabase: ReturnType<typeof createClient>; brandId: string }
  | { error: string };

async function getBrandIdForCurrentUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" } satisfies BrandLookupResult;

  const { data: brand } = await supabase
    .from("brands")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!brand) return { error: "Brand profile not found" } satisfies BrandLookupResult;

  return { supabase, brandId: brand.id } satisfies BrandLookupResult;
}

function validateBudget(raw: FormDataEntryValue | null) {
  const text = String(raw ?? "").trim();
  if (text.length === 0) return 0;
  const num = Number(text);
  if (!Number.isFinite(num) || !Number.isInteger(num) || num < 0) {
    return null;
  }
  return num;
}

export async function createCampaignAction(
  formData: FormData
): Promise<void> {
  const result = await getBrandIdForCurrentUser();
  if ("error" in result) {
    redirect(`${routes.campaigns}?error=Please sign in again`);
  }

  const name = toSingle(formData.get("name"));
  const slugInput = toSingle(formData.get("slug"));
  const platform = toSingle(formData.get("platform")) || null;
  const startDate = toSingle(formData.get("startDate")) || null;
  const endDate = toSingle(formData.get("endDate")) || null;
  const status = toSingle(formData.get("status")) || "draft";
  const budget = validateBudget(formData.get("budget"));

  if (!name) {
    redirect(`${routes.campaigns}?error=Campaign name is required`);
  }
  if (budget === null) {
    redirect(`${routes.campaigns}?error=Budget must be a non-negative whole number`);
  }
  if (!isDateRangeValid(startDate, endDate)) {
    redirect(`${routes.campaigns}?error=End date cannot be earlier than start date`);
  }
  const slug = normalizeSlug(slugInput || name);
  if (!slug) {
    redirect(`${routes.campaigns}?error=Slug is required`);
  }

  const { error } = await result.supabase.from("campaigns").insert({
    brand_id: result.brandId,
    name,
    slug,
    budget,
    platform,
    start_date: startDate,
    end_date: endDate,
    status: status === "active" || status === "completed" ? status : "draft",
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

export async function updateCampaignAction(
  formData: FormData
): Promise<void> {
  const result = await getBrandIdForCurrentUser();
  const returnTo = toSingle(formData.get("returnTo")) || routes.campaigns;
  if ("error" in result) {
    redirect(`${returnTo}?error=Please sign in again`);
  }

  const id = toSingle(formData.get("id"));
  const name = toSingle(formData.get("name"));
  const slugInput = toSingle(formData.get("slug"));
  const platform = toSingle(formData.get("platform")) || null;
  const startDate = toSingle(formData.get("startDate")) || null;
  const endDate = toSingle(formData.get("endDate")) || null;
  const status = toSingle(formData.get("status")) || "draft";
  const budget = validateBudget(formData.get("budget"));

  if (!id) redirect(`${returnTo}?error=Campaign id is required`);
  if (!name) redirect(`${returnTo}?error=Campaign name is required`);
  if (budget === null) {
    redirect(`${returnTo}?error=Budget must be a non-negative whole number`);
  }
  if (!isDateRangeValid(startDate, endDate)) {
    redirect(`${returnTo}?error=End date cannot be earlier than start date`);
  }
  const slug = normalizeSlug(slugInput || name);
  if (!slug) redirect(`${returnTo}?error=Slug is required`);

  const { error, data } = await result.supabase
    .from("campaigns")
    .update({
      name,
      slug,
      budget,
      platform,
      start_date: startDate,
      end_date: endDate,
      status: status === "active" || status === "completed" ? status : "draft",
    })
    .eq("id", id)
    .eq("brand_id", result.brandId)
    .select("id")
    .maybeSingle();

  if (error) {
    const msg = error.message.toLowerCase().includes("duplicate key")
      ? "Slug already exists. Try a different slug."
      : error.message;
    redirect(`${returnTo}?error=${encodeURIComponent(msg)}`);
  }
  if (!data) redirect(`${returnTo}?error=Campaign not found`);

  revalidatePath(routes.dashboard);
  revalidatePath(routes.campaigns);
  redirect(`${returnTo}?updated=1`);
}

export async function setCampaignStatusAction(
  formData: FormData
): Promise<void> {
  const result = await getBrandIdForCurrentUser();
  const returnTo = toSingle(formData.get("returnTo")) || routes.campaigns;
  if ("error" in result) {
    redirect(`${returnTo}?error=Please sign in again`);
  }

  const id = toSingle(formData.get("id"));
  const status = toSingle(formData.get("status"));
  if (!id) redirect(`${returnTo}?error=Campaign id is required`);
  if (!["draft", "active", "completed"].includes(status)) {
    redirect(`${returnTo}?error=Invalid campaign status`);
  }

  const { error, data } = await result.supabase
    .from("campaigns")
    .update({ status })
    .eq("id", id)
    .eq("brand_id", result.brandId)
    .select("id")
    .maybeSingle();

  if (error) redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);
  if (!data) redirect(`${returnTo}?error=Campaign not found`);

  revalidatePath(routes.dashboard);
  revalidatePath(routes.campaigns);
  redirect(`${returnTo}?updated=1`);
}

export async function archiveCampaignAction(
  formData: FormData
): Promise<void> {
  const result = await getBrandIdForCurrentUser();
  const returnTo = toSingle(formData.get("returnTo")) || routes.campaigns;
  if ("error" in result) {
    redirect(`${returnTo}?error=Please sign in again`);
  }

  const id = toSingle(formData.get("id"));
  if (!id) redirect(`${returnTo}?error=Campaign id is required`);

  const { error, data } = await result.supabase
    .from("campaigns")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("brand_id", result.brandId)
    .select("id")
    .maybeSingle();

  if (error) redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);
  if (!data) redirect(`${returnTo}?error=Campaign not found`);

  revalidatePath(routes.dashboard);
  revalidatePath(routes.campaigns);
  redirect(`${routes.campaigns}?archived=1`);
}

export async function restoreCampaignAction(
  formData: FormData
): Promise<void> {
  const result = await getBrandIdForCurrentUser();
  const returnTo = toSingle(formData.get("returnTo")) || routes.campaigns;
  if ("error" in result) {
    redirect(`${returnTo}?error=Please sign in again`);
  }

  const id = toSingle(formData.get("id"));
  if (!id) redirect(`${returnTo}?error=Campaign id is required`);

  const { error, data } = await result.supabase
    .from("campaigns")
    .update({ archived_at: null })
    .eq("id", id)
    .eq("brand_id", result.brandId)
    .select("id")
    .maybeSingle();

  if (error) redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);
  if (!data) redirect(`${returnTo}?error=Campaign not found`);

  revalidatePath(routes.dashboard);
  revalidatePath(routes.campaigns);
  redirect(`${routes.campaigns}?restored=1`);
}

export async function deleteCampaignAction(
  formData: FormData
): Promise<void> {
  const result = await getBrandIdForCurrentUser();
  const returnTo = toSingle(formData.get("returnTo")) || routes.campaigns;
  if ("error" in result) {
    redirect(`${returnTo}?error=Please sign in again`);
  }

  const id = toSingle(formData.get("id"));
  if (!id) redirect(`${returnTo}?error=Campaign id is required`);

  const { error } = await result.supabase
    .from("campaigns")
    .delete()
    .eq("id", id)
    .eq("brand_id", result.brandId);

  if (error) redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);

  revalidatePath(routes.dashboard);
  revalidatePath(routes.campaigns);
  redirect(`${routes.campaigns}?deleted=1`);
}
