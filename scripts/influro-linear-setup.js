// ─────────────────────────────────────────────────────────────────
//  Influro — Linear API Setup Script
//  Creates: 16 cycles + labels + 41 issues in your Tech team
//
//  Usage:
//    1. npm install node-fetch dotenv   (only needed once)
//    2. Copy .env.example to .env and set LINEAR_API_KEY + TEAM_ID
//       Or run: node scripts/influro-linear-setup.js --get-team-id to find TEAM_ID
//    3. node scripts/influro-linear-setup.js
// ─────────────────────────────────────────────────────────────────

require("dotenv").config();

// Prefer env vars (from .env or shell) so you don't commit secrets. Or set LINEAR_API_KEY + TEAM_ID in .env (add dotenv and .env to .gitignore).
const LINEAR_API_KEY = process.env.LINEAR_API_KEY || "YOUR_LINEAR_API_KEY";  // Settings → API → Personal API keys
const TEAM_ID        = process.env.TEAM_ID        || "YOUR_TEAM_ID";          // Run with --get-team-id to list teams

// ─── HOW TO FIND YOUR TEAM ID ────────────────────────────────────
// Run this first if you don't know your team ID:
//   node scripts/influro-linear-setup.js --get-team-id
// It will print all your workspace teams and their IDs.
// ─────────────────────────────────────────────────────────────────

const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

const GQL = "https://api.linear.app/graphql";

async function query(q, vars = {}) {
  const res = await fetch(GQL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": LINEAR_API_KEY },
    body: JSON.stringify({ query: q, variables: vars }),
  });
  const data = await res.json();
  if (data.errors) {
    console.error("GraphQL error:", JSON.stringify(data.errors, null, 2));
    throw new Error(data.errors[0].message);
  }
  return data.data;
}

// ── ISSUES DATA ──────────────────────────────────────────────────
// Priority: 0=No priority, 1=Urgent, 2=High, 3=Medium, 4=Low

