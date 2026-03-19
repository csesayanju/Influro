# Scripts

Run from **repo root** (so `.env` is found):

| Script | Purpose |
|--------|--------|
| `node scripts/influro-linear-setup.js` | Create 16 cycles, labels, and 41 issues in Linear Tech team. Run `--get-team-id` first to find `TEAM_ID`. |
| `node scripts/linear-move-issue.js TECH-N "In Progress"` | Move a Linear issue to a state and assign to you. |
| `node scripts/linear-list-in-progress.js` | List Tech team issues currently in **In Progress**. |
| `node scripts/linear-create-issue.js ["Title"] ["Description"]` | Create a single issue in the Tech team (default: restructure repo ticket). |

Requires `.env` with `LINEAR_API_KEY` and `TEAM_ID` (see root `.env.example`).
