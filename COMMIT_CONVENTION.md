# Commit & branch convention (GitHub ↔ Linear)

This doc explains how we link GitHub branches, commits, and PRs to Linear issues so that:

- Commits and PRs show up on the right Linear ticket.
- Issue status can move automatically (e.g. **In Progress** when a PR is opened, **Done** when merged).
- You can review work by commit and trace changes back to a ticket.

---

## Why use the convention

- **Linear** links to GitHub using **issue IDs** (e.g. `TECH-3`) in branch names, commit messages, and PR titles/descriptions.
- Without the ID, commits and PRs don’t attach to the issue, and status automation won’t run.
- With the ID (and optional “magic words”), Linear can move the issue through your workflow (Todo → In Progress → Done).

---

## Branch names

Always include the Linear issue ID so the branch is associated with the ticket.

**Format:** `<type>/<ISSUE-ID>-<short-description>`

| Type   | Use for                    | Example branch name                          |
|--------|----------------------------|----------------------------------------------|
| `feat` | New features               | `feat/TECH-3-branch-protection-pr-template` |
| `fix`  | Bug fixes                  | `fix/TECH-16-webhook-idempotency`            |
| `chore`| Config, tooling, docs      | `chore/TECH-4-vercel-env-vars`               |
| `refactor` | Code structure only   | `refactor/TECH-8-campaign-crud-cleanup`      |

**Shortcut:** In Linear, open the issue → **Cmd/Ctrl + Shift + .** → paste into the new branch name in GitHub. Linear will format it for you.

---

## Commit messages

Include the issue ID so the commit appears on the Linear issue. Optionally use a **magic word** to control status when the commit reaches the default branch.

**Format (recommended):**  
`<type>(<ISSUE-ID>): <short summary>`

**Examples:**

```
feat(TECH-3): add PR template and commit convention
fix(TECH-13): handle missing utm_content in middleware
chore(TECH-4): add Vercel env vars to docs
```

**Magic words (in commit message or PR description):**

| Effect      | Words                                                                 | When to use |
|------------|-----------------------------------------------------------------------|-------------|
| **Closing**| `close`, `closes`, `closed`, `fix`, `fixes`, `fixed`, `resolve`, `resolves`, `complete`, `completes` | Commit/PR that **fully delivers** the issue → Linear can move to **Done** on merge. |
| **Linking only** | `ref`, `refs`, `references`, `part of`, `related to`, `contributes to` | Commit/PR is only **part** of the work or you don’t want auto-close. |

Example with closing word in PR description: `Fixes TECH-3`.  
Example with non-closing: `Ref TECH-3` or `Part of TECH-3`.

---

## Pull request title and description

- **Title:** Include the issue ID when possible, e.g. `[TECH-3] Add PR template and commit convention`.
- **Description:** Use the [PR template](.github/pull_request_template.md) and in the **Linear issue** section add exactly one of:
  - `Fixes TECH-XXX` (this PR completes the issue → auto-close on merge).
  - `Ref TECH-XXX` or `Part of TECH-XXX` (link only, no auto-close).

Multiple issues: `Fixes TECH-3, TECH-4` or `Ref TECH-5 and TECH-6`.

---

## One-time setup (GitHub ↔ Linear)

Do this once per repo / workspace so that commits and PRs actually link and update status.

1. **Linear**
   - Go to **Settings → Integrations → GitHub**.
   - Install the Linear GitHub App and connect the **Influro** repo (or your org).
   - Note the webhook URL and secret if you want commit linking.

2. **GitHub**
   - Repo (or org) **Settings → Webhooks**.
   - Add Linear’s webhook (Payload URL and Secret from Linear), content type `application/json`, **Push events** on.
   - At the bottom, turn **on** “Link commits to issues with magic words”.

3. **Linear (your account)**
   - **Settings → Connected accounts** → connect your **GitHub** account.
   - So that your commits and PRs are attributed to you in Linear and assignees map correctly.

After this, any push that contains an issue ID (e.g. `TECH-3`) in the commit message can be linked to that issue, and PRs with magic words will drive status (e.g. In Progress when opened, Done when merged).

---

## Quick reference

| Where        | What to do |
|-------------|------------|
| **Branch**  | `feat/TECH-3-short-description` (or use Linear’s **Cmd+Shift+.** copy). |
| **Commit**  | `feat(TECH-3): add something` and/or `Ref TECH-3` / `Fixes TECH-3` in message. |
| **PR**      | Use the PR template; in “Linear issue” put `Fixes TECH-XXX` or `Ref TECH-XXX`. |
| **Review**  | You can review by specific commit (e.g. `8b9b8b3`) and see it on the TECH-XXX issue in Linear once linking is set up. |
