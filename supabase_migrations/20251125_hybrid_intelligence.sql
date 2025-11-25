-- Hybrid Intelligence System Database Schema
-- Created: 2025-11-25
-- Purpose: Support pattern caching and intelligence metrics tracking

-- Table 1: Intent Cache
-- Caches intent classification results to reduce repeated pattern matching
CREATE TABLE IF NOT EXISTS intent_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query_hash VARCHAR(32) NOT NULL UNIQUE,  -- MD5 of normalized query
  intent_type VARCHAR(50) NOT NULL,
  entities JSONB DEFAULT '{}'::jsonb,
  sources TEXT[] DEFAULT ARRAY[]::TEXT[],
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  confidence FLOAT NOT NULL,
  time_sensitive BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '24 hours'),
  hit_count INTEGER DEFAULT 1,
  last_accessed_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for intent_cache
CREATE INDEX IF NOT EXISTS idx_intent_cache_hash ON intent_cache(query_hash);
CREATE INDEX IF NOT EXISTS idx_intent_cache_expires ON intent_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_intent_cache_confidence ON intent_cache(confidence);

-- Auto-cleanup expired cache entries (runs daily)
CREATE OR REPLACE FUNCTION cleanup_expired_intent_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM intent_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Table 2: Intelligence Metrics
-- Track daily metrics for cost monitoring and performance analysis
CREATE TABLE IF NOT EXISTS intelligence_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  total_queries INTEGER DEFAULT 0,
  pattern_classified INTEGER DEFAULT 0,
  ai_classified INTEGER DEFAULT 0,
  cache_hits INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_cost_usd DECIMAL(10,4) DEFAULT 0,
  avg_confidence FLOAT DEFAULT 0,
  avg_latency_ms FLOAT DEFAULT 0,
  source_distribution JSONB DEFAULT '{}'::jsonb,  -- {"github": 150, "reddit": 80, ...}
  intent_distribution JSONB DEFAULT '{}'::jsonb,  -- {"code_search": 200, "tutorial": 50, ...}
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for intelligence_metrics
CREATE UNIQUE INDEX IF NOT EXISTS idx_metrics_date ON intelligence_metrics(date);

-- Function to update today's metrics
CREATE OR REPLACE FUNCTION update_intelligence_metrics(
  p_pattern_classified BOOLEAN,
  p_ai_classified BOOLEAN,
  p_cache_hit BOOLEAN,
  p_tokens INTEGER,
  p_cost DECIMAL,
  p_confidence FLOAT,
  p_latency_ms FLOAT,
  p_sources TEXT[],
  p_intent_type VARCHAR
)
RETURNS void AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_source TEXT;
  v_current_distribution JSONB;
BEGIN
  -- Insert or update today's metrics
  INSERT INTO intelligence_metrics (
    date, total_queries, pattern_classified, ai_classified, cache_hits,
    total_tokens, total_cost_usd, avg_confidence, avg_latency_ms
  )
  VALUES (
    v_today, 1,
    CASE WHEN p_pattern_classified THEN 1 ELSE 0 END,
    CASE WHEN p_ai_classified THEN 1 ELSE 0 END,
    CASE WHEN p_cache_hit THEN 1 ELSE 0 END,
    p_tokens, p_cost, p_confidence, p_latency_ms
  )
  ON CONFLICT (date) DO UPDATE SET
    total_queries = intelligence_metrics.total_queries + 1,
    pattern_classified = intelligence_metrics.pattern_classified + CASE WHEN p_pattern_classified THEN 1 ELSE 0 END,
    ai_classified = intelligence_metrics.ai_classified + CASE WHEN p_ai_classified THEN 1 ELSE 0 END,
    cache_hits = intelligence_metrics.cache_hits + CASE WHEN p_cache_hit THEN 1 ELSE 0 END,
    total_tokens = intelligence_metrics.total_tokens + p_tokens,
    total_cost_usd = intelligence_metrics.total_cost_usd + p_cost,
    avg_confidence = (intelligence_metrics.avg_confidence * intelligence_metrics.total_queries + p_confidence) / (intelligence_metrics.total_queries + 1),
    avg_latency_ms = (intelligence_metrics.avg_latency_ms * intelligence_metrics.total_queries + p_latency_ms) / (intelligence_metrics.total_queries + 1),
    updated_at = NOW();

  -- Update source distribution
  IF p_sources IS NOT NULL THEN
    FOREACH v_source IN ARRAY p_sources LOOP
      SELECT source_distribution INTO v_current_distribution
      FROM intelligence_metrics WHERE date = v_today;

      UPDATE intelligence_metrics
      SET source_distribution = jsonb_set(
        COALESCE(source_distribution, '{}'::jsonb),
        ARRAY[v_source],
        to_jsonb(COALESCE((source_distribution->v_source)::int, 0) + 1)
      )
      WHERE date = v_today;
    END LOOP;
  END IF;

  -- Update intent distribution
  IF p_intent_type IS NOT NULL THEN
    UPDATE intelligence_metrics
    SET intent_distribution = jsonb_set(
      COALESCE(intent_distribution, '{}'::jsonb),
      ARRAY[p_intent_type],
      to_jsonb(COALESCE((intent_distribution->p_intent_type)::int, 0) + 1)
    )
    WHERE date = v_today;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust for your setup)
-- ALTER TABLE intent_cache ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE intelligence_metrics ENABLE ROW LEVEL SECURITY;

-- Create service role policies if needed
-- CREATE POLICY "Service role can manage intent_cache" ON intent_cache
--   FOR ALL USING (auth.role() = 'service_role');

-- CREATE POLICY "Service role can manage intelligence_metrics" ON intelligence_metrics
--   FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE intent_cache IS 'Caches intent classification results for 24h to improve performance';
COMMENT ON TABLE intelligence_metrics IS 'Daily aggregated metrics for cost monitoring and performance analysis';
COMMENT ON FUNCTION update_intelligence_metrics IS 'Updates daily metrics in a single transaction';
COMMENT ON FUNCTION cleanup_expired_intent_cache IS 'Removes expired cache entries (run via cron)';
