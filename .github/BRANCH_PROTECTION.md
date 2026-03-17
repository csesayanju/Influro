# Branch protection (main)

Branch protection is configured in **GitHub**, not in repo files. Do this once per repo.

## Steps

1. Open the repo on GitHub → **Settings** → **Branches**.
2. Under **Branch protection rules**, click **Add rule** (or **Add branch protection rule**).
3. In **Branch name pattern**, enter: `main`.
4. Enable:
   - **Require a pull request before merging**
     - Require at least 1 approval (or 0 if you want PR required but allow self-merge when solo).
   - **Do not allow bypassing the above settings** (optional; keeps admins following the rule).
5. Click **Create** (or **Save changes**).

After this, direct pushes to `main` are blocked; changes must go through a PR. Even when working solo, open a PR from your branch and merge it to satisfy TECH-3.
