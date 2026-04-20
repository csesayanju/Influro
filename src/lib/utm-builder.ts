/**
 * UTM URL building utilities.
 *
 * Pure functions — no runtime-specific APIs. Safe to import in:
 *   - Next.js server / client code
 *   - Vitest tests (Node)
 *   - Supabase Edge Functions (Deno) via relative path import
 */

// ── Platform normalisation ────────────────────────────────────────────────────

const PLATFORM_SOURCE_MAP: Record<string, string> = {
  instagram: "instagram",
  youtube: "youtube",
  "twitter/x": "twitter",
  twitter: "twitter",
  x: "twitter",
};

/**
 * Converts a platform display name to a UTM-safe utm_source string.
 * "Instagram" → "instagram", "Twitter/X" → "twitter", unknown → slug of input.
 */
export function platformToUtmSource(platform: string): string {
  const key = platform.toLowerCase();
  return (
    PLATFORM_SOURCE_MAP[key] ??
    key.replace(/[^a-z0-9]/g, "").slice(0, 50) // safe fallback
  );
}

// ── Full destination URL (with UTM params) ────────────────────────────────────

export interface BuildFullUrlParams {
  /** Brand's destination URL e.g. "https://brand.in/sale" */
  destinationUrl: string;
  /** Influencer platform ("Instagram", "YouTube", "Twitter/X") */
  platform: string;
  /** Campaign slug e.g. "summer-glow-2026" */
  campaignSlug: string;
  /** Influencer UUID — used as utm_content for per-influencer attribution */
  influencerId: string;
}

/**
 * Appends UTM query parameters to a destination URL.
 * Existing query params are preserved; UTM params are always (over)written.
 *
 * utm_source  = platformToUtmSource(platform)
 * utm_medium  = "influencer"
 * utm_campaign = campaignSlug
 * utm_content  = influencerId
 */
export function buildFullUrl({
  destinationUrl,
  platform,
  campaignSlug,
  influencerId,
}: BuildFullUrlParams): string {
  const url = new URL(destinationUrl);
  url.searchParams.set("utm_source", platformToUtmSource(platform));
  url.searchParams.set("utm_medium", "influencer");
  url.searchParams.set("utm_campaign", campaignSlug);
  url.searchParams.set("utm_content", influencerId);
  return url.toString();
}

// ── Influro tracking URL (what the influencer shares) ─────────────────────────

export interface BuildTrackingUrlParams {
  /** App base URL e.g. "https://influro.app" or "http://localhost:3000" */
  appUrl: string;
  /** Campaign slug */
  campaignSlug: string;
  /** Influencer UUID */
  influencerId: string;
}

/**
 * Builds the Influro redirect tracking URL.
 * Format: <appUrl>/r/<campaignSlug>?c=<influencerId>
 *
 * When a visitor hits this URL, TECH-13 middleware logs the click and
 * redirects to the full destination URL (utm_links.full_url).
 */
export function buildTrackingUrl({
  appUrl,
  campaignSlug,
  influencerId,
}: BuildTrackingUrlParams): string {
  const base = appUrl.replace(/\/+$/, "");
  return `${base}/r/${campaignSlug}?c=${influencerId}`;
}
