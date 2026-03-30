# Repository structure

Application code lives under **`src/`** (Next.js 14 App Router). Root keeps infra, docs, DB SQL, and tooling only.

```
.
├── src/
│   ├── app/                    # Routes (App Router)
│   │   ├── (auth)/             # Route group: login + signup (shared layout)
│   │   ├── (dashboard)/        # Route group: protected app shell
│   │   ├── (marketing)/        # Route group: public landing
│   │   ├── auth/callback/      # OAuth / email confirmation (not in a group)
│   │   ├── onboarding/         # Brand wizard (TECH-7); see docs/ONBOARDING.md
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── auth/               # Auth-specific UI
│   │   └── ui/                 # Reusable primitives (Button, Field, AuthCard)
│   ├── config/                 # routes.ts, site metadata
│   ├── lib/
│   │   ├── actions/            # Server Actions (e.g. brands)
│   │   ├── supabase/           # Browser + server Supabase clients
│   │   ├── utils/              # cn(), helpers
│   │   ├── supabase-admin.ts   # Service role client (server-only)
│   │   └── supabase.ts         # Re-export browser client
│   ├── types/                  # Shared TS types (DB codegen later)
│   └── middleware.ts           # Session refresh + route guards
├── db/                         # schema.sql, diagrams (source of truth for SQL)
├── docs/                       # Setup and conventions
├── scripts/                    # Linear helpers, one-offs
├── supabase/                   # CLI config + migrations mirror
├── public/                     # Static assets
└── .github/                    # PR template, issue templates
```

## Conventions

| Area | Rule |
|------|------|
| Imports | Use `@/` → resolves to `src/` (`tsconfig.json` paths) |
| Routes | Prefer `routes` from `@/config/routes` instead of string literals |
| Server Actions | `src/lib/actions/*.ts` with `"use server"` at top |
| UI | Shared styles in `components/ui/`; feature pieces in `components/auth/` etc. |

## URLs (unchanged)

Route groups do **not** change URLs: `/`, `/login`, `/signup`, `/dashboard`, `/onboarding`, `/auth/callback`.
