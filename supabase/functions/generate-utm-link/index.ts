/**
 * generate-utm-link — Supabase Edge Function (Deno)
 *
 * POST { campaign_id, influencer_id }
 * Authorization: Bearer <user-jwt>
 *
 * → Builds a full destination URL with UTM params and an Influro tracking
 *   redirect URL, upserts the utm_links row (idempotent), returns both URLs.
 *
 * Response 200:
 *   { tracking_url, full_url, click_count }
 *
 * Error responses:
 *   400 — missing / invalid body
 *   401 — missing or invalid JWT
 *   404 — campaign or influencer not found
 *   422 — campaign has no destination_url
 *   500 — database error
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Shared pure-function URL builder (no Deno-specific APIs).
// Supabase CLI bundles this via the relative path at deploy time.
import {
  buildFullUrl,
  buildTrackingUrl,
  platformToUtmSource,
} from "../../../src/lib/utm-builder.ts";

// ── Environment ───────────────────────────────────────────────────────────────

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

/** Set this in the Supabase dashboard → Project Settings → Edge Functions → Secrets.
 *  Value: your deployed Next.js URL e.g. https://influro.app
 *  Falls back to localhost for local dev. */
const APP_URL = Deno.env.get("APP_URL") ?? "http://localhost:3000";

// ── Helpers ───────────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: { campaign_id?: unknown; influencer_id?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const campaign_id =
    typeof body.campaign_id === "string" ? body.campaign_id.trim() : null;
  const influencer_id =
    typeof body.influencer_id === "string" ? body.influencer_id.trim() : null;

  if (!campaign_id || !influencer_id) {
    return json({ error: "campaign_id and influencer_id are required" }, 400);
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Missing or malformed Authorization header" }, 401);
  }

  // User-scoped client — RLS enforced automatically
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return json({ error: "Unauthorized" }, 401);
  }

  // ── Fetch campaign (RLS: must belong to user's brand) ────────────────────
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id, slug, platform, destination_url")
    .eq("id", campaign_id)
    .maybeSingle();

  if (campaignError || !campaign) {
    return json({ error: "Campaign not found" }, 404);
  }

  if (!campaign.destination_url) {
    return json(
      {
        error:
          "Campaign has no destination URL — add one in Edit Campaign before generating a link.",
      },
      422
    );
  }

  // ── Fetch influencer (RLS: must belong to same campaign + brand) ──────────
  const { data: influencer, error: influencerError } = await supabase
    .from("influencers")
    .select("id, handle, platform")
    .eq("id", influencer_id)
    .eq("campaign_id", campaign_id)
    .maybeSingle();

  if (influencerError || !influencer) {
    return json({ error: "Influencer not found in this campaign" }, 404);
  }

  // ── Build URLs ────────────────────────────────────────────────────────────
  const platform = influencer.platform ?? campaign.platform ?? "Instagram";

  const fullUrl = buildFullUrl({
    destinationUrl: campaign.destination_url,
    platform,
    campaignSlug: campaign.slug,
    influencerId: influencer_id,
  });

  const trackingUrl = buildTrackingUrl({
    appUrl: APP_URL,
    campaignSlug: campaign.slug,
    influencerId: influencer_id,
  });

  // ── Upsert utm_links (idempotent — re-generate is safe, preserves clicks) ─
  const { data: link, error: upsertError } = await supabase
    .from("utm_links")
    .upsert(
      {
        campaign_id,
        influencer_id,
        full_url: fullUrl,
        utm_source: platformToUtmSource(platform),
        utm_medium: "influencer",
        utm_campaign: campaign.slug,
        utm_content: influencer_id,
      },
      { onConflict: "campaign_id,influencer_id" }
    )
    .select("id, click_count")
    .single();

  if (upsertError || !link) {
    return json({ error: upsertError?.message ?? "Failed to store UTM link" }, 500);
  }

  return json({
    tracking_url: trackingUrl,
    full_url: fullUrl,
    click_count: link.click_count,
  });
});
