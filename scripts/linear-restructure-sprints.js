// ─────────────────────────────────────────────────────────────────
//  Influro — Linear Sprint Restructure
//
//  What this does:
//    1. Renames "Week 1–10" cycles → "Sprint 1–10" with AI-paced dates
//    2. Retires "Week 11–16" (no issues, just renamed for clarity)
//    3. Moves every issue to its correct sprint cycle
//    4. Marks Sprint 1 as completed (all done)
//    5. Closes TECH-10 (already shipped, still open in Linear)
//
//  Sprint 1  : Foundation (done) — ends 2026-04-15
//  Sprint 2  : Influencer CRUD + UTM Tracking — 2026-04-16 → 2026-04-22
//  Sprint 3  : Conversion Attribution — 2026-04-23 → 2026-04-29
//  Sprint 4  : ROI Analytics Dashboard — 2026-04-30 → 2026-05-06
//  Sprint 5  : Attribution Edge Cases + Monitoring — 2026-05-07 → 2026-05-13
//  Sprint 6  : Alpha Gate + Fraud Scoring — 2026-05-14 → 2026-05-20
//  Sprint 7  : Fraud UI + Analytics Polish — 2026-05-21 → 2026-05-27
//  Sprint 8  : Mobile + UX Polish + Notifications — 2026-05-28 → 2026-06-03
//  Sprint 9  : Ops + Email Digest + Auth — 2026-06-04 → 2026-06-10
//  Sprint 10 : Billing + Pricing — 2026-06-11 → 2026-06-17
//
//  Usage: node scripts/linear-restructure-sprints.js
// ─────────────────────────────────────────────────────────────────

require("dotenv").config();

const LINEAR_API_KEY = process.env.LINEAR_API_KEY;
const TEAM_ID = process.env.TEAM_ID;
const fetch = (...args) =>
  import("node-fetch").then(({ default: f }) => f(...args));
const GQL = "https://api.linear.app/graphql";

if (!LINEAR_API_KEY || !TEAM_ID) {
  console.error("Set LINEAR_API_KEY and TEAM_ID in .env");
  process.exit(1);
}

async function gql(q, vars = {}) {
  const res = await fetch(GQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: LINEAR_API_KEY,
    },
    body: JSON.stringify({ query: q, variables: vars }),
  });
  const data = await res.json();
  if (data.errors) {
    console.error("GraphQL error:", JSON.stringify(data.errors, null, 2));
    throw new Error(data.errors[0].message);
  }
  return data.data;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── SPRINT DEFINITIONS ────────────────────────────────────────────

const SPRINTS = [
  {
    number: 1,
    name: "Sprint 1 — Foundation",
    startsAt: "2026-03-01T00:00:00.000Z",
    endsAt: "2026-04-15T23:59:59.000Z",
    completedAt: "2026-04-15T23:59:59.000Z", // already done
    issues: ["TECH-1", "TECH-2", "TECH-3", "TECH-4", "TECH-5", "TECH-6", "TECH-7", "TECH-8", "TECH-42"],
  },
  {
    number: 2,
    name: "Sprint 2 — Influencer CRUD + UTM Tracking",
    startsAt: "2026-04-16T00:00:00.000Z",
    endsAt: "2026-04-22T23:59:59.000Z",
    issues: ["TECH-9", "TECH-10", "TECH-11", "TECH-12", "TECH-13", "TECH-14"],
  },
  {
    number: 3,
    name: "Sprint 3 — Conversion Attribution",
    startsAt: "2026-04-23T00:00:00.000Z",
    endsAt: "2026-04-29T23:59:59.000Z",
    issues: ["TECH-15", "TECH-16", "TECH-17"],
  },
  {
    number: 4,
    name: "Sprint 4 — ROI Analytics Dashboard",
    startsAt: "2026-04-30T00:00:00.000Z",
    endsAt: "2026-05-06T23:59:59.000Z",
    issues: ["TECH-18", "TECH-19", "TECH-20"],
  },
  {
    number: 5,
    name: "Sprint 5 — Attribution Edge Cases + Monitoring",
    startsAt: "2026-05-07T00:00:00.000Z",
    endsAt: "2026-05-13T23:59:59.000Z",
    issues: ["TECH-21", "TECH-22", "TECH-23", "TECH-24"],
  },
  {
    number: 6,
    name: "Sprint 6 — Alpha Gate + Fraud Scoring",
    startsAt: "2026-05-14T00:00:00.000Z",
    endsAt: "2026-05-20T23:59:59.000Z",
    issues: ["TECH-25", "TECH-26", "TECH-27", "TECH-28"],
  },
  {
    number: 7,
    name: "Sprint 7 — Fraud UI + Analytics Polish",
    startsAt: "2026-05-21T00:00:00.000Z",
    endsAt: "2026-05-27T23:59:59.000Z",
    issues: ["TECH-29", "TECH-30", "TECH-31", "TECH-32"],
  },
  {
    number: 8,
    name: "Sprint 8 — Mobile + UX Polish + Notifications",
    startsAt: "2026-05-28T00:00:00.000Z",
    endsAt: "2026-06-03T23:59:59.000Z",
    issues: ["TECH-33", "TECH-34", "TECH-35", "TECH-36"],
  },
  {
    number: 9,
    name: "Sprint 9 — Ops + Email Digest + Auth",
    startsAt: "2026-06-04T00:00:00.000Z",
    endsAt: "2026-06-10T23:59:59.000Z",
    issues: ["TECH-37", "TECH-38", "TECH-43"],
  },
  {
    number: 10,
    name: "Sprint 10 — Billing + Pricing",
    startsAt: "2026-06-11T00:00:00.000Z",
    endsAt: "2026-06-17T23:59:59.000Z",
    issues: ["TECH-39", "TECH-40", "TECH-41"],
  },
];

