-- -----------------------------------------------------------------------------
-- Add soft-delete support to campaigns.
-- archived_at: set to now() when archived, NULL when active.
-- Archived campaigns are hidden from normal views but recoverable.
-- Hard delete is still available for permanent removal.
-- -----------------------------------------------------------------------------

ALTER TABLE campaigns
  ADD COLUMN archived_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX idx_campaigns_archived_at ON campaigns(archived_at)
  WHERE archived_at IS NOT NULL;