const ISSUES = [
  // Week 1
  { title: "Bootstrap Next.js 14 + TypeScript + Tailwind + Supabase client", priority: 1, estimate: 2, week: 1, labels: ["setup"],
    description: "Use create-next-app with TypeScript template. Install supabase-js and tailwindcss. Push initial commit to github.com/csesayanju/influro. Add .env.local with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY." },
  { title: "Write DB schema: brands, campaigns, influencers, utm_links, click_events, conversions, fraud_scores", priority: 1, estimate: 3, week: 1, labels: ["database"],
    description: "Create schema.sql with all tables, foreign keys, and indexes. Do not apply yet — review first. Reference: Technical Deck Slide 11 for full table list and relationships." },
  { title: "Configure GitHub repo: branch protection + PR template + commit convention", priority: 2, estimate: 1, week: 1, labels: ["setup"],
    description: "Protect main branch — require PR even when solo. Add .github/pull_request_template.md. Commit convention: feat:, fix:, chore:. Add issue templates for bug and feature." },
  { title: "Connect Vercel: preview deploy per PR", priority: 2, estimate: 1, week: 1, labels: ["infra"],
    description: "Connect GitHub repo to Vercel free tier. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY as environment variables. Every PR should get a preview URL before merging to main." },

  // Week 2
  { title: "Apply schema to Supabase + enable RLS on all tables", priority: 1, estimate: 3, week: 2, labels: ["database","security"],
    description: "Create Supabase project (free tier). Run schema.sql via SQL editor. Write RLS policies: brands can only read/write their own rows. Test policies with Supabase table editor before wiring any UI." },
  { title: "Auth: Supabase email/password + Google OAuth — full flow end to end", priority: 1, estimate: 3, week: 2, labels: ["auth"],
    description: "Wire auth-mockup.jsx to real Supabase Auth. Enable Google OAuth provider in Supabase dashboard. On new user → redirect to /onboarding/wizard. On returning user → redirect to /dashboard. Test both sign-up and sign-in paths." },
  { title: "Onboarding wizard (3 steps) — writes to brands table on finish", priority: 2, estimate: 3, week: 2, labels: ["onboarding"],
    description: "Step 1: brand name, website, category. Step 2: campaign goals multi-select. Step 3: platforms + monthly budget. On finish, INSERT into brands table. Redirect to /dashboard. Use auth-mockup.jsx as visual reference. Test 10 times yourself." },

  // Week 3
  { title: "Campaign CRUD: create, list, edit, archive", priority: 2, estimate: 3, week: 3, labels: ["campaigns"],
    description: "Fields: name, budget (₹), start_date, end_date, platform, status (draft/active/completed). Write to campaigns table. List view on /dashboard as cards. Keep UI minimal — name and budget visible at a glance." },
  { title: "Influencer CRUD: add, list, edit per campaign", priority: 2, estimate: 3, week: 3, labels: ["influencers"],
    description: "Fields: handle, platform, follower_count, agreed_fee (₹). Manual entry only — no API calls yet. Write to influencers table. Show in campaign detail page as a table. Add/edit via modal." },
  { title: "Basic /dashboard layout: campaign list + empty state", priority: 3, estimate: 2, week: 3, labels: ["ui"],
    description: "Main dashboard shows list of campaigns with status badges and budget. Empty state: 'Create your first campaign →' with action button. This is what every new brand sees first — make it clear what to do next." },

  // Week 4
  { title: "generateUTMLink() Edge Function — returns full UTM URL per influencer", priority: 1, estimate: 4, week: 4, labels: ["utm","edge-function"],
    description: "Supabase Edge Function (Deno runtime). Takes campaign_id + influencer_id. Builds URL: utm_source=<platform>, utm_medium=influencer, utm_campaign=<campaign.slug>, utm_content=<influencer_id>. Stores in utm_links table. Returns full URL. See Technical Deck Slide 4." },
  { title: "UTM link UI: assign influencer → auto-generate → copy button", priority: 2, estimate: 2, week: 4, labels: ["utm","ui"],
    description: "In campaign detail: 'Generate tracking link' button per influencer row. Calls Edge Function. Displays full URL with copy-to-clipboard. Shows click_count badge once tracking starts." },
  { title: "Click tracking middleware: UTM hit → click_events INSERT + session cookie", priority: 1, estimate: 4, week: 4, labels: ["tracking","middleware"],
    description: "Next.js middleware.ts intercepts requests with utm_content param. Writes to click_events: utm_link_id, session_id (uuid), ip_hash, user_agent, timestamp, country. Sets httpOnly influro_sid cookie (30-day). Atomically increments utm_links.click_count. See Technical Deck Slide 5." },
  { title: "Clicks view: per influencer click count visible on campaign dashboard", priority: 3, estimate: 2, week: 4, labels: ["ui","tracking"],
    description: "Add clicks today + clicks total columns to influencer table in campaign detail. Pulls from utm_links.click_count. Gives brands something real to look at before conversions are tracked." },

  // Week 5
  { title: "Razorpay test account + webhook endpoint with HMAC verification", priority: 1, estimate: 2, week: 5, labels: ["razorpay","webhook"],
    description: "Create Razorpay test account. Create route POST /api/webhooks/razorpay. Immediately implement HMAC-SHA256 signature verification — reject with 401 on mismatch. Add RAZORPAY_KEY_SECRET to env. Security before functionality." },
  { title: "Webhook handler: session lookup → conversions INSERT", priority: 1, estimate: 4, week: 5, labels: ["razorpay","webhook"],
    description: "Parse payment.captured event. Extract notes.influro_session. SELECT from click_events WHERE session_id matches. INSERT into conversions: utm_link_id, influencer_id, payment_id (UNIQUE), amount_paise, converted_at. ON CONFLICT (payment_id) DO NOTHING. Respond 200 within 5s. See Technical Deck Slide 6." },
  { title: "Idempotency test: fire same webhook twice → only one conversion row", priority: 1, estimate: 1, week: 5, labels: ["testing","razorpay"],
    description: "Using Razorpay test dashboard, fire identical payment.captured payload twice. Confirm: only one row in conversions table. This is a correctness test, not optional. Do not proceed to Week 6 until this passes." },

  // Week 6
  { title: "campaign_stats materialized view: revenue, ROAS, conversions per influencer", priority: 1, estimate: 3, week: 6, labels: ["database","analytics"],
    description: "SQL materialized view joining conversions + utm_links + influencers. Columns: influencer_id, handle, total_conversions, revenue_inr, roas (revenue/agreed_fee), cost_per_conversion. Refresh after each webhook. See Technical Deck Slide 7." },
  { title: "ROI dashboard: 4 KPI cards — revenue, ROAS, conversions, fraud flags", priority: 2, estimate: 3, week: 6, labels: ["dashboard","analytics"],
    description: "Cards: (1) Total revenue ₹. (2) ROAS. (3) Conversion count. (4) Fraud flag count. Powered by campaign_stats view. 4 numbers only — resist adding more until alpha is in front of real users." },
  { title: "Influencer ranking bar chart: revenue attributed per influencer", priority: 3, estimate: 2, week: 6, labels: ["dashboard","analytics"],
    description: "Horizontal bar chart sorted by revenue descending. Green = ROAS > 2x, amber = 1–2x, red = < 1x or fraud flagged. Use Recharts. Powered by campaign_stats view." },

  // Week 7
  { title: "Edge case: cookie loss — probabilistic match on ip+user_agent hash", priority: 2, estimate: 3, week: 7, labels: ["reliability","tracking"],
    description: "If webhook fires but influro_session has no match: attempt probabilistic match using hash(ip + user_agent + date). If confidence > 80% attribute to that influencer. Otherwise log as unattributed. See Technical Deck Slide 10." },
  { title: "Edge case: multi-touch last-click attribution", priority: 2, estimate: 2, week: 7, labels: ["tracking","attribution"],
    description: "If user clicked 3 influencer links before buying, credit the LAST utm_content seen. Full click chain stored in click_events — do not delete earlier clicks. Attribution: ORDER BY timestamp DESC LIMIT 1 when looking up session." },
  { title: "Edge case: missing UTM — flag as untracked organic + alert brand", priority: 3, estimate: 2, week: 7, labels: ["tracking","reliability"],
    description: "If request has instagram.com or youtube.com referrer but no utm_content: write to click_events as source=untracked-organic, no utm_link_id. Show alert on dashboard: 'X clicks came without a tracking link.'" },
  { title: "Sentry error monitoring: frontend + webhook handler", priority: 2, estimate: 2, week: 7, labels: ["monitoring","infra"],
    description: "Install @sentry/nextjs. Configure client and server. Critical: add Sentry.captureException() in webhook handler try/catch — silent failures must surface. Free tier: 5K errors/month. Set up alert for new issues." },

  // Week 8
  { title: "Full end-to-end test: 5 scenarios — normal, cookie lost, multi-touch, duplicate webhook, no UTM", priority: 1, estimate: 3, week: 8, labels: ["testing"],
    description: "Run all 5 scenarios to completion. (1) Normal flow. (2) Cookie cleared before purchase. (3) Two influencer links clicked before buying. (4) Same webhook fired twice. (5) Purchase with no UTM params. All must behave correctly. Gate: do not mark alpha ready until all 5 pass." },
  { title: "Alpha readiness checklist: all 6 core flows verified green", priority: 1, estimate: 2, week: 8, labels: ["testing","milestone"],
    description: "Checklist: (1) Sign up + onboarding. (2) Campaign + influencer create. (3) UTM link generates. (4) Click tracked + stored. (5) Razorpay webhook fires + conversion recorded. (6) Dashboard shows correct revenue + ROAS. All 6 green = alpha ready to show humans." },
  { title: "Fraud scoring v1: engagement rate + comment quality + growth velocity", priority: 2, estimate: 5, week: 8, labels: ["fraud"],
    description: "Three weighted signals: (1) ER vs follower count — flag ER < 1% or > 20%. (2) Comment keyword scoring — bot comments scored 0–1. (3) Follower growth velocity — spike > 15% in 48h flagged. Output bot_score 0.0–1.0, store in fraud_scores. See Technical Deck Slide 8." },

  // Week 9
  { title: "Fraud score weekly refresh — pg_cron Edge Function", priority: 2, estimate: 3, week: 9, labels: ["fraud","cron"],
    description: "Supabase Edge Function triggered by pg_cron every Sunday 6am IST. Recalculates bot_score for all influencers active in last 30 days. Updates fraud_scores.score + refreshed_at. Show stale badge (>7 days) on dashboard." },
  { title: "Fraud badge UI: green / amber / red per influencer with signal breakdown modal", priority: 2, estimate: 2, week: 9, labels: ["fraud","ui"],
    description: "Green if bot_score < 0.25. Amber if 0.25–0.60. Red if > 0.60. Tooltip showing estimated bot %. 'View fraud report' modal with ER score, comment score, growth score breakdown. Most shareable feature in the product." },

  // Week 10
  { title: "YouTube Data API v3: subscriber count + avg views for fraud scoring", priority: 2, estimate: 4, week: 10, labels: ["youtube","integration"],
    description: "Google Cloud project + YouTube Data API v3 key. For influencers with platform=youtube: fetch subscriber_count, avg_views_per_video (last 10 videos), comment samples. Feed into fraud scoring. Free: 10K units/day. Store raw stats in influencers.platform_data (jsonb)." },
  { title: "Campaign comparison view: side-by-side ROAS and spend", priority: 3, estimate: 3, week: 10, labels: ["analytics","ui"],
    description: "Select 2+ campaigns to compare side by side: total spend, revenue, ROAS, best/worst influencer handle, fraud flag count. Key question it answers: 'Did our October campaign beat September?'" },

  // Week 11
  { title: "CSV + PDF campaign report export", priority: 3, estimate: 3, week: 11, labels: ["export"],
    description: "Export button on campaign detail. CSV: all influencer rows with clicks, conversions, revenue, ROAS, bot_score. PDF: 1-page branded summary with KPI numbers and top/bottom performers. Use jsPDF or react-pdf." },
  { title: "Mobile responsive: all pages work at 390px width", priority: 2, estimate: 3, week: 11, labels: ["ui","responsive"],
    description: "Test every page at 390px (iPhone 14). Fix dashboard, campaign list, influencer table, UTM link page, onboarding wizard. Founders check dashboards on phones. Must be done before showing alpha to any real user." },

  // Week 12
  { title: "Empty states, loading states, error states on all pages", priority: 3, estimate: 3, week: 12, labels: ["ui","ux"],
    description: "Loading: skeleton shimmer. Empty: clear message + CTA button ('Create your first campaign →'). Error: 'Something went wrong' + retry. Every page needs all 3 states. A blank white screen is not a product." },
  { title: "Onboarding checklist: 4 steps from signup to first tracked sale", priority: 3, estimate: 2, week: 12, labels: ["onboarding","ux"],
    description: "Persistent checklist card for new brands: (1) Complete brand setup. (2) Create a campaign. (3) Add influencer + generate UTM link. (4) Share link + see first tracked sale. Each step has a direct action button. Disappears once all 4 complete." },
  { title: "Fraud alert email: real-time trigger when bot_score > 0.6", priority: 2, estimate: 2, week: 12, labels: ["email","fraud"],
    description: "Trigger when fraud_scores updated and bot_score crosses 0.6 for influencer in active campaign. Email via Resend (free: 3K/month): 'Warning: @handle has estimated 71% bot audience. You have not paid them yet.' Highest-value notification in the product." },
  { title: "Internal alpha runbook: webhook failure + Supabase down + wrong fraud score", priority: 3, estimate: 2, week: 12, labels: ["reliability","ops"],
    description: "3 failure scenarios with step-by-step resolution. (1) Webhook fails silently → check Sentry → replay from Razorpay dashboard. (2) Supabase incident → status.supabase.com → communicate ETA. (3) Wrong fraud score → manual override + recalculate endpoint. For you at 2am." },

  // Week 13
  { title: "Weekly Monday ROI digest email per brand", priority: 2, estimate: 3, week: 13, labels: ["email","notifications"],
    description: "Supabase Edge Function + Resend. Every Monday 8am IST per brand: campaign summary, ₹ revenue tracked, ROAS, top influencer, fraud alert count. Plain text + one data table. Brand must be able to forward this to their CEO as-is." },

  // Week 15
  { title: "Razorpay Subscriptions: build billing page for 3 plans — do NOT activate", priority: 1, estimate: 5, week: 15, labels: ["billing","razorpay"],
    description: "Integrate Razorpay Subscriptions API. Plans: Starter ₹2,999/mo (3 campaigns, 15 influencers), Growth ₹7,999/mo (unlimited campaigns), Pro ₹19,999/mo (white-label + export API). Build /billing page with plan cards. Test with ₹1 test transactions. Activation gate: 5 alpha users confirm they will pay." },

  // Week 16
  { title: "Plan limits enforcement: campaigns + influencer count per tier", priority: 2, estimate: 3, week: 16, labels: ["billing"],
    description: "Starter: max 3 campaigns, 15 influencers. Growth: unlimited. Pro: unlimited + white_label flag. Check limits on create — show upgrade prompt when limit hit. Gate features by plan in middleware. Do not enforce until billing is activated." },
  { title: "Pricing page: /pricing with plan comparison table", priority: 3, estimate: 2, week: 16, labels: ["billing","ui"],
    description: "Public /pricing page. Three columns: Starter / Growth / Pro. Rows: price, campaigns, influencers, platforms, fraud detection, export, white-label. CTA per plan. Make the value difference obvious — especially why Growth is worth 2.7x Starter." },
];

