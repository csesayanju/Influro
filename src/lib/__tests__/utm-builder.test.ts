/**
 * Unit tests for utm-builder.ts
 *
 * Covers:
 *  platformToUtmSource
 *    - known platforms (Instagram, YouTube, Twitter/X)
 *    - case insensitive
 *    - unknown platform → safe slug fallback
 *
 *  buildFullUrl
 *    - appends four UTM params to a clean URL
 *    - merges into existing query params (no duplication)
 *    - overwrites any pre-existing UTM params
 *    - URLs with paths and trailing slashes
 *    - platform routed through platformToUtmSource
 *
 *  buildTrackingUrl
 *    - correct /r/<slug>?c=<id> format
 *    - strips trailing slash from appUrl
 *    - works with localhost and production URL
 */
import { describe, expect, it } from "vitest";
import {
  buildFullUrl,
  buildTrackingUrl,
  platformToUtmSource,
} from "../utm-builder";

// ── platformToUtmSource ───────────────────────────────────────────────────────

describe("platformToUtmSource", () => {
  it("maps Instagram → instagram", () => {
    expect(platformToUtmSource("Instagram")).toBe("instagram");
  });

  it("maps YouTube → youtube", () => {
    expect(platformToUtmSource("YouTube")).toBe("youtube");
  });

  it("maps Twitter/X → twitter", () => {
    expect(platformToUtmSource("Twitter/X")).toBe("twitter");
  });

  it("maps twitter (no /X) → twitter", () => {
    expect(platformToUtmSource("twitter")).toBe("twitter");
  });

  it("maps X → twitter", () => {
    expect(platformToUtmSource("X")).toBe("twitter");
  });

  it("is case-insensitive for known platforms", () => {
    expect(platformToUtmSource("INSTAGRAM")).toBe("instagram");
    expect(platformToUtmSource("youTube")).toBe("youtube");
  });

  it("unknown platform → lowercased, special chars stripped", () => {
    expect(platformToUtmSource("TikTok")).toBe("tiktok");
    expect(platformToUtmSource("LinkedIn")).toBe("linkedin");
    expect(platformToUtmSource("Snap Chat!")).toBe("snapchat");
  });

  it("empty string → empty string", () => {
    expect(platformToUtmSource("")).toBe("");
  });
});

// ── buildFullUrl ──────────────────────────────────────────────────────────────

const BASE_PARAMS = {
  destinationUrl: "https://brand.in/sale",
  platform: "Instagram",
  campaignSlug: "summer-glow-2026",
  influencerId: "inf-uuid-123",
};

describe("buildFullUrl", () => {
  it("appends all four UTM params to a clean URL", () => {
    const result = buildFullUrl(BASE_PARAMS);
    const url = new URL(result);
    expect(url.searchParams.get("utm_source")).toBe("instagram");
    expect(url.searchParams.get("utm_medium")).toBe("influencer");
    expect(url.searchParams.get("utm_campaign")).toBe("summer-glow-2026");
    expect(url.searchParams.get("utm_content")).toBe("inf-uuid-123");
  });

  it("preserves the original path and host", () => {
    const result = buildFullUrl(BASE_PARAMS);
    const url = new URL(result);
    expect(url.hostname).toBe("brand.in");
    expect(url.pathname).toBe("/sale");
  });

  it("preserves existing non-UTM query params", () => {
    const result = buildFullUrl({
      ...BASE_PARAMS,
      destinationUrl: "https://brand.in/sale?ref=homepage&promo=SAVE10",
    });
    const url = new URL(result);
    expect(url.searchParams.get("ref")).toBe("homepage");
    expect(url.searchParams.get("promo")).toBe("SAVE10");
    expect(url.searchParams.get("utm_source")).toBe("instagram");
  });

  it("overwrites pre-existing UTM params on the destination URL", () => {
    const result = buildFullUrl({
      ...BASE_PARAMS,
      destinationUrl:
        "https://brand.in/sale?utm_source=old_source&utm_campaign=old_campaign",
    });
    const url = new URL(result);
    expect(url.searchParams.get("utm_source")).toBe("instagram");
    expect(url.searchParams.get("utm_campaign")).toBe("summer-glow-2026");
  });

  it("uses platformToUtmSource for the utm_source value", () => {
    const resultYT  = buildFullUrl({ ...BASE_PARAMS, platform: "YouTube" });
    const resultTWX = buildFullUrl({ ...BASE_PARAMS, platform: "Twitter/X" });
    expect(new URL(resultYT).searchParams.get("utm_source")).toBe("youtube");
    expect(new URL(resultTWX).searchParams.get("utm_source")).toBe("twitter");
  });

  it("handles destination URL with no path (root)", () => {
    const result = buildFullUrl({
      ...BASE_PARAMS,
      destinationUrl: "https://brand.in",
    });
    const url = new URL(result);
    expect(url.hostname).toBe("brand.in");
    expect(url.searchParams.get("utm_medium")).toBe("influencer");
  });

  it("handles destination URL with deep path", () => {
    const result = buildFullUrl({
      ...BASE_PARAMS,
      destinationUrl: "https://brand.in/collections/summer/glow?sort=new",
    });
    const url = new URL(result);
    expect(url.pathname).toBe("/collections/summer/glow");
    expect(url.searchParams.get("sort")).toBe("new");
    expect(url.searchParams.get("utm_source")).toBe("instagram");
  });
});

// ── buildTrackingUrl ──────────────────────────────────────────────────────────

describe("buildTrackingUrl", () => {
  it("produces the correct /r/<slug>?c=<id> format", () => {
    const result = buildTrackingUrl({
      appUrl: "https://influro.app",
      campaignSlug: "summer-glow-2026",
      influencerId: "inf-uuid-123",
    });
    expect(result).toBe(
      "https://influro.app/r/summer-glow-2026?c=inf-uuid-123"
    );
  });

  it("strips a single trailing slash from appUrl", () => {
    const result = buildTrackingUrl({
      appUrl: "https://influro.app/",
      campaignSlug: "protein-push-q2",
      influencerId: "abc",
    });
    expect(result).toBe("https://influro.app/r/protein-push-q2?c=abc");
  });

  it("strips multiple trailing slashes", () => {
    const result = buildTrackingUrl({
      appUrl: "https://influro.app///",
      campaignSlug: "slug",
      influencerId: "id",
    });
    expect(result).toBe("https://influro.app/r/slug?c=id");
  });

  it("works with localhost for local dev", () => {
    const result = buildTrackingUrl({
      appUrl: "http://localhost:3000",
      campaignSlug: "test-campaign",
      influencerId: "local-inf",
    });
    expect(result).toBe(
      "http://localhost:3000/r/test-campaign?c=local-inf"
    );
  });

  it("uses the influencer UUID (not handle) as the c param", () => {
    const result = buildTrackingUrl({
      appUrl: "https://influro.app",
      campaignSlug: "slug",
      influencerId: "aead48d9-9345-429e-9fa3-0480b9ed3ade",
    });
    expect(result).toContain(
      "?c=aead48d9-9345-429e-9fa3-0480b9ed3ade"
    );
  });
});
