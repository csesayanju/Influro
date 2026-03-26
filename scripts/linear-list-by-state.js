// List Tech team issues in a workflow state. Usage: node scripts/linear-list-by-state.js "Todo"
require("dotenv").config();
const LINEAR_API_KEY = process.env.LINEAR_API_KEY;
const TEAM_ID = process.env.TEAM_ID;
const fetch = (...args) => import("node-fetch").then(({ default: f }) => f(...args));
const GQL = "https://api.linear.app/graphql";

async function main() {
  const stateName = process.argv[2] || "Todo";
  if (!LINEAR_API_KEY || !TEAM_ID) {
    console.error("Set LINEAR_API_KEY and TEAM_ID in .env");
    process.exit(1);
  }
  const res = await fetch(GQL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: LINEAR_API_KEY },
    body: JSON.stringify({
      query: `query($teamId: String!) {
        team(id: $teamId) {
          issues(first: 200) {
            nodes { identifier title state { name } assignee { name } }
          }
        }
      }`,
      variables: { teamId: TEAM_ID },
    }),
  });
  const data = await res.json();
  if (data.errors) {
    console.error(JSON.stringify(data.errors, null, 2));
    process.exit(1);
  }
  const nodes = data.data.team.issues.nodes.filter(
    (i) => i.state && i.state.name === stateName
  );
  nodes.sort((a, b) => a.identifier.localeCompare(b.identifier));
  if (!nodes.length) {
    console.log(`No issues in "${stateName}".`);
    const all = data.data.team.issues.nodes.map((i) => i.state?.name).filter(Boolean);
    const uniq = [...new Set(all)].sort();
    console.log("States seen on team issues:", uniq.join(", "));
    return;
  }
  for (const i of nodes) {
    const who = i.assignee ? ` (@${i.assignee.name})` : "";
    console.log(`${i.identifier} — ${i.title}${who}`);
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
