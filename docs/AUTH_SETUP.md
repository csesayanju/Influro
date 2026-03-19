# Auth setup (TECH-6)

Influro uses **Supabase Auth** with **email + password** and **Google** OAuth. Sessions use HTTP-only cookies via [`@supabase/ssr`](https://supabase.com/docs/guides/auth/server-side/nextjs).

## Environment

Same as [SUPABASE_SETUP.md](./SUPABASE_SETUP.md): `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.

## Supabase Dashboard

### Site URL & redirects

1. **Authentication → URL configuration**
   - **Site URL:** `http://localhost:3000` (dev) and your production URL (e.g. `https://influro.vercel.app`) for prod — you can switch or add both patterns per environment.
   - **Redirect URLs** (add each):
     - `http://localhost:3000/auth/callback`
     - `http://127.0.0.1:3000/auth/callback`
     - `https://YOUR-PRODUCTION-DOMAIN/auth/callback`

### Email auth

- **Authentication → Providers → Email** — enabled by default.
- If **“Confirm email”** is on, users must click the link before signing in; the link should use a redirect URL listed above.

### Google OAuth

1. **Authentication → Providers → Google** — enable.
2. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (OAuth 2.0 Client ID, type **Web application**).
3. **Authorized redirect URIs** must include Supabase’s callback, e.g.  
   `https://<project-ref>.supabase.co/auth/v1/callback`  
   (copy exact URL from the Google provider settings in Supabase).
4. Paste **Client ID** and **Client secret** into Supabase and save.

## App routes

| Path | Purpose |
|------|--------|
| `/login` | Email/password + Google |
| `/signup` | Register + Google |
| `/auth/callback` | OAuth / magic-link code exchange |
| `/dashboard` | Protected; creates `brands` row on first visit if missing |

## Brand row (RLS)

After login, `/dashboard` runs `ensureBrandProfile()` which inserts into `public.brands` with `user_id = auth.uid()` when no row exists. Your RLS policies allow this for the signed-in user.

## Troubleshooting

- **OAuth redirect mismatch** — add the exact callback URLs in Supabase and Google console.
- **`Invalid API key`** — confirm `.env.local` matches the project’s **publishable** (or anon) key.
- **Stuck on login** — check middleware and that cookies are not blocked; try another browser profile.
