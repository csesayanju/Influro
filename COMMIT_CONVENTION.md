# Commit & branch convention (GitHub ↔ Linear)

So Linear can link commits and PRs to issues and move status automatically:

## Branch names
Include the Linear issue ID:
```
feat/TECH-3-branch-protection-pr-template
fix/TECH-12-utm-link-copy
```
Or use Linear’s copy: open the issue → **Cmd/Ctrl + Shift + .** → paste as branch name.

## Commit messages
Include the issue ID; use a **magic word** to drive status:
- **Closing** (moves to Done when merged to default branch): `Fixes TECH-3`, `Closes TECH-3`
- **Non-closing** (links only): `Ref TECH-3`, `Part of TECH-3`

Examples:
```
feat(TECH-3): add branch protection and PR template
Fixes TECH-3
```

## PR title or description
Put the issue ID in the PR title or use a magic word in the description:
- `Fixes TECH-3` or `Fixes TECH-3, TECH-4`

Then Linear will move the issue to **In Progress** when the PR is opened and **Done** when the PR is merged (if you use a closing word).

## One-time setup
1. **Linear**: Settings → Integrations → GitHub → install and connect your repo.
2. **GitHub**: Settings → Webhooks → enable “Link commits to issues with magic words” (payload from Linear).
3. **Linear**: Connect your GitHub account in Settings → Connected accounts so assignees and activity map correctly.
