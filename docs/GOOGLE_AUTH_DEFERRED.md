# Google OAuth (deferred)

**Not in current scope.** Email + password auth ships first (TECH-6). Pick up this doc when you work the Linear issue **“Auth: Add Google OAuth (deferred)”** (or equivalent).

## Prerequisites

- TECH-6 merged: `/auth/callback`, middleware, and Supabase **Redirect URLs** already include `.../auth/callback` for localhost + prod.
- No Google Cloud setup required until this ticket.

## Implementation checklist

1. **Supabase** → Authentication → Providers → **Google** — enable; add Client ID / secret from Google Cloud (below).
2. **Google Cloud Console** → APIs & Services → Credentials → OAuth 2.0 Client ID (**Web application**).
3. **Authorized redirect URIs** in Google: **only** Supabase’s callback, e.g.  
   `https://<project-ref>.supabase.co/auth/v1/callback`  
   (copy exact URL from the Google provider panel in Supabase).
4. **App code:** restore **Continue with Google** on `/login` and `/signup` using `signInWithOAuth({ provider: 'google', options: { redirectTo: origin + '/auth/callback?next=...' } })`.
5. Test localhost + production redirect allowlists (Supabase **URL configuration** still must list your app’s `/auth/callback` URLs).

## Reference

Same flow as previously documented in AUTH_SETUP; this file is the single place for Google steps once you defer it from the main auth doc.
