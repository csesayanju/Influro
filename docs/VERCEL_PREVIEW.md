# Vercel Preview + Supabase Auth

PR Preview deployments use random hostnames. Auth fails if Supabase or Vercel is misconfigured.

## Vercel environment variables

Project Settings → Environment Variables. Enable for **Preview** and **Production**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Redeploy after changes.

Optional in Production: `NEXT_PUBLIC_SITE_URL` = `https://influro.vercel.app`

## Supabase redirect allowlist

Authentication → URL configuration.

- **Site URL:** production origin, e.g. `https://influro.vercel.app`
- **Redirect URLs:** add patterns from the official guide (wildcards for Vercel):

  - `http://localhost:3000/**`
  - `https://*-.vercel.app/**`  (covers all Vercel Preview URLs)
  - Your production pattern, e.g. `https://influro.vercel.app/**`

Docs: [Supabase redirect URLs — Vercel preview](https://supabase.com/docs/guides/auth/redirect-urls#vercel-preview-urls)

Without `https://*-.vercel.app/**`, email links and callbacks to Preview deployments are rejected.

## Middleware

Repo middleware avoids mutating read-only request cookies on Edge. If you see MIDDLEWARE_INVOCATION_FAILED, confirm Preview has the two `NEXT_PUBLIC_SUPABASE_*` variables set.

## See also

- [VERCEL_SETUP.md](./VERCEL_SETUP.md)
- [AUTH_SETUP.md](./AUTH_SETUP.md)
