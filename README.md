# Influro

## Working with Linear and GitHub

We keep tickets in **Linear** (Tech team, cycles, labels) and do the work in **GitHub**. To keep them in sync and to review by commit:

1. **Branch** — name includes the issue ID: `feat/TECH-3-description`.
2. **Commits** — message includes the issue ID: `feat(TECH-3): add something`; use `Fixes TECH-XXX` in the PR description when the PR completes the issue.
3. **PR** — use the [Pull Request template](.github/pull_request_template.md) and fill in the **Linear issue** line (`Fixes TECH-XXX` or `Ref TECH-XXX`).

That way the right commit is “tagged” to the ticket and you can review specific commits on the Linear issue.

- **Full convention (branch, commit, PR, setup):** [COMMIT_CONVENTION.md](COMMIT_CONVENTION.md)
- **PR template:** [.github/pull_request_template.md](.github/pull_request_template.md)