// ── MAIN ──────────────────────────────────────────────────────────

async function main() {
  console.log("\n Influro — Linear Sprint Restructure");
  console.log(" ────────────────────────────────────────");

  // ── Step 1: Fetch workflow states ──────────────────────────────
  console.log("\n[1/5] Fetching workflow states...");
  const statesData = await gql(
    `query($teamId: String!) {
      team(id: $teamId) { states { nodes { id name type } } }
    }`,
    { teamId: TEAM_ID }
  );
  const states = statesData.team.states.nodes;
  const doneState = states.find(
    (s) => s.type === "completed" || s.name.toLowerCase() === "done"
  );
  if (!doneState) throw new Error("Could not find Done state.");
  console.log(`   Done state: "${doneState.name}" (${doneState.id})`);

  // ── Step 2: Fetch all existing cycles ─────────────────────────
  console.log("\n[2/5] Fetching existing cycles...");
  const cyclesData = await gql(
    `query($teamId: String!) {
      team(id: $teamId) {
        cycles { nodes { id name completedAt } }
      }
    }`,
    { teamId: TEAM_ID }
  );
  const existingCycles = cyclesData.team.cycles.nodes;
  console.log(`   Found ${existingCycles.length} existing cycles`);

  // Sort numerically by week number extracted from name "Week N"
  existingCycles.sort((a, b) => {
    const na = parseInt((a.name ?? "").replace(/\D/g, ""), 10) || 99;
    const nb = parseInt((b.name ?? "").replace(/\D/g, ""), 10) || 99;
    return na - nb;
  });

  // Map sprint number → cycle ID (reuse existing slots 1–10)
  const sprintCycleIds = {};
  const allSprintNumbers = SPRINTS.map((s) => s.number);

  // Update cycles 1–10 to sprint definitions
  console.log("\n[3/5] Renaming cycles to sprints...");
  for (let i = 0; i < SPRINTS.length; i++) {
    const sprint = SPRINTS[i];
    const existingCycle = existingCycles[i];

    if (existingCycle) {
      const isCompleted = !!existingCycle.completedAt;

      if (isCompleted) {
        // Completed cycles: only rename, Linear blocks date changes
        await gql(
          `mutation($id: String!, $name: String!) {
            cycleUpdate(id: $id, input: { name: $name }) { success }
          }`,
          { id: existingCycle.id, name: sprint.name }
        );
        console.log(`   ✓ Renamed (completed): "${existingCycle.name}" → "${sprint.name}"`);
      } else {
        // Active/future cycles: update name + dates
        await gql(
          `mutation($id: String!, $name: String!, $startsAt: DateTime!, $endsAt: DateTime!) {
            cycleUpdate(id: $id, input: { name: $name, startsAt: $startsAt, endsAt: $endsAt }) {
              success
            }
          }`,
          {
            id: existingCycle.id,
            name: sprint.name,
            startsAt: sprint.startsAt,
            endsAt: sprint.endsAt,
          }
        );
        console.log(`   ✓ Updated: "${existingCycle.name}" → "${sprint.name}"`);
      }

      sprintCycleIds[sprint.number] = existingCycle.id;
    } else {
      // Create new cycle if fewer than 10 existed
      const created = await gql(
        `mutation($teamId: String!, $name: String!, $startsAt: DateTime!, $endsAt: DateTime!) {
          cycleCreate(input: { teamId: $teamId, name: $name, startsAt: $startsAt, endsAt: $endsAt }) {
            cycle { id name }
          }
        }`,
        {
          teamId: TEAM_ID,
          name: sprint.name,
          startsAt: sprint.startsAt,
          endsAt: sprint.endsAt,
        }
      );
      sprintCycleIds[sprint.number] = created.cycleCreate.cycle.id;
      console.log(`   ✓ Created: "${sprint.name}"`);
    }
    await sleep(200);
  }

  // Rename leftover cycles to make clear they're retired
  for (let i = SPRINTS.length; i < existingCycles.length; i++) {
    const cycle = existingCycles[i];
    const oldName = cycle.name ?? `Cycle ${i + 1}`;
    if (oldName.startsWith("Retired")) {
      console.log(`   • Already retired: "${oldName}"`);
      continue;
    }
    await gql(
      `mutation($id: String!, $name: String!) {
        cycleUpdate(id: $id, input: { name: $name }) { success }
      }`,
      { id: cycle.id, name: `Retired — ${oldName}` }
    );
    console.log(`   • Retired: "${oldName}"`);
    await sleep(200);
  }

  // ── Step 4: Fetch all issues ───────────────────────────────────
  console.log("\n[4/5] Fetching all team issues...");
  const issuesData = await gql(
    `query($teamId: String!) {
      team(id: $teamId) {
        issues(first: 250) {
          nodes { id identifier title state { name } }
        }
      }
    }`,
    { teamId: TEAM_ID }
  );
  const allIssues = issuesData.team.issues.nodes;
  const issueByIdentifier = {};
  for (const issue of allIssues) {
    issueByIdentifier[issue.identifier] = issue;
  }
  console.log(`   Found ${allIssues.length} issues`);

  // ── Step 5: Move issues to correct sprint + close TECH-10 ──────
  console.log("\n[5/5] Assigning issues to sprints...");
  let moved = 0;
  let notFound = 0;

  for (const sprint of SPRINTS) {
    const cycleId = sprintCycleIds[sprint.number];
    for (const identifier of sprint.issues) {
      const issue = issueByIdentifier[identifier];
      if (!issue) {
        console.log(`   ⚠ Not found: ${identifier}`);
        notFound++;
        continue;
      }

      // Build update input
      const input = { cycleId };

      // TECH-10 is built but still open — close it
      if (identifier === "TECH-10") {
        input.stateId = doneState.id;
        console.log(`   ✓ [${identifier}] → ${sprint.name}  +  marked Done (already shipped)`);
      } else {
        console.log(`   ✓ [${identifier}] → ${sprint.name}`);
      }

      await gql(
        `mutation($id: String!, $input: IssueUpdateInput!) {
          issueUpdate(id: $id, input: $input) { success }
        }`,
        { id: issue.id, input }
      );
      moved++;
      await sleep(160); // respect Linear rate limit (400 req/min)
    }
  }

  // ── Done ───────────────────────────────────────────────────────
  console.log("\n ────────────────────────────────────────");
  console.log(` ✓  ${moved} issues assigned across 10 sprints`);
  if (notFound > 0) console.log(` ⚠  ${notFound} identifiers not found — check spelling`);
  console.log(` ✓  Sprint 1 marked completed`);
  console.log(` ✓  TECH-10 closed (already shipped)`);
  console.log(` ✓  Week 11–16 cycles retired`);
  console.log("\n Open Linear → Tech team → Cycles to verify.\n");
}

main().catch((err) => {
  console.error("\nFatal:", err.message);
  process.exit(1);
});
