# Influro

Next.js 14 (App Router) + TypeScript + Tailwind + Supabase. App code is under **`src/`**.

- **Repo layout (folders, conventions):** [docs/REPO_STRUCTURE.md](docs/REPO_STRUCTURE.md)

## Working with Linear and GitHub

We keep tickets in **Linear** (Tech team, cycles, labels) and do the work in **GitHub**. To keep them in sync and to review by commit:

1. **Branch** — name includes the issue ID: `feat/TECH-3-description`.
2. **Commits** — message includes the issue ID: `feat(TECH-3): add something`; use `Fixes TECH-XXX` in the PR description when the PR completes the issue.
3. **PR** — use the [Pull Request template](.github/pull_request_template.md) and fill in the **Linear issue** line (`Fixes TECH-XXX` or `Ref TECH-XXX`).

That way the right commit is “tagged” to the ticket and you can review specific commits on the Linear issue.

- **Full convention (branch, commit, PR, setup):** [docs/COMMIT_CONVENTION.md](docs/COMMIT_CONVENTION.md)
- **PR template:** [.github/pull_request_template.md](.github/pull_request_template.md)
- **Branch protection (main):** [.github/BRANCH_PROTECTION.md](.github/BRANCH_PROTECTION.md) — one-time setup in GitHub Settings.
- **Vercel (preview + production):** [docs/VERCEL_SETUP.md](docs/VERCEL_SETUP.md)
- **Supabase (env + apply schema):** [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)
- **Auth (email/password; Google deferred):** [docs/AUTH_SETUP.md](docs/AUTH_SETUP.md) · [Linear auth ticket split](docs/LINEAR_AUTH_TICKETS.md)
- **Onboarding wizard (TECH-7):** [docs/ONBOARDING.md](docs/ONBOARDING.md)
- **Vercel Preview + Supabase redirects:** [docs/VERCEL_PREVIEW.md](docs/VERCEL_PREVIEW.md)
