/**
 * Influro — Database seed script
 *
 * Creates test users, brands, campaigns, influencers, utm_links for
 * manual testing and QA. Covers every edge case visible in the UI.
 *
 * Usage:
 *   node src/tests/seed/seed.js
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local
 * Re-running is safe — existing test users are deleted and re-created fresh.
 *
 * Test credentials are documented in src/tests/seed/TEST_CREDENTIALS.md
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// ── Config ────────────────────────────────────────────────────────────────────

// Load .env.local manually (no dotenv dependency required)
const envPath = path.join(__dirname, "../../../.env.local");
const envLines = fs.readFileSync(envPath, "utf8").replace(/\r/g, "").split("\n");
const env = {};
for (const line of envLines) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

const SUPABASE_URL = env["NEXT_PUBLIC_SUPABASE_URL"];
const SERVICE_KEY  = env["SUPABASE_SECRET_KEY"];

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Test users ────────────────────────────────────────────────────────────────

const TEST_USERS = [
  {
    email: "demo@influro.test",
    password: "Demo1234!",
    label: "demo",
    brand: {
      name: "GlowLab India",
      website: "https://glowlab.in",
      category: "Skincare",
      plan: "starter",
    },
  },
  {
    email: "empty@influro.test",
    password: "Empty1234!",
    label: "empty",
    brand: {
      name: "ZeroStart Brands",
      website: null,
      category: "Fashion",
      plan: "free",
    },
  },
  // newuser@influro.test has NO brand — lands on onboarding
  {
    email: "newuser@influro.test",
    password: "NewUser1234!",
    label: "newuser",
    brand: null,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function ok(label, data) {
  console.log(`  ✓ ${label}`, Array.isArray(data) ? `(${data.length})` : "");
}

async function must(label, promise) {
  const { data, error } = await promise;
  if (error) {
    console.error(`  ✗ ${label}:`, error.message);
    process.exit(1);
  }
  ok(label, data);
  return data;
}

// ── Seed demo user — full edge-case dataset ───────────────────────────────────

async function seedDemoUser(userId, brandId) {
  console.log("\n  Seeding campaigns…");

  const campaigns = await must(
    "insert campaigns",
    sb
      .from("campaigns")
      .insert([
        // ── Active — full data, destination URL, both dates ────────────────
        {
          brand_id: brandId,
          name: "Summer Glow 2026",
          slug: "summer-glow-2026",
          budget: 250000,
          platform: "Instagram",
          status: "active",
          start_date: "2026-05-01",
          end_date: "2026-05-31",
          destination_url: "https://glowlab.in/summer",
        },
        // ── Active — YouTube, no end date ──────────────────────────────────
        {
          brand_id: brandId,
          name: "Protein Push Q2",
          slug: "protein-push-q2",
          budget: 180000,
          platform: "YouTube",
          status: "active",
          start_date: "2026-04-15",
          end_date: null,
          destination_url: "https://glowlab.in/protein",
        },
        // ── Active — Twitter/X, large budget ──────────────────────────────
        {
          brand_id: brandId,
          name: "Trending Now",
          slug: "trending-now-q2",
          budget: 1000000,
          platform: "Twitter/X",
          status: "active",
          start_date: "2026-04-01",
          end_date: "2026-04-30",
          destination_url: "https://glowlab.in/trending",
        },
        // ── Completed — past campaign, all influencers done ────────────────
        {
          brand_id: brandId,
          name: "Diwali Sale 2025",
          slug: "diwali-sale-2025",
          budget: 500000,
          platform: "Instagram",
          status: "completed",
          start_date: "2025-10-15",
          end_date: "2025-11-05",
          destination_url: "https://glowlab.in/diwali",
        },
        // ── Draft — zero budget, no platform, no dates, no URL ────────────
        {
          brand_id: brandId,
          name: "Untitled Draft",
          slug: "untitled-draft",
          budget: 0,
          platform: null,
          status: "draft",
          start_date: null,
          end_date: null,
          destination_url: null,
        },
        // ── Draft — has budget + URL but no influencers (empty state) ─────
        {
          brand_id: brandId,
          name: "New Year Blast 2027",
          slug: "new-year-blast-2027",
          budget: 350000,
          platform: "Instagram",
          status: "draft",
          start_date: null,
          end_date: null,
          destination_url: "https://glowlab.in/newyear",
        },
        // ── Archived ──────────────────────────────────────────────────────
        {
          brand_id: brandId,
          name: "Holi Sprint (Archived)",
          slug: "holi-sprint-archived",
          budget: 120000,
          platform: "Instagram",
          status: "draft",
          start_date: "2026-03-01",
          end_date: "2026-03-20",
          destination_url: null,
          archived_at: "2026-03-21T00:00:00Z",
        },
      ])
      .select("id,name,status")
  );

  const [cSummer, cProtein, cTrending, cDiwali, cDraft, cNewYear, cHoli] =
    campaigns;

  console.log("\n  Seeding influencers…");

  // ── Summer Glow — covers all follower/fee edge cases ──────────────────────
  const influencers = await must(
    "insert influencers",
    sb
      .from("influencers")
      .insert([
        // --- Summer Glow ---
        // null followers → shows "—"
        {
          brand_id: brandId,
          campaign_id: cSummer.id,
          handle: "priya.glam",
          platform: "Instagram",
          follower_count: null,
          agreed_fee: 35000,
        },
        // < 1 K → shows raw number "750"
        {
          brand_id: brandId,
          campaign_id: cSummer.id,
          handle: "micro_niche99",
          platform: "Instagram",
          follower_count: 750,
          agreed_fee: 5000,
        },
        // exactly 1 K → shows "1.0K"
        {
          brand_id: brandId,
          campaign_id: cSummer.id,
          handle: "sunita_exactly1k",
          platform: "Instagram",
          follower_count: 1000,
          agreed_fee: 8000,
        },
        // K range 52 K
        {
          brand_id: brandId,
          campaign_id: cSummer.id,
          handle: "riya_skincare",
          platform: "Instagram",
          follower_count: 52000,
          agreed_fee: 18000,
        },
        // K range 890 K (large K, stays K not M)
        {
          brand_id: brandId,
          campaign_id: cSummer.id,
          handle: "beauty.by.ananya",
          platform: "Instagram",
          follower_count: 890000,
          agreed_fee: 60000,
        },
        // M range 1.2 M
        {
          brand_id: brandId,
          campaign_id: cSummer.id,
          handle: "divya_mega",
          platform: "Instagram",
          follower_count: 1200000,
          agreed_fee: 120000,
        },

        // --- Protein Push ---
        // YouTube, large followers, large fee
        {
          brand_id: brandId,
          campaign_id: cProtein.id,
          handle: "fit_rohan",
          platform: "YouTube",
          follower_count: 560000,
          agreed_fee: 50000,
        },
        // Instagram, medium followers
        {
          brand_id: brandId,
          campaign_id: cProtein.id,
          handle: "ankita_runs",
          platform: "Instagram",
          follower_count: 42000,
          agreed_fee: 12000,
        },
        // null followers, zero fee (completely empty optional fields)
        {
          brand_id: brandId,
          campaign_id: cProtein.id,
          handle: "gym_vikram",
          platform: "YouTube",
          follower_count: null,
          agreed_fee: 0,
        },
        // 2.5 M followers, max fee
        {
          brand_id: brandId,
          campaign_id: cProtein.id,
          handle: "fitness.king.india",
          platform: "YouTube",
          follower_count: 2500000,
          agreed_fee: 500000,
        },

        // --- Trending Now (Twitter/X) ---
        {
          brand_id: brandId,
          campaign_id: cTrending.id,
          handle: "techtalks_dev",
          platform: "Twitter/X",
          follower_count: 145000,
          agreed_fee: 25000,
        },
        {
          brand_id: brandId,
          campaign_id: cTrending.id,
          handle: "startup_watcher",
          platform: "Twitter/X",
          follower_count: 38000,
          agreed_fee: 9000,
        },

        // --- Diwali Sale (completed) ---
        {
          brand_id: brandId,
          campaign_id: cDiwali.id,
          handle: "festive_priya",
          platform: "Instagram",
          follower_count: 320000,
          agreed_fee: 45000,
        },
        {
          brand_id: brandId,
          campaign_id: cDiwali.id,
          handle: "diwali.deals",
          platform: "Instagram",
          follower_count: 85000,
          agreed_fee: 20000,
        },
        // zero fee on completed campaign
        {
          brand_id: brandId,
          campaign_id: cDiwali.id,
          handle: "barter_only_creator",
          platform: "Instagram",
          follower_count: 12000,
          agreed_fee: 0,
        },

        // --- Holi (archived) — should NOT appear in active views ---
        {
          brand_id: brandId,
          campaign_id: cHoli.id,
          handle: "holi_vibes",
          platform: "Instagram",
          follower_count: 67000,
          agreed_fee: 15000,
        },
      ])
      .select("id,handle,campaign_id")
  );

  // Map by handle for easy lookup
  const byHandle = {};
  for (const inf of influencers) byHandle[inf.handle] = inf;

  console.log("\n  Seeding utm_links…");

  await must(
    "insert utm_links",
    sb.from("utm_links").insert([
      // Summer Glow clicks — varied counts
      {
        campaign_id: cSummer.id,
        influencer_id: byHandle["priya.glam"].id,
        full_url: `https://glowlab.in/summer?utm_source=instagram&utm_medium=influencer&utm_campaign=summer-glow-2026&utm_content=priya.glam`,
        click_count: 312,
      },
      {
        campaign_id: cSummer.id,
        influencer_id: byHandle["micro_niche99"].id,
        full_url: `https://glowlab.in/summer?utm_source=instagram&utm_medium=influencer&utm_campaign=summer-glow-2026&utm_content=micro_niche99`,
        click_count: 1, // edge: exactly 1 click
      },
      {
        campaign_id: cSummer.id,
        influencer_id: byHandle["riya_skincare"].id,
        full_url: `https://glowlab.in/summer?utm_source=instagram&utm_medium=influencer&utm_campaign=summer-glow-2026&utm_content=riya_skincare`,
        click_count: 87,
      },
      {
        campaign_id: cSummer.id,
        influencer_id: byHandle["beauty.by.ananya"].id,
        full_url: `https://glowlab.in/summer?utm_source=instagram&utm_medium=influencer&utm_campaign=summer-glow-2026&utm_content=beauty.by.ananya`,
        click_count: 1540,
      },
      {
        campaign_id: cSummer.id,
        influencer_id: byHandle["divya_mega"].id,
        full_url: `https://glowlab.in/summer?utm_source=instagram&utm_medium=influencer&utm_campaign=summer-glow-2026&utm_content=divya_mega`,
        click_count: 10250, // large click count
      },
      // sunita_exactly1k — no UTM link → shows 0 clicks

      // Protein Push clicks
      {
        campaign_id: cProtein.id,
        influencer_id: byHandle["fit_rohan"].id,
        full_url: `https://glowlab.in/protein?utm_source=youtube&utm_medium=influencer&utm_campaign=protein-push-q2&utm_content=fit_rohan`,
        click_count: 204,
      },
      {
        campaign_id: cProtein.id,
        influencer_id: byHandle["ankita_runs"].id,
        full_url: `https://glowlab.in/protein?utm_source=instagram&utm_medium=influencer&utm_campaign=protein-push-q2&utm_content=ankita_runs`,
        click_count: 45,
      },
      {
        campaign_id: cProtein.id,
        influencer_id: byHandle["fitness.king.india"].id,
        full_url: `https://glowlab.in/protein?utm_source=youtube&utm_medium=influencer&utm_campaign=protein-push-q2&utm_content=fitness.king.india`,
        click_count: 0, // edge: UTM link exists but 0 clicks
      },
      // gym_vikram — no UTM link → shows 0

      // Trending Now
      {
        campaign_id: cTrending.id,
        influencer_id: byHandle["techtalks_dev"].id,
        full_url: `https://glowlab.in/trending?utm_source=twitter&utm_medium=influencer&utm_campaign=trending-now-q2&utm_content=techtalks_dev`,
        click_count: 542,
      },
      // startup_watcher — no UTM link

      // Diwali (completed)
      {
        campaign_id: cDiwali.id,
        influencer_id: byHandle["festive_priya"].id,
        full_url: `https://glowlab.in/diwali?utm_source=instagram&utm_medium=influencer&utm_campaign=diwali-sale-2025&utm_content=festive_priya`,
        click_count: 3820,
      },
      {
        campaign_id: cDiwali.id,
        influencer_id: byHandle["diwali.deals"].id,
        full_url: `https://glowlab.in/diwali?utm_source=instagram&utm_medium=influencer&utm_campaign=diwali-sale-2025&utm_content=diwali.deals`,
        click_count: 991,
      },
      // barter_only_creator — no UTM link, 0 fee

      // Holi (archived)
      {
        campaign_id: cHoli.id,
        influencer_id: byHandle["holi_vibes"].id,
        full_url: `https://glowlab.in/holi?utm_source=instagram&utm_medium=influencer&utm_campaign=holi-sprint&utm_content=holi_vibes`,
        click_count: 220,
      },
    ])
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Influro seed script\n");

  // 1. Wipe existing test users so re-runs are clean
  console.log("Cleaning up old test users…");
  const { data: existing } = await sb.auth.admin.listUsers();
  const testEmails = TEST_USERS.map((u) => u.email);
  for (const user of existing?.users ?? []) {
    if (testEmails.includes(user.email)) {
      await sb.auth.admin.deleteUser(user.id);
      console.log(`  deleted ${user.email}`);
    }
  }

  // 2. Create users
  console.log("\nCreating test users…");
  const createdUsers = {};
  for (const spec of TEST_USERS) {
    const { data, error } = await sb.auth.admin.createUser({
      email: spec.email,
      password: spec.password,
      email_confirm: true,
    });
    if (error) {
      console.error(`  ✗ ${spec.email}:`, error.message);
      process.exit(1);
    }
    ok(spec.email, null);
    createdUsers[spec.label] = data.user;
  }

  // 3. Create brands for users that have one
  console.log("\nCreating brands…");
  for (const spec of TEST_USERS) {
    if (!spec.brand) {
      console.log(`  skipping ${spec.email} (no brand — onboarding user)`);
      continue;
    }
    const userId = createdUsers[spec.label].id;
    const { data: brand, error } = await sb
      .from("brands")
      .insert({ user_id: userId, ...spec.brand })
      .select("id,name")
      .single();
    if (error) {
      console.error(`  ✗ brand for ${spec.email}:`, error.message);
      process.exit(1);
    }
    ok(`brand "${brand.name}" for ${spec.email}`, null);
    createdUsers[spec.label].brandId = brand.id;
  }

  // 4. Seed full edge-case data for demo user
  console.log("\nSeeding demo user data (edge cases)…");
  await seedDemoUser(
    createdUsers["demo"].id,
    createdUsers["demo"].brandId
  );

  // 5. empty user — brand exists, NO campaigns (tests empty state on /campaigns)
  console.log("\nEmpty user: no extra data needed (brand exists, no campaigns).");

  console.log("\nDone. Summary:");
  console.log("  demo@influro.test    — 7 campaigns, 16 influencers, 12 utm_links, all edge cases");
  console.log("  empty@influro.test   — brand exists, 0 campaigns (empty state)");
  console.log("  newuser@influro.test — no brand (lands on /onboarding)");
  console.log("\nSee src/tests/seed/TEST_CREDENTIALS.md for login details.");
}

main().catch((err) => {
  console.error("\nFatal:", err.message);
  process.exit(1);
});
