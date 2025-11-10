-- Scan Results Table
-- Stores trending items from scans for persistence and caching

CREATE TABLE IF NOT EXISTS scan_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL, -- 'github', 'hackernews', 'devto'
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  author TEXT,
  stars INTEGER,
  language TEXT,
  tags TEXT[], -- Array of tags
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scan_date DATE DEFAULT CURRENT_DATE,

  -- Index for fast lookups
  CONSTRAINT unique_url_per_day UNIQUE (url, scan_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scan_results_source ON scan_results(source);
CREATE INDEX IF NOT EXISTS idx_scan_results_scan_date ON scan_results(scan_date);
CREATE INDEX IF NOT EXISTS idx_scan_results_created_at ON scan_results(created_at DESC);

-- RLS (Row Level Security) - anyone can read, only authenticated can write
ALTER TABLE scan_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read scan results"
  ON scan_results FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert scan results"
  ON scan_results FOR INSERT
  WITH CHECK (true); -- In production, you might want: auth.role() = 'authenticated'

COMMENT ON TABLE scan_results IS 'Stores trending items from platform scans for caching and persistence';
