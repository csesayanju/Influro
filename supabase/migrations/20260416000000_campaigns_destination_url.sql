-- Add destination_url to campaigns for Option A UTM redirect tracking.
--
-- Option A: influro.app/r/[slug]?c=[influencer_id] → redirects to destination_url
-- Option Y-ready: utm_links.full_url already stores the computed final URL,
-- so per-link override (Option Y) can be added later without schema changes here.

ALTER TABLE campaigns ADD COLUMN destination_url TEXT;
