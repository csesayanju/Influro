# Linear — auth tickets after deferring Google

## What changed (March 2025)

- **Google OAuth** is **out of** the current delivery scope.
- App and docs now cover **email + password** only for TECH-6.

## Action in Linear (manual)

### 1. Update **TECH-6**

Edit the issue title and description to match the reduced scope.

**Suggested title:**  
`Auth: Supabase email/password + SSR session + dashboard + brand row`

**Suggested description (paste / merge):**

```text
Scope (no Google OAuth in this ticket):
- Supabase Auth email + password on /login and /signup
- @supabase/ssr + middleware for cookie session; /auth/callback for email confirmation links
- Protected /dashboard; ensureBrandProfile() creates public.brands for auth.uid() when missing
- Docs: docs/AUTH_SETUP.md

Out of scope (separate ticket):
- Google sign-in — see linked "Google OAuth deferred" issue and docs/GOOGLE_AUTH_DEFERRED.md
```

### 2. New ticket — Google later

**Created in Linear:** **TECH-43** — *Auth: Add Google OAuth (deferred)* (assignee: you). If you don’t see it, create manually or run the script in “Script used” below.

**Title:** `Auth: Add Google OAuth (deferred)`

**Description:**

```text
Re-add Sign in with Google on /login and /signup.

Prerequisites: TECH-6 merged (email auth + /auth/callback + middleware).

Steps: docs/GOOGLE_AUTH_DEFERRED.md

Acceptance:
- Google provider enabled in Supabase + Google Cloud OAuth client
- Local + prod redirect URLs configured (Supabase allowlist + Google authorized redirect to .../auth/v1/callback)
- User can sign in and sign up with Google; lands on /dashboard with brand row as for email users
```

Link **TECH-6** and **TECH-43** (e.g. TECH-43 **blocked by** TECH-6, or **related**).

## Script used (optional)

From repo root, with `.env` containing `LINEAR_API_KEY` and `TEAM_ID`:

```bash
node scripts/linear-create-issue.js "Auth: Add Google OAuth (deferred)" "Prerequisites: TECH-6 merged. Steps: docs/GOOGLE_AUTH_DEFERRED.md. Enable Google provider + Google Cloud OAuth; re-add buttons on /login and /signup. Acceptance: Google sign-in/up works on localhost and prod."
```

Then paste the full **Description** block from section 2 above into Linear if you want more detail.
