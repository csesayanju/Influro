// Move a Linear issue to the next state and assign to the API key owner (you).
// Usage: node linear-move-issue.js TECH-3 [stateName]
// Example: node linear-move-issue.js TECH-3 "In Progress"
// If stateName is omitted, uses "In Progress" (or "In Review" if you want it in review).

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
  if (data.errors) {
    console.error("GraphQL error:", JSON.stringify(data.errors, null, 2));
    throw new Error(data.errors[0].message);
  }
  return data.data;
}

async function main() {
  const identifier = process.argv[2] || "TECH-3";
  const targetStateName = process.argv[3] || "In Progress";

  if (!LINEAR_API_KEY || LINEAR_API_KEY === "YOUR_LINEAR_API_KEY") {
    console.error("Set LINEAR_API_KEY in .env");
    process.exit(1);
  }
  if (!TEAM_ID || TEAM_ID === "YOUR_TEAM_ID") {
    console.error("Set TEAM_ID in .env");
    process.exit(1);
  }

  // 1) Viewer (you) = assignee
  const viewerData = await query(`query { viewer { id name } }`);
  const viewer = viewerData.viewer;
  console.log("Assignee:", viewer.name, "(" + viewer.id + ")");

  // 2) Team workflow states
  const statesData = await query(`
    query($teamId: String!) {
      team(id: $teamId) { states { nodes { id name } } }
    }`, { teamId: TEAM_ID });
  const states = statesData.team.states.nodes;
  const targetState = states.find(s => s.name === targetStateName);
  if (!targetState) {
    console.error("State not found:", targetStateName);
    console.log("Available:", states.map(s => s.name).join(", "));
    process.exit(1);
  }

  // 3) Find issue by identifier (e.g. TECH-3)
  const issuesData = await query(`
    query($teamId: String!) {
      team(id: $teamId) { issues(first: 100) { nodes { id identifier title } } }
    }`, { teamId: TEAM_ID });
  const issue = issuesData.team.issues.nodes.find(i => i.identifier === identifier);
  if (!issue) {
    console.error("Issue not found:", identifier);
    process.exit(1);
  }
  console.log("Issue:", issue.identifier, issue.title);

  // 4) Update: set state and assignee
  await query(`
    mutation($id: String!, $stateId: String!, $assigneeId: String!) {
      issueUpdate(id: $id, input: { stateId: $stateId, assigneeId: $assigneeId }) {
        issue { id identifier state { name } assignee { name } }
      }
    }`, { id: issue.id, stateId: targetState.id, assigneeId: viewer.id });

  console.log("Updated:", identifier, "→", targetStateName, "| assigned to", viewer.name);
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
