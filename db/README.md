# Database schema

- **`schema.sql`** — Table definitions for Supabase/Postgres: `brands`, `campaigns`, `influencers`, `utm_links`, `click_events`, `conversions`, `fraud_scores`. Includes foreign keys and indexes.
- **Do not apply yet** — Review first. Apply in a later ticket (e.g. “Apply schema to Supabase + enable RLS”).

Relationships: `brands` → `campaigns` → `influencers` → `utm_links`; `click_events` and `conversions` reference `utm_links`; `fraud_scores` reference `influencers`.
