# Vercel setup (Influro)

## Connect the repo

1. In [Vercel](https://vercel.com), **Add New… ? Project** and import **`csesayanju/Influro`**.
2. **Framework preset:** Next.js (auto-detected).
3. **Root directory:** repository root (default).
4. **Production branch:** `main` (Vercel ? Project ? Settings ? Git).

## Preview vs production

- **Production:** deploys from pushes to `main` (and merges to `main`).
- **Preview:** each **pull request** gets its own preview URL (shown on the PR and in the Vercel dashboard).

No extra `vercel.json` is required for this; the file in the repo documents intent and keeps GitHub integration explicit.

## Environment variables (required for auth + middleware)

**Middleware** runs on every matched request. It needs Supabase URL + anon/publishable key. If they are missing, the app skips session refresh (no crash); for real auth on **Preview** and **Production**, set:

**Vercel ? Project ? Settings ? Environment Variables** (mirror `.env.local`):

| Name | Environments |
|------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | **Production**, **Preview**, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Production**, **Preview**, Development |

**Important:** Enable both for **Preview** — PR deployments use Preview env; without these you get no session and odd auth behavior. After `MIDDLEWARE_INVOCATION_FAILED`, ensure you are not mutating read-only request cookies (fixed in repo middleware) **and** that these variables exist for Preview.

Redeploy after adding or changing variables.

## Useful links

- Production (after first deploy): [influro.vercel.app](https://influro.vercel.app/)
- [Vercel + Next.js](https://vercel.com/docs/frameworks/nextjs)
