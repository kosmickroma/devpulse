-- Migration: Expand cached_demo_items source constraint to support all 14 sources
-- Date: 2025-12-02
-- Purpose: Fix constraint violation preventing 8 new sources from caching
-- Impact: Zero downtime, backward compatible

-- Remove old constraint (only allowed 6 sources)
ALTER TABLE cached_demo_items
DROP CONSTRAINT IF EXISTS cached_demo_items_source_check;

-- Add new constraint with all 14 sources
ALTER TABLE cached_demo_items
ADD CONSTRAINT cached_demo_items_source_check
CHECK (source IN (
  -- Original 6 sources
  'github', 'reddit', 'hackernews', 'devto', 'stocks', 'crypto',
  -- Gaming sources (2)
  'ign', 'pcgamer',
  -- News sources (6)
  'bbc', 'deutschewelle', 'thehindu',
  'africanews', 'bangkokpost', 'rt'
));

-- Add documentation comment
COMMENT ON CONSTRAINT cached_demo_items_source_check ON cached_demo_items IS
'Allowed sources: 14 total (6 tech/finance + 2 gaming + 6 news). Update when adding new sources.';
