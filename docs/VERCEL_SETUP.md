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

## Environment variables (when you use Supabase in the app)

When routes or server code call Supabase, add in **Vercel ? Project ? Settings ? Environment Variables** (mirror `.env.local.example`):

| Name | Environments |
|------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development |

Redeploy after adding or changing variables.

## Useful links

- Production (after first deploy): [influro.vercel.app](https://influro.vercel.app/)
- [Vercel + Next.js](https://vercel.com/docs/frameworks/nextjs)
