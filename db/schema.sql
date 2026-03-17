-- =============================================================================
-- Influro — Database schema (Supabase/Postgres)
-- Micro-Influencer ROI Tracker for Indian D2C brands.
-- Do not apply yet — review first. Visual: SCHEMA_DIAGRAM.md, schema-diagram.html
-- =============================================================================
--
-- Tables and row-level security (RLS) owner:
--
--   brands          → RLS: user sees only own brand (user_id = auth.uid())
--   campaigns       → RLS: user sees campaigns of their brands
--   influencers     → RLS: user sees influencers of their brands
--   utm_links       → RLS: user sees utm_links of their campaigns
--   click_events    → RLS: no user policies (service role only; written by middleware)
--   conversions     → RLS: user sees conversions of their campaigns
--   fraud_scores    → RLS: user sees fraud_scores of their influencers
--
-- Units: campaigns.budget, influencers.agreed_fee = rupees (₹).
--        conversions.amount_paise = paise (÷ 100 for rupees).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- Trigger: set updated_at to now() on row update (used by brands, campaigns, influencers)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- brands
-- One row per authenticated user (onboarding). Stores company name, website,
-- category, onboarding choices (goals, platforms, monthly_budget), and plan.
-- RLS: user_id = auth.uid()
-- -----------------------------------------------------------------------------
CREATE TABLE brands (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  website          TEXT,
  category         TEXT,
  goals            JSONB,
  platforms        JSONB,
  monthly_budget   INTEGER,
  plan             TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'growth', 'pro')),
  plan_activated_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_brands_user_id ON brands(user_id);

CREATE TRIGGER set_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY brands_select_own ON brands
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY brands_insert_own ON brands
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY brands_update_own ON brands
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY brands_delete_own ON brands
  FOR DELETE USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- campaigns
-- One per brand. Name, slug (for UTM), budget (₹), dates, platform, status.
-- RLS: brand belongs to auth.uid()
-- -----------------------------------------------------------------------------
CREATE TABLE campaigns (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id      UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL,
  budget        INTEGER NOT NULL DEFAULT 0,
  start_date    DATE,
  end_date      DATE,
  platform      TEXT,
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(brand_id, slug)
);

CREATE INDEX idx_campaigns_brand_id ON campaigns(brand_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);

CREATE TRIGGER set_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY campaigns_select_own ON campaigns
  FOR SELECT USING (
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
  );
CREATE POLICY campaigns_insert_own ON campaigns
  FOR INSERT WITH CHECK (
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
  );
CREATE POLICY campaigns_update_own ON campaigns
  FOR UPDATE USING (
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
  );
CREATE POLICY campaigns_delete_own ON campaigns
  FOR DELETE USING (
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
  );

-- -----------------------------------------------------------------------------
-- influencers
-- Per campaign and per brand. Same real influencer in 3 campaigns = 3 rows but
-- linked by brand_id for cross-campaign queries and single fraud score per brand.
-- RLS: brand belongs to auth.uid()
-- -----------------------------------------------------------------------------
CREATE TABLE influencers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id        UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  campaign_id     UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  handle          TEXT NOT NULL,
  platform        TEXT NOT NULL,
  follower_count  INTEGER,
  agreed_fee      INTEGER NOT NULL DEFAULT 0,
  platform_data   JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_influencers_brand_id ON influencers(brand_id);
CREATE INDEX idx_influencers_campaign_id ON influencers(campaign_id);

CREATE TRIGGER set_influencers_updated_at
  BEFORE UPDATE ON influencers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE influencers ENABLE ROW LEVEL SECURITY;

CREATE POLICY influencers_select_own ON influencers
  FOR SELECT USING (
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
  );
CREATE POLICY influencers_insert_own ON influencers
  FOR INSERT WITH CHECK (
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
  );
CREATE POLICY influencers_update_own ON influencers
  FOR UPDATE USING (
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
  );
CREATE POLICY influencers_delete_own ON influencers
  FOR DELETE USING (
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
  );

-- -----------------------------------------------------------------------------
-- utm_links
-- One per campaign + influencer. Full UTM URL and click_count. Used by
-- middleware to log clicks and by webhook to attribute conversions.
-- RLS: campaign belongs to user's brand
-- -----------------------------------------------------------------------------
CREATE TABLE utm_links (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id    UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  influencer_id  UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  full_url       TEXT NOT NULL,
  utm_source     TEXT,
  utm_medium     TEXT,
  utm_campaign   TEXT,
  utm_content    TEXT,
  click_count    INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, influencer_id)
);

CREATE INDEX idx_utm_links_campaign_id ON utm_links(campaign_id);
CREATE INDEX idx_utm_links_influencer_id ON utm_links(influencer_id);

ALTER TABLE utm_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY utm_links_select_own ON utm_links
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM campaigns
      WHERE brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
    )
  );