// ── WEEK → CYCLE DATES (starting from today, Monday alignment) ──
function getCycleDates(weekNum) {
  const base = new Date();
  // Align to next Monday
  const day = base.getDay();
  const daysToMonday = day === 0 ? 1 : (8 - day) % 7 || 7;
  base.setDate(base.getDate() + daysToMonday);
  base.setHours(0, 0, 0, 0);

  const start = new Date(base);
  start.setDate(start.getDate() + (weekNum - 1) * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  return {
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
  };
}

// ── MAIN ──────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);

  // Helper mode: print team IDs
  if (args.includes("--get-team-id")) {
    console.log("\nFetching your Linear teams...\n");
    const data = await query(`{ teams { nodes { id name key } } }`);
    console.log("Your teams:");
    data.teams.nodes.forEach(t => {
      console.log(`  Name: ${t.name}`);
      console.log(`  ID:   ${t.id}`);
      console.log(`  Key:  ${t.key}`);
      console.log();
    });
    console.log('Copy the ID of your "Tech" team and paste it as TEAM_ID at the top of this script.');
    return;
  }

  if (LINEAR_API_KEY === "YOUR_LINEAR_API_KEY") {
    console.error("\n ERROR: Replace YOUR_LINEAR_API_KEY at the top of this script.");
    console.error(" Get it from: Linear → Settings → API → Personal API keys\n");
    process.exit(1);
  }
  if (TEAM_ID === "YOUR_TEAM_ID") {
    console.error("\n ERROR: Replace YOUR_TEAM_ID at the top of this script.");
    console.error(" Run first:  node scripts/influro-linear-setup.js --get-team-id\n");
    process.exit(1);
  }

  console.log("\n Influro Linear Setup");
  console.log(" ─────────────────────────────────────");

  // Step 1: Get workflow states for this team
  console.log("\n[1/4] Fetching workflow states...");
  const statesData = await query(`
    query($teamId: String!) {
      team(id: $teamId) { states { nodes { id name } } }
    }`, { teamId: TEAM_ID });
  const states = statesData.team.states.nodes;
  const todoState = states.find(s => s.name.toLowerCase().includes("todo") || s.name.toLowerCase().includes("backlog"));
  if (!todoState) throw new Error("Could not find a Todo/Backlog state. Check your team workflow states in Linear.");
  console.log(`   Using state: "${todoState.name}" (${todoState.id})`);

  // Step 2: Create or fetch labels
  console.log("\n[2/4] Creating labels...");
  const allLabels = [...new Set(ISSUES.flatMap(i => i.labels))];
  const labelMap = {};

  const labelsData = await query(`
    query($teamId: String!) {
      team(id: $teamId) { labels { nodes { id name } } }
    }`, { teamId: TEAM_ID });
  const existingLabels = labelsData.team.labels.nodes;

  const LABEL_COLORS = {
    setup: "#58A6FF", database: "#8957E5", security: "#F85149",
    auth: "#3FB950", onboarding: "#D29922", campaigns: "#58A6FF",
    influencers: "#BC8CFF", ui: "#79C0FF", utm: "#3FB950",
    "edge-function": "#8957E5", tracking: "#D29922", middleware: "#F85149",
    razorpay: "#3FB950", webhook: "#58A6FF", testing: "#BC8CFF",
    analytics: "#79C0FF", dashboard: "#3FB950", reliability: "#F85149",
    attribution: "#D29922", monitoring: "#58A6FF", infra: "#8957E5",
    milestone: "#F85149", fraud: "#F85149", cron: "#D29922",
    youtube: "#BC8CFF", integration: "#79C0FF", export: "#3FB950",
    responsive: "#58A6FF", ux: "#BC8CFF", email: "#79C0FF",
    notifications: "#58A6FF", billing: "#3FB950", ops: "#D29922",
  };

  for (const name of allLabels) {
    const existing = existingLabels.find(l => l.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      labelMap[name] = existing.id;
      process.stdout.write(`   • ${name} (existing)\n`);
    } else {
      const color = LABEL_COLORS[name] || "#58A6FF";
      const res = await query(`
        mutation($teamId: String!, $name: String!, $color: String!) {
          issueLabelCreate(input: { teamId: $teamId, name: $name, color: $color }) {
            issueLabel { id name }
          }
        }`, { teamId: TEAM_ID, name, color });
      labelMap[name] = res.issueLabelCreate.issueLabel.id;
      process.stdout.write(`   • ${name} (created)\n`);
    }
  }

  // Step 3: Create 16 cycles
  console.log("\n[3/4] Creating 16 weekly cycles...");
  const cycleMap = {};

  // Check existing cycles
  const cyclesData = await query(`
    query($teamId: String!) {
      team(id: $teamId) { cycles { nodes { id name } } }
    }`, { teamId: TEAM_ID });
  const existingCycles = cyclesData.team.cycles.nodes;

  for (let w = 1; w <= 16; w++) {
    const name = `Week ${w}`;
    const existing = existingCycles.find(c => c.name === name);
    if (existing) {
      cycleMap[w] = existing.id;
      process.stdout.write(`   • ${name} (existing)\n`);
    } else {
      const { startsAt, endsAt } = getCycleDates(w);
      const res = await query(`
        mutation($teamId: String!, $name: String!, $startsAt: DateTime!, $endsAt: DateTime!) {
          cycleCreate(input: { teamId: $teamId, name: $name, startsAt: $startsAt, endsAt: $endsAt }) {
            cycle { id name }
          }
        }`, { teamId: TEAM_ID, name, startsAt, endsAt });
      cycleMap[w] = res.cycleCreate.cycle.id;
      process.stdout.write(`   • ${name} created\n`);
    }
  }

  // Step 4: Create issues
  console.log(`\n[4/4] Creating ${ISSUES.length} issues...`);
  let created = 0, failed = 0;

  for (const issue of ISSUES) {
    try {
      const labelIds = issue.labels.map(l => labelMap[l]).filter(Boolean);
      const cycleId  = cycleMap[issue.week];

      const res = await query(`
        mutation(
          $teamId: String!, $title: String!, $description: String,
          $priority: Int, $estimate: Int, $stateId: String!,
          $labelIds: [String!], $cycleId: String
        ) {
          issueCreate(input: {
            teamId: $teamId, title: $title, description: $description,
            priority: $priority, estimate: $estimate, stateId: $stateId,
            labelIds: $labelIds, cycleId: $cycleId
          }) {
            issue { id identifier title }
          }
        }`, {
        teamId:      TEAM_ID,
        title:       issue.title,
        description: issue.description,
        priority:    issue.priority,
        estimate:    issue.estimate,
        stateId:     todoState.id,
        labelIds,
        cycleId,
      });

      const { identifier } = res.issueCreate.issue;
      console.log(`   ✓ [${identifier}] ${issue.title.substring(0, 60)}...`);
      created++;

      // Small delay to respect Linear rate limits (400 req/min)
      await new Promise(r => setTimeout(r, 160));

    } catch (err) {
      console.error(`   ✗ FAILED: ${issue.title.substring(0, 50)} — ${err.message}`);
      failed++;
    }
  }

  console.log("\n ─────────────────────────────────────");
  console.log(` Done!  ${created} issues created,  ${failed} failed`);
  console.log(` Open Linear and go to your Tech team → Cycles to see everything organised.`);
  console.log(" ─────────────────────────────────────\n");
}

main().catch(err => {
  console.error("\nFatal error:", err.message);
  process.exit(1);
});
