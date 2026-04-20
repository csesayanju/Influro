/**
 * Unit tests for the /r/<slug>?c=<influencer_id> click-tracking route.
 *
 * Mocks @/lib/supabase (the admin client) with a tiny stub so we can assert:
 *   - missing / malformed inputs redirect home without hitting the DB
 *   - unknown (slug, influencer) redirects home without inserting
 *   - valid hit redirects to full_url, sets the session cookie, inserts click_events
 *   - an existing valid session cookie is preserved (no re-set)
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Supabase admin client stub ────────────────────────────────────────────────
// The route calls:
//   admin.from("utm_links").select(...).eq(...).eq(...).maybeSingle()
//   admin.from("click_events").insert({...}).then(cb)
// We build a thenable insert builder so `void admin.from(...).insert(...).then(...)` works.

type LookupResult = { data: unknown; error: unknown };
const lookupResult: { current: LookupResult } = { current: { data: null, error: null } };
const insertCalls: unknown[] = [];

function makeFrom(table: string) {
  if (table === "utm_links") {
    const builder = {
      select: () => builder,
      eq: () => builder,
      maybeSingle: async () => lookupResult.current,
    };
    return builder;
  }
  if (table === "click_events") {
    return {
      insert: (row: unknown) => {
        insertCalls.push(row);
        // thenable so `.then(cb)` works with our fire-and-forget pattern
        return Promise.resolve({ error: null });
      },
    };
  }
  throw new Error(`unexpected table: ${table}`);
}

vi.mock("@/lib/supabase", () => ({
  createAdminClient: () => ({ from: makeFrom }),
}));

// Route must be imported AFTER the mock is set up.
import { GET } from "../route";

// Helpers ---------------------------------------------------------------------

const INF_ID = "11111111-2222-3333-4444-555555555555";
const EXISTING_SESSION = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

import { NextRequest } from "next/server";

function makeReq(url: string, headers: Record<string, string> = {}) {
  return new NextRequest(url, { headers });
}

beforeEach(() => {
  insertCalls.length = 0;
  lookupResult.current = { data: null, error: null };
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("GET /r/[slug]", () => {
  it("redirects to / when influencer id is missing", async () => {
    const res = await GET(makeReq("https://example.com/r/spring"), {
      params: { slug: "spring" },
    });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://example.com/");
    expect(insertCalls).toHaveLength(0);
  });

  it("redirects to / when influencer id is not a UUID", async () => {
    const res = await GET(makeReq("https://example.com/r/spring?c=not-a-uuid"), {
      params: { slug: "spring" },
    });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://example.com/");
    expect(insertCalls).toHaveLength(0);
  });

  it("redirects to / for an unknown (slug, influencer) combo", async () => {
    lookupResult.current = { data: null, error: null };
    const res = await GET(
      makeReq(`https://example.com/r/unknown?c=${INF_ID}`),
      { params: { slug: "unknown" } }
    );
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://example.com/");
    expect(insertCalls).toHaveLength(0);
  });

  it("redirects to full_url, sets cookie, and logs the click on a valid hit", async () => {
    lookupResult.current = {
      data: {
        id: "link-1",
        full_url: "https://brand.example/sale?utm_source=instagram",
        campaign_id: "camp-1",
        campaigns: { slug: "spring" },
      },
      error: null,
    };

    const res = await GET(
      makeReq(`https://example.com/r/spring?c=${INF_ID}`, {
        "user-agent": "ua-test",
        "x-forwarded-for": "203.0.113.10, 10.0.0.1",
        referer: "https://instagram.com/some-post",
      }),
      { params: { slug: "spring" } }
    );

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(
      "https://brand.example/sale?utm_source=instagram"
    );

    // Session cookie was set
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toMatch(/ifr_sid=/);
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=lax/i);

    // Click event inserted with the expected shape
    expect(insertCalls).toHaveLength(1);
    const row = insertCalls[0] as Record<string, unknown>;
    expect(row.utm_link_id).toBe("link-1");
    expect(row.user_agent).toBe("ua-test");
    expect(row.referer).toBe("https://instagram.com/some-post");
    expect(typeof row.ip_hash).toBe("string");
    expect((row.ip_hash as string).length).toBe(64); // sha256 hex
    expect(typeof row.session_id).toBe("string");
  });

  it("reuses an existing valid session cookie without setting a new one", async () => {
    lookupResult.current = {
      data: {
        id: "link-1",
        full_url: "https://brand.example/sale",
        campaign_id: "camp-1",
        campaigns: { slug: "spring" },
      },
      error: null,
    };

    const res = await GET(
      makeReq(`https://example.com/r/spring?c=${INF_ID}`, {
        cookie: `ifr_sid=${EXISTING_SESSION}`,
      }),
      { params: { slug: "spring" } }
    );

    expect(res.status).toBe(302);
    // No Set-Cookie header because the cookie was already valid.
    expect(res.headers.get("set-cookie")).toBeNull();

    expect(insertCalls).toHaveLength(1);
    const row = insertCalls[0] as Record<string, unknown>;
    expect(row.session_id).toBe(EXISTING_SESSION);
  });
});
