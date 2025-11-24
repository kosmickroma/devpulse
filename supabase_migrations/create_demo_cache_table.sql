-- Create cached_demo_items table for demo mode
-- Stores 60 most recent items per source for instant display

CREATE TABLE IF NOT EXISTS cached_demo_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  source text NOT NULL CHECK (source IN ('github', 'reddit', 'hackernews', 'devto', 'stocks', 'crypto')),
  item_data jsonb NOT NULL,
  scraped_at timestamp with time zone DEFAULT now(),
  rank int NOT NULL CHECK (rank >= 1 AND rank <= 60),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(source, rank)
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_cached_items_source ON cached_demo_items(source, rank);
CREATE INDEX IF NOT EXISTS idx_cached_items_scraped ON cached_demo_items(scraped_at DESC);

-- Enable Row Level Security (optional, adjust based on your needs)
ALTER TABLE cached_demo_items ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access (demo mode needs to fetch these)
CREATE POLICY "Allow public read access to cached items"
ON cached_demo_items
FOR SELECT
USING (true);

-- Policy: Allow service role to manage cache
CREATE POLICY "Allow service role to manage cached items"
ON cached_demo_items
FOR ALL
USING (auth.role() = 'service_role');

-- Add comments for documentation
COMMENT ON TABLE cached_demo_items IS 'Stores cached items for instant demo mode display - 60 items per source';
COMMENT ON COLUMN cached_demo_items.source IS 'Source name: github, reddit, hackernews, devto, stocks, crypto';
COMMENT ON COLUMN cached_demo_items.item_data IS 'Full item data in JSON format (same structure as live scan results)';
COMMENT ON COLUMN cached_demo_items.rank IS 'Ranking within source (1-60), ensures we keep only top items';
COMMENT ON COLUMN cached_demo_items.scraped_at IS 'When this item was scraped (used for freshness checks)';
