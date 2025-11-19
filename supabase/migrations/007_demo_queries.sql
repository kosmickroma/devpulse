-- Demo Queries Table
-- Stores pre-cached impressive searches for demo mode auto-play

CREATE TABLE IF NOT EXISTS demo_queries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query_text TEXT NOT NULL,
  results_json JSONB NOT NULL,
  display_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_refreshed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_demo_query UNIQUE (query_text)
);

-- Index for fast ordered retrieval
CREATE INDEX IF NOT EXISTS idx_demo_queries_order ON demo_queries(display_order);
CREATE INDEX IF NOT EXISTS idx_demo_queries_active ON demo_queries(is_active);

-- RLS (Row Level Security) - anyone can read, only service can write
ALTER TABLE demo_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read demo queries"
  ON demo_queries FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service can manage demo queries"
  ON demo_queries FOR ALL
  USING (true);

COMMENT ON TABLE demo_queries IS 'Pre-cached search results for impressive demo mode auto-play';

-- Insert some default impressive queries
INSERT INTO demo_queries (query_text, results_json, display_order) VALUES
('find trending AI projects on GitHub', '[]'::jsonb, 1),
('show me retro arcade games', '[]'::jsonb, 2),
('search for machine learning tutorials', '[]'::jsonb, 3),
('what''s popular in web development', '[]'::jsonb, 4),
('find crypto trading bots', '[]'::jsonb, 5)
ON CONFLICT (query_text) DO NOTHING;
