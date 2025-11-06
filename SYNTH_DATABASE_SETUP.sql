-- SYNTH AI Database Setup
-- Run this in your Supabase SQL Editor

-- =======================
-- Table: ai_summaries
-- Stores cached article summaries
-- =======================

CREATE TABLE IF NOT EXISTS ai_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_url TEXT UNIQUE NOT NULL,
  summary TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_summaries_url ON ai_summaries(article_url);
CREATE INDEX IF NOT EXISTS idx_ai_summaries_expires ON ai_summaries(expires_at);

-- Comment
COMMENT ON TABLE ai_summaries IS 'Cached AI-generated article summaries (7 day TTL)';


-- =======================
-- Table: ai_usage
-- Tracks all AI queries for rate limiting and analytics
-- =======================

CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  query_type TEXT NOT NULL,  -- 'summary', 'ask', 'explain', 'summary_cached'
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON ai_usage(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_type ON ai_usage(query_type);

-- Comment
COMMENT ON TABLE ai_usage IS 'Tracks all AI queries for rate limiting and analytics';


-- =======================
-- Row Level Security (RLS)
-- =======================

-- Enable RLS
ALTER TABLE ai_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read cached summaries
CREATE POLICY "Anyone can read summaries"
  ON ai_summaries FOR SELECT
  USING (true);

-- Policy: Service role can insert/update summaries
CREATE POLICY "Service role can manage summaries"
  ON ai_summaries FOR ALL
  USING (auth.jwt() IS NULL OR auth.role() = 'service_role');

-- Policy: Users can view their own usage
CREATE POLICY "Users view own usage"
  ON ai_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can insert usage logs
CREATE POLICY "Service role can log usage"
  ON ai_usage FOR INSERT
  WITH CHECK (true);


-- =======================
-- Cleanup Function
-- Automatically delete expired summaries
-- =======================

CREATE OR REPLACE FUNCTION cleanup_expired_summaries()
RETURNS void AS $$
BEGIN
  DELETE FROM ai_summaries
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment
COMMENT ON FUNCTION cleanup_expired_summaries IS 'Deletes expired summary cache entries';


-- =======================
-- Views for Analytics
-- =======================

-- Daily usage per user
CREATE OR REPLACE VIEW daily_ai_usage AS
SELECT
  user_id,
  DATE(created_at) as date,
  query_type,
  COUNT(*) as query_count,
  SUM(tokens_used) as total_tokens
FROM ai_usage
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY user_id, DATE(created_at), query_type
ORDER BY date DESC;

-- Global usage stats
CREATE OR REPLACE VIEW global_ai_stats AS
SELECT
  DATE(created_at) as date,
  query_type,
  COUNT(*) as total_queries,
  COUNT(DISTINCT user_id) as unique_users,
  SUM(tokens_used) as total_tokens
FROM ai_usage
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), query_type
ORDER BY date DESC;

-- Comment
COMMENT ON VIEW daily_ai_usage IS 'Daily AI usage per user (last 30 days)';
COMMENT ON VIEW global_ai_stats IS 'Global AI usage statistics (last 30 days)';


-- =======================
-- Success Message
-- =======================

DO $$
BEGIN
  RAISE NOTICE '✅ SYNTH AI database setup complete!';
  RAISE NOTICE '📊 Tables created: ai_summaries, ai_usage';
  RAISE NOTICE '🔒 Row Level Security enabled';
  RAISE NOTICE '📈 Analytics views created';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Get Gemini API key: https://aistudio.google.com/app/apikey';
  RAISE NOTICE '2. Add GEMINI_API_KEY to backend environment';
  RAISE NOTICE '3. Test endpoints: /api/ai/summarize and /api/ai/ask';
END $$;
