// Create a single issue in Linear (Tech team).
// Usage: node linear-create-issue.js "Title" "Description"
// Or with optional label: node linear-create-issue.js "Title" "Description" "setup"

require("dotenv").config();
const LINEAR_API_KEY = process.env.LINEAR_API_KEY;
const TEAM_ID = process.env.TEAM_ID;

const fetch = (...args) => import("node-fetch").then(({ default: f }) => f(...args));
const GQL = "https://api.linear.app/graphql";

async function query(q, vars = {}) {
  const res = await fetch(GQL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": LINEAR_API_KEY },
    body: JSON.stringify({ query: q, variables: vars }),
  });
  const data = await res.json();
  if (data.errors) throw new Error(data.errors[0].message);
  return data.data;
}

async function main() {
  const title = process.argv[2] || "Restructure repo into proper folders for organization";
  const description = process.argv[3] || `Restructure the repository into a clear folder layout so app code, config, scripts, and docs are organised and easy to navigate.

**Suggested structure (adjust as needed):**
- \`app/\` — Next.js App Router (already present)
- \`lib/\` or \`src/lib/\` — shared utilities, Supabase client
- \`components/\` — React components
- \`scripts/\` or \`tools/\` — Linear setup, move-issue, and other one-off scripts (move influro-linear-setup.js, linear-move-issue.js here)
- \`docs/\` — COMMIT_CONVENTION.md, or keep at root
- Keep \`.github/\`, config files (next.config, tsconfig, tailwind), and root README at root

**Acceptance:** Clear separation of app vs scripts vs config; no breaking changes to Next.js build or run.`;
  const labelName = process.argv[4] || "setup";

  if (!LINEAR_API_KEY || !TEAM_ID) {
    console.error("Set LINEAR_API_KEY and TEAM_ID in .env");
    process.exit(1);
  }

  const statesData = await query(`
    query($teamId: String!) {
      team(id: $teamId) { states { nodes { id name } } }
    }`, { teamId: TEAM_ID });
  const todoState = statesData.team.states.nodes.find(
    (s) => s.name.toLowerCase().includes("todo") || s.name.toLowerCase().includes("backlog")
  );
  if (!todoState) throw new Error("No Todo/Backlog state found");

  let labelId = null;
  const labelsData = await query(`
    query($teamId: String!) {
      team(id: $teamId) { labels { nodes { id name } } }
    }`, { teamId: TEAM_ID });
  const label = labelsData.team.labels.nodes.find((l) => l.name.toLowerCase() === labelName.toLowerCase());
  if (label) labelId = label.id;

  const viewerData = await query(`query { viewer { id name } }`);
  const assigneeId = viewerData.viewer.id;

  const res = await query(`
    mutation($teamId: String!, $title: String!, $description: String, $stateId: String!, $labelIds: [String!], $assigneeId: String) {
      issueCreate(input: {
        teamId: $teamId, title: $title, description: $description,
        stateId: $stateId, labelIds: $labelIds, assigneeId: $assigneeId
      }) {
        issue { id identifier title assignee { name } }
      }
    }`, {
    teamId: TEAM_ID,
    title,
    description,
    stateId: todoState.id,
    labelIds: labelId ? [labelId] : [],
    assigneeId,
  });

  const issue = res.issueCreate.issue;
  console.log(`Created: ${issue.identifier} — ${issue.title}`);
  console.log(`Assignee: ${issue.assignee?.name || "—"}`);
  console.log(`URL: https://linear.app (open team → ${issue.identifier})`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
