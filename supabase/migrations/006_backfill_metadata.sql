-- Backfill Metadata Table
-- Tracks when the last successful backfill occurred and stores cached trends

CREATE TABLE IF NOT EXISTS backfill_metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_trends INTEGER DEFAULT 0,
  sources_included TEXT[], -- Array of sources that were scraped
  status TEXT DEFAULT 'success', -- 'success', 'failed', 'in_progress'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups of the latest backfill
CREATE INDEX IF NOT EXISTS idx_backfill_metadata_last_updated ON backfill_metadata(last_updated DESC);

-- RLS (Row Level Security) - anyone can read, only service can write
ALTER TABLE backfill_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read backfill metadata"
  ON backfill_metadata FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert backfill metadata"
  ON backfill_metadata FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE backfill_metadata IS 'Tracks backfill job executions and metadata for cache freshness display';
