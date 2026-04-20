/**
 * TECH-13 — Click-tracking redirect route.
 *
 * GET /r/<campaign-slug>?c=<influencer_id>
 *   1. Looks up the matching utm_links row (joined to the campaign by slug).
 *   2. Sets a session cookie (ifr_sid) for deduplication / later conversion attribution.
 *   3. Inserts a click_events row (fire-and-forget — never blocks the redirect).
 *   4. 302-redirects to utm_links.full_url (which already has UTM params appended).
 *
 * Privacy: the raw IP is never stored — we keep a salted SHA-256 hash only.
 * Security: uses the admin Supabase client because the visitor is anonymous
 * (no user JWT). click_events RLS is locked to service-role so this is required.
 */
import { createAdminClient } from "@/lib/supabase";
import { createHash, randomUUID } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SESSION_COOKIE = "ifr_sid";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? "";
  return createHash("sha256").update(`${ip}:${salt}`).digest("hex");
}

function extractIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() ?? "unknown";
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
  const slug = params.slug?.trim();
  const influencerId = req.nextUrl.searchParams.get("c")?.trim() ?? "";
  const homeUrl = new URL("/", req.url);

  // Validate inputs early — bogus requests silently go home (don't leak existence).
  if (!slug || !influencerId || !UUID_RE.test(influencerId)) {
    return NextResponse.redirect(homeUrl, 302);
  }

  const admin = createAdminClient();

  // One round-trip: pull the utm_links row whose campaign has this slug.
  // Using `campaigns!inner(slug)` keeps the filter server-side.
  const { data: link, error: lookupError } = await admin
    .from("utm_links")
    .select("id, full_url, campaign_id, campaigns!inner(slug)")
    .eq("influencer_id", influencerId)
    .eq("campaigns.slug", slug)
    .maybeSingle();

  if (lookupError || !link?.full_url) {
    return NextResponse.redirect(homeUrl, 302);
  }

  // Session cookie — reuse an existing one if we can parse it as a UUID,
  // otherwise mint a new one. (The DB column is uuid, so non-UUID cookies
  // from other apps must not poison the insert.)
  const existingCookie = req.cookies.get(SESSION_COOKIE)?.value;
  const hasValidSession = existingCookie && UUID_RE.test(existingCookie);
  const sessionId = hasValidSession ? existingCookie! : randomUUID();

  // Fire-and-forget insert. We intentionally don't `await`: the visitor's
  // redirect must never block on our analytics write. Errors are logged
  // server-side only.
  void admin
    .from("click_events")
    .insert({
      utm_link_id: link.id,
      session_id: sessionId,
      ip_hash: hashIp(extractIp(req)),
      user_agent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
      referer: req.headers.get("referer")?.slice(0, 500) ?? null,
      source: "influencer",
    })
    .then(({ error }) => {
      if (error) console.error("[click_events insert]", error.message);
    });

  // Redirect with UTM-laden full_url. `full_url` is an absolute URL so
  // NextResponse.redirect accepts it directly.
  const res = NextResponse.redirect(link.full_url, 302);
  if (!hasValidSession) {
    res.cookies.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: "/",
    });
  }
  return res;
  } catch (err) {
    // DEBUG: temporary — return the error so we can diagnose the 500
    const msg = err instanceof Error ? err.message + "\n" + (err.stack ?? "") : String(err);
    return new NextResponse("DEBUG 500:\n" + msg, { status: 200, headers: { "content-type": "text/plain" } });
  }
}
