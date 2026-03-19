# Database schema

- **`schema.sql`** — Table definitions for Supabase/Postgres: `brands`, `campaigns`, `influencers`, `utm_links`, `click_events`, `conversions`, `fraud_scores`. Includes RLS policies, foreign keys, and indexes.
- **Apply to Supabase:** [docs/SUPABASE_SETUP.md](../docs/SUPABASE_SETUP.md) (SQL Editor or CLI). Same SQL lives in `supabase/migrations/20250317120000_influro_schema.sql` for `supabase db push`.

Relationships: `brands` → `campaigns` → `influencers` → `utm_links`; `click_events` and `conversions` reference `utm_links`; `fraud_scores` reference `influencers`.
