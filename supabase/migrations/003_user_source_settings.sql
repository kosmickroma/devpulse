-- User Source Settings Table
-- Stores detailed configuration for each data source per user
-- This enables users to customize what content they want to track from each platform

CREATE TABLE IF NOT EXISTS user_source_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL, -- 'github', 'hackernews', 'devto', 'reddit'

  -- Generic settings (applies to all sources)
  enabled BOOLEAN DEFAULT true,

  -- GitHub-specific settings (JSONB for flexibility)
  github_settings JSONB DEFAULT '{
    "languages": ["python", "javascript"],
    "time_range": "daily",
    "min_stars": 10
  }'::jsonb,

  -- Reddit-specific settings
  reddit_settings JSONB DEFAULT '{
    "subreddits": ["programming", "python", "machinelearning"],
    "limit_per_subreddit": 50
  }'::jsonb,

  -- Dev.to-specific settings
  devto_settings JSONB DEFAULT '{
    "tags": ["python", "webdev"],
    "time_range": "week"
  }'::jsonb,

  -- Hacker News settings
  hackernews_settings JSONB DEFAULT '{
    "page_limit": 1
  }'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- One settings record per user per source
  CONSTRAINT unique_user_source UNIQUE (user_id, source)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_source_settings_user_id ON user_source_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_source_settings_source ON user_source_settings(source);

-- RLS - users can only see/edit their own settings
ALTER TABLE user_source_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own source settings"
  ON user_source_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own source settings"
  ON user_source_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own source settings"
  ON user_source_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own source settings"
  ON user_source_settings FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to auto-update updated_at timestamp
CREATE TRIGGER update_user_source_settings_updated_at
  BEFORE UPDATE ON user_source_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Helper function to get user's source settings
-- Returns settings for a specific source or default if not configured
CREATE OR REPLACE FUNCTION get_user_source_settings(
  p_user_id UUID,
  p_source TEXT
)
RETURNS JSONB AS $$
DECLARE
  settings JSONB;
BEGIN
  SELECT CASE
    WHEN p_source = 'github' THEN github_settings
    WHEN p_source = 'reddit' THEN reddit_settings
    WHEN p_source = 'devto' THEN devto_settings
    WHEN p_source = 'hackernews' THEN hackernews_settings
    ELSE '{}'::jsonb
  END INTO settings
  FROM user_source_settings
  WHERE user_id = p_user_id AND source = p_source AND enabled = true;

  -- Return settings or null if not found
  RETURN COALESCE(settings, NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE user_source_settings IS 'Detailed configuration for each data source per user - enables Standard Mode';
COMMENT ON FUNCTION get_user_source_settings IS 'Helper function to retrieve user source settings for Standard Mode scraping';