CREATE POLICY utm_links_insert_own ON utm_links
  FOR INSERT WITH CHECK (
    campaign_id IN (
      SELECT id FROM campaigns
      WHERE brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
    )
  );
CREATE POLICY utm_links_update_own ON utm_links
  FOR UPDATE USING (
    campaign_id IN (
      SELECT id FROM campaigns
      WHERE brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
    )
  );
CREATE POLICY utm_links_delete_own ON utm_links
  FOR DELETE USING (
    campaign_id IN (
      SELECT id FROM campaigns
      WHERE brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
    )
  );

-- -----------------------------------------------------------------------------
-- click_events
-- One row per UTM click (or untracked-organic). session_id used by Razorpay
-- webhook to attribute conversions. Written by Next.js middleware only.
-- RLS: no policies for authenticated users — service role only.
-- -----------------------------------------------------------------------------
CREATE TABLE click_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  utm_link_id   UUID REFERENCES utm_links(id) ON DELETE SET NULL,
  session_id    UUID NOT NULL,
  ip_hash       TEXT,
  user_agent    TEXT,
  country       TEXT,
  source        TEXT NOT NULL DEFAULT 'influencer'
    CHECK (source IN ('influencer', 'untracked-organic')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_click_events_session_id ON click_events(session_id);
CREATE INDEX idx_click_events_utm_link_id ON click_events(utm_link_id);
CREATE INDEX idx_click_events_created_at ON click_events(created_at);
CREATE INDEX idx_click_events_link_date ON click_events(utm_link_id, created_at DESC);

ALTER TABLE click_events ENABLE ROW LEVEL SECURITY;

-- No policies: only service role (middleware) can read/write.

-- -----------------------------------------------------------------------------
-- conversions
-- One row per attributed sale (Razorpay webhook). payment_id UNIQUE for
-- idempotency. campaign_id denormalised for fast per-campaign queries.
-- RLS: campaign belongs to user's brand
-- -----------------------------------------------------------------------------
CREATE TABLE conversions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id    UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  utm_link_id    UUID NOT NULL REFERENCES utm_links(id) ON DELETE CASCADE,
  influencer_id  UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  payment_id     TEXT NOT NULL UNIQUE,
  amount_paise   INTEGER NOT NULL,
  converted_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_conversions_payment_id ON conversions(payment_id);
CREATE INDEX idx_conversions_campaign_id ON conversions(campaign_id);
CREATE INDEX idx_conversions_influencer_id ON conversions(influencer_id);
CREATE INDEX idx_conversions_utm_link_id ON conversions(utm_link_id);

ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY conversions_select_own ON conversions
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM campaigns
      WHERE brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
    )
  );
CREATE POLICY conversions_insert_own ON conversions
  FOR INSERT WITH CHECK (
    campaign_id IN (
      SELECT id FROM campaigns
      WHERE brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
    )
  );
CREATE POLICY conversions_update_own ON conversions
  FOR UPDATE USING (
    campaign_id IN (
      SELECT id FROM campaigns
      WHERE brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
    )
  );
CREATE POLICY conversions_delete_own ON conversions
  FOR DELETE USING (
    campaign_id IN (
      SELECT id FROM campaigns
      WHERE brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
    )
  );

-- -----------------------------------------------------------------------------
-- fraud_scores
-- One row per influencer (UNIQUE influencer_id). Composite score 0–1 plus
-- per-signal breakdown (ER, comment, growth) for the fraud badge modal.
-- RLS: influencer belongs to user's brand
-- -----------------------------------------------------------------------------
CREATE TABLE fraud_scores (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id  UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  score          NUMERIC(3, 2) NOT NULL CHECK (score >= 0 AND score <= 1),
  er_score       NUMERIC(3, 2),
  comment_score  NUMERIC(3, 2),
  growth_score   NUMERIC(3, 2),
  signal_data    JSONB,
  refreshed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(influencer_id)
);

CREATE INDEX idx_fraud_scores_influencer_id ON fraud_scores(influencer_id);
CREATE INDEX idx_fraud_scores_refreshed_at ON fraud_scores(refreshed_at);

ALTER TABLE fraud_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY fraud_scores_select_own ON fraud_scores
  FOR SELECT USING (
    influencer_id IN (
      SELECT id FROM influencers
      WHERE brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
    )
  );
CREATE POLICY fraud_scores_insert_own ON fraud_scores
  FOR INSERT WITH CHECK (
    influencer_id IN (
      SELECT id FROM influencers
      WHERE brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
    )
  );
CREATE POLICY fraud_scores_update_own ON fraud_scores
  FOR UPDATE USING (
    influencer_id IN (
      SELECT id FROM influencers
      WHERE brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
    )
  );
CREATE POLICY fraud_scores_delete_own ON fraud_scores
  FOR DELETE USING (
    influencer_id IN (
      SELECT id FROM influencers
      WHERE brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
    )
  );
