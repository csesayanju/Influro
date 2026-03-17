-- Influro DB schema (Supabase/Postgres)
-- TECH-2: Do not apply yet — review first.
-- Tables: brands, campaigns, influencers, utm_links, click_events, conversions, fraud_scores

-- Enable UUID extension if not already
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- brands: one per authenticated user (onboarding); RLS will scope by auth.uid()
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE brands (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  website       TEXT,
  category      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_brands_user_id ON brands(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- campaigns: belong to a brand; slug used in UTM (utm_campaign)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE campaigns (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id      UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL,
  budget        INTEGER NOT NULL DEFAULT 0,  -- ₹ (rupees)
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

-- ─────────────────────────────────────────────────────────────────────────────
-- influencers: per campaign; handle, platform, fee; platform_data for YouTube etc.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE influencers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  handle          TEXT NOT NULL,
  platform        TEXT NOT NULL,
  follower_count  INTEGER,
  agreed_fee      INTEGER NOT NULL DEFAULT 0,  -- ₹ (rupees)
  platform_data   JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_influencers_campaign_id ON influencers(campaign_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- utm_links: one per influencer per campaign; full URL + click count
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE utm_links (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  influencer_id  UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  full_url      TEXT NOT NULL,
  utm_source    TEXT,
  utm_medium    TEXT,
  utm_campaign  TEXT,
  utm_content  TEXT,
  click_count   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, influencer_id)
);

CREATE INDEX idx_utm_links_campaign_id ON utm_links(campaign_id);
CREATE INDEX idx_utm_links_influencer_id ON utm_links(influencer_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- click_events: each UTM hit; session_id for webhook attribution
-- utm_link_id NULL when source = 'untracked-organic'
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE click_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  utm_link_id   UUID REFERENCES utm_links(id) ON DELETE SET NULL,
  session_id    UUID NOT NULL,
  ip_hash       TEXT,
  user_agent   TEXT,
  country       TEXT,
  source        TEXT DEFAULT 'influencer',  -- e.g. 'influencer', 'untracked-organic'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_click_events_session_id ON click_events(session_id);
CREATE INDEX idx_click_events_utm_link_id ON click_events(utm_link_id);
CREATE INDEX idx_click_events_created_at ON click_events(created_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- conversions: from Razorpay webhook; payment_id unique for idempotency
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE conversions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  utm_link_id   UUID NOT NULL REFERENCES utm_links(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  payment_id    TEXT NOT NULL UNIQUE,
  amount_paise  INTEGER NOT NULL,
  converted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_conversions_payment_id ON conversions(payment_id);
CREATE INDEX idx_conversions_influencer_id ON conversions(influencer_id);
CREATE INDEX idx_conversions_utm_link_id ON conversions(utm_link_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- fraud_scores: bot_score 0.0–1.0 per influencer; refreshed by cron
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE fraud_scores (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  score         NUMERIC(3, 2) NOT NULL CHECK (score >= 0 AND score <= 1),
  refreshed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(influencer_id)
);

CREATE INDEX idx_fraud_scores_influencer_id ON fraud_scores(influencer_id);
CREATE INDEX idx_fraud_scores_refreshed_at ON fraud_scores(refreshed_at);
