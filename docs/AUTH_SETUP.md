# Auth setup (TECH-6) — email + password only

Influro uses **Supabase Auth** with **email and password**. Sessions use HTTP-only cookies via [@supabase/ssr](https://supabase.com/docs/guides/auth/server-side/nextjs).

**Google OAuth is deferred** — see [GOOGLE_AUTH_DEFERRED.md](./GOOGLE_AUTH_DEFERRED.md) and the Linear ticket created for that work (no Google Cloud needed for TECH-6).

---

## Quick checklist

1. **[Supabase URL configuration](#1-supabase--url-configuration)** — allow `/auth/callback` on your app domain(s).
2. **[`.env.local` + run app](#2-envlocal--run-locally)** — public Supabase URL + anon/publishable key.

---

## Environment

Same as [SUPABASE_SETUP.md](./SUPABASE_SETUP.md):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable `sb_publishable_...` or legacy anon JWT)

`SUPABASE_SECRET_KEY` is optional for auth pages (used for server-only bypass-RLS code later).

---

## 1. Supabase — URL configuration

Supabase only redirects to URLs you allow. Email confirmation links (if enabled) and any future OAuth use your app’s **`/auth/callback`**.

**Where:** Dashboard → **Authentication** → **URL configuration**.

**Site URL:** your app origin only (no path), e.g. `http://localhost:3000` for dev or `https://influro.vercel.app` for prod.

**Redirect URLs** — add each you need. For **Vercel PR previews**, you **must** allow preview hostnames (see [VERCEL_PREVIEW.md](./VERCEL_PREVIEW.md)):

| Environment | URL / pattern |
|-------------|----------------|
| Local | `http://localhost:3000/**` (or exact `/auth/callback` paths) |
| **Vercel Preview (all PRs)** | **`https://*-.vercel.app/**`** |
| Production | `https://YOUR-DOMAIN/**` (e.g. `https://influro.vercel.app/**`) |

Wildcards are [documented by Supabase](https://supabase.com/docs/guides/auth/redirect-urls#use-wildcards-in-redirect-urls). Without the Vercel wildcard, Preview auth redirects fail.

Save after editing.

---

## 2. `.env.local` + run locally

1. Copy `.env.local.example` → `.env.local` (repo root, never commit).
2. Paste **Project URL** and **publishable** (or anon) key from Supabase → **Project Settings** → **API** / **API Keys**.
3. Run:

```bash
npm install
npm run dev
```

4. Open **http://localhost:3000/signup** or **/login**, create an account, confirm email if your project requires it, then open **/dashboard**.

---

## App routes

| Path | Purpose |
|------|--------|
| `/login` | Email + password |
| `/signup` | Register |
| `/auth/callback` | Email confirmation / magic link / **future** OAuth code exchange |
| `/dashboard` | Protected; creates `brands` row on first visit if missing |

---

## Brand row (RLS)

`/dashboard` runs `ensureBrandProfile()` — inserts `public.brands` for `auth.uid()` when none exists (name from email or `"My brand"`).

If the brand row has **no `category` yet**, the app redirects to **`/onboarding`** (TECH-7). See [ONBOARDING.md](./ONBOARDING.md).

---

## Troubleshooting

- **Redirect / link errors** — ensure `/auth/callback` URLs are in **Redirect URLs** and **Site URL** matches how you open the app.
- **Invalid API key** — `.env.local` must match this Supabase project.

---

## Linear / scope note

- **TECH-6 (edit in Linear):** *Auth: Supabase email/password, SSR cookies, `/dashboard`, brand bootstrap — **no Google**.*
- **New backlog issue:** *Auth: Add Google OAuth (deferred)* — details in [docs/LINEAR_AUTH_TICKETS.md](./LINEAR_AUTH_TICKETS.md).
