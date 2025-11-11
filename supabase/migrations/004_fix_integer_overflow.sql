-- Fix integer overflow for stocks/crypto with large market caps
-- Stock market caps can be billions, need BIGINT instead of INTEGER

-- Change stars column from INTEGER to BIGINT
ALTER TABLE scan_results
ALTER COLUMN stars TYPE BIGINT;

-- Add comment
COMMENT ON COLUMN scan_results.stars IS 'GitHub stars, stock market cap, or crypto market cap (can be billions)';
