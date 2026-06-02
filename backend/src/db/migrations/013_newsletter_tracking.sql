-- ============================================================
-- Migration 013: Add tracking columns to newsletter_campaigns
-- ============================================================

ALTER TABLE newsletter_campaigns
  ADD COLUMN IF NOT EXISTS sent_count    INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failed_count  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failed_emails JSONB   DEFAULT '[]';
