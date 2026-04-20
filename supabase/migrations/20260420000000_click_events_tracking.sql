-- TECH-13: Click-tracking redirect route (/r/<slug>?c=<influencer_id>)
--
-- Augments the existing click_events table (created in 20250317120000_influro_schema.sql)
-- to support the /r/ redirect route:
--   1. Adds a `referer` column so we can record where the click came from.
--   2. Adds a trigger that increments utm_links.click_count on each insert —
--      this is how TECH-14's dashboard click counts stay fresh without an
--      aggregate query on every render.
--
-- Notes:
--  - click_events.session_id is already UUID (not text) — we keep that.
--  - No denormalised campaign_id / influencer_id: we can always join via
--    utm_link_id if needed for analytics. Keeping the table narrow.
--  - RLS remains locked down (service-role-only); no new policies.

ALTER TABLE public.click_events
  ADD COLUMN IF NOT EXISTS referer TEXT;

-- ── Trigger: bump utm_links.click_count on click_events insert ────────────────
CREATE OR REPLACE FUNCTION public.increment_utm_link_click_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.utm_link_id IS NOT NULL THEN
    UPDATE public.utm_links
       SET click_count = click_count + 1
     WHERE id = NEW.utm_link_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_increment_utm_link_click_count ON public.click_events;
CREATE TRIGGER trg_increment_utm_link_click_count
  AFTER INSERT ON public.click_events
  FOR EACH ROW EXECUTE FUNCTION public.increment_utm_link_click_count();
