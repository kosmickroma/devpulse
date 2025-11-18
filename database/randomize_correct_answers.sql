-- Fix: Randomize correct answers in database
-- Currently all questions have correct = 'A'
-- This script will randomly assign B, C, or D to some questions

-- Update approximately 25% of questions to have correct answer B
UPDATE code_quest_questions
SET correct = 'B'
WHERE tier = 1
  AND MOD(CAST(SUBSTRING(id::text, 1, 8) AS bit(32))::integer, 4) = 1
  AND correct = 'A';

-- Update approximately 25% of questions to have correct answer C
UPDATE code_quest_questions
SET correct = 'C'
WHERE tier = 1
  AND MOD(CAST(SUBSTRING(id::text, 1, 8) AS bit(32))::integer, 4) = 2
  AND correct = 'A';

-- Update approximately 25% of questions to have correct answer D
UPDATE code_quest_questions
SET correct = 'D'
WHERE tier = 1
  AND MOD(CAST(SUBSTRING(id::text, 1, 8) AS bit(32))::integer, 4) = 3
  AND correct = 'A';

-- Remaining 25% will stay as 'A'

-- Verify distribution
SELECT correct, COUNT(*)
FROM code_quest_questions
WHERE tier = 1
GROUP BY correct
ORDER BY correct;
