// List Tech team issues in "In Progress". Usage: node scripts/linear-list-in-progress.js
require("dotenv").config();
const LINEAR_API_KEY = process.env.LINEAR_API_KEY;
const TEAM_ID = process.env.TEAM_ID;
const fetch = (...args) => import("node-fetch").then(({ default: f }) => f(...args));
const GQL = "https://api.linear.app/graphql";

async function main() {
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
    (i) => i.state && i.state.name === "In Progress"
  );
  nodes.sort((a, b) => a.identifier.localeCompare(b.identifier));
  if (!nodes.length) {
    console.log("No issues in **In Progress**.");
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
