# Supabase setup (Influro)

## 1. Project

- **Dashboard:** [Supabase](https://supabase.com/dashboard/project/jhznsstgdcbwupvziwdj)
- **Project ref / ID:** `jhznsstgdcbwupvziwdj`
- **API URL:** `https://jhznsstgdcbwupvziwdj.supabase.co`

## 2. Local environment

Copy `.env.local.example` → **`.env.local`** (gitignored) and set:

| Variable | Where to get it |
|----------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → API — project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Publishable** key (`sb_publishable_...`) or legacy **anon** JWT |
| `SUPABASE_SECRET_KEY` | **Secret** key (`sb_secret_...`) or legacy **service_role** JWT |

- Never commit `.env.local`.
- Never prefix the secret key with `NEXT_PUBLIC_` or use it in the browser.

## 3. Apply database schema

**Option A — SQL Editor (fastest)**  
1. Open **SQL Editor** → New query.  
2. Paste the full contents of **`db/schema.sql`** (same as `supabase/migrations/20250317120000_influro_schema.sql`).  
3. Run. Fix any errors (empty project should apply cleanly).

**Option B — Supabase CLI**  
```bash
npx supabase login
npx supabase link --project-ref jhznsstgdcbwupvziwdj
npx supabase db push
```

Requires the database password when linking (not the API keys).

## 4. Verify

- **Table Editor:** tables `brands`, `campaigns`, `influencers`, `utm_links`, `click_events`, `conversions`, `fraud_scores`.
- **Authentication → Policies:** RLS enabled; `click_events` has **no** policies (service role only for writes).

## 5. Deploy (Vercel)

Add the same `NEXT_PUBLIC_*` variables (and `SUPABASE_SECRET_KEY` only if a serverless route needs bypass-RLS access) in **Vercel → Project → Environment Variables**.

## 6. Security

If API keys were ever pasted in chat or committed by mistake, **rotate** them in **Settings → API Keys** and update `.env.local` / Vercel.
