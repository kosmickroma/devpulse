-- ============================================================================
-- PYTHON CODE QUEST - Database Schema
-- Educational Python coding game integrated with DevPulse Arcade
-- ============================================================================

-- Questions table - stores all Python quiz questions
CREATE TABLE IF NOT EXISTS code_quest_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(20) NOT NULL, -- 'output', 'bug', 'fill', 'complete', 'practice'
    difficulty INT NOT NULL CHECK (difficulty BETWEEN 1 AND 10),
    tier INT NOT NULL CHECK (tier BETWEEN 1 AND 6), -- 1=Initiate, 2=Coder, 3=Developer, 4=Architect, 5=Master, 6=Legendary
    topics TEXT[] NOT NULL, -- Array of topic tags
    code TEXT, -- Code snippet for code-based questions
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- {A: "...", B: "...", C: "...", D: "..."}
    correct CHAR(1) NOT NULL CHECK (correct IN ('A', 'B', 'C', 'D')),
    explanation TEXT NOT NULL,
    hint TEXT,
    xp_base INT NOT NULL, -- Base XP before multipliers
    tags TEXT[], -- Additional tags for filtering
    time_limit INT DEFAULT 15, -- Seconds to answer
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cq_questions_difficulty ON code_quest_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_cq_questions_tier ON code_quest_questions(tier);
CREATE INDEX IF NOT EXISTS idx_cq_questions_topics ON code_quest_questions USING GIN(topics);
CREATE INDEX IF NOT EXISTS idx_cq_questions_type ON code_quest_questions(type);

-- User progress table - tracks overall Code Quest progression
CREATE TABLE IF NOT EXISTS code_quest_progress (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_xp INT DEFAULT 0,
    level INT DEFAULT 1,
    current_tier INT DEFAULT 1, -- Which tier they're in
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_play_date DATE,
    total_questions_answered INT DEFAULT 0,
    total_correct INT DEFAULT 0,
    best_combo INT DEFAULT 0,
    streak_freezes INT DEFAULT 0, -- Available streak freezes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cq_progress_user ON code_quest_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_cq_progress_level ON code_quest_progress(level DESC);
CREATE INDEX IF NOT EXISTS idx_cq_progress_streak ON code_quest_progress(current_streak DESC);

-- Topic mastery table - tracks progress in each Python topic
CREATE TABLE IF NOT EXISTS code_quest_topic_mastery (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    topic VARCHAR(50) NOT NULL,
    questions_attempted INT DEFAULT 0,
    questions_correct INT DEFAULT 0,
    mastery_percent FLOAT DEFAULT 0.0,
    last_practiced TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, topic)
);

CREATE INDEX IF NOT EXISTS idx_cq_topic_user ON code_quest_topic_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_cq_topic_mastery ON code_quest_topic_mastery(topic, mastery_percent DESC);

-- Sessions table - tracks individual play sessions
CREATE TABLE IF NOT EXISTS code_quest_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    questions_answered INT NOT NULL,
    questions_correct INT NOT NULL,
    xp_earned INT NOT NULL,
    best_combo INT DEFAULT 0,
    avg_speed FLOAT, -- Average seconds per question
    perfect_session BOOLEAN DEFAULT false, -- No wrong answers
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cq_sessions_user ON code_quest_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_cq_sessions_completed ON code_quest_sessions(completed_at DESC);

-- User answers table - tracks every answer for analytics
CREATE TABLE IF NOT EXISTS code_quest_user_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES code_quest_sessions(id) ON DELETE SET NULL,
    question_id UUID NOT NULL REFERENCES code_quest_questions(id) ON DELETE CASCADE,
    user_answer CHAR(1) NOT NULL,
    correct BOOLEAN NOT NULL,
    time_taken FLOAT NOT NULL, -- Seconds
    xp_earned INT NOT NULL,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cq_answers_user ON code_quest_user_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_cq_answers_question ON code_quest_user_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_cq_answers_session ON code_quest_user_answers(session_id);

-- Daily missions table - tracks mission completion
CREATE TABLE IF NOT EXISTS code_quest_daily_missions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mission_type VARCHAR(50) NOT NULL, -- 'quick_learner', 'perfect_practice', 'speed_demon', 'topic_explorer'
    progress INT DEFAULT 0,
    target INT NOT NULL,
    completed BOOLEAN DEFAULT false,
    xp_reward INT NOT NULL,
    date DATE NOT NULL,
    UNIQUE(user_id, mission_type, date)
);

CREATE INDEX IF NOT EXISTS idx_cq_missions_user_date ON code_quest_daily_missions(user_id, date);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE code_quest_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_quest_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_quest_topic_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_quest_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_quest_user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_quest_daily_missions ENABLE ROW LEVEL SECURITY;

-- Questions are public (everyone can read)
CREATE POLICY "Anyone can read questions"
ON code_quest_questions FOR SELECT
TO authenticated, anon
USING (true);

-- Users can only read/write their own progress
CREATE POLICY "Users can view own progress"
ON code_quest_progress FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
ON code_quest_progress FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
ON code_quest_progress FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can only read/write their own topic mastery
CREATE POLICY "Users can view own topic mastery"
ON code_quest_topic_mastery FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own topic mastery"
ON code_quest_topic_mastery FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- Users can only read/write their own sessions
CREATE POLICY "Users can view own sessions"
ON code_quest_sessions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
ON code_quest_sessions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can only read/write their own answers
CREATE POLICY "Users can view own answers"
ON code_quest_user_answers FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own answers"
ON code_quest_user_answers FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can only read/write their own missions
CREATE POLICY "Users can view own missions"
ON code_quest_daily_missions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own missions"
ON code_quest_daily_missions FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get or create user progress
CREATE OR REPLACE FUNCTION get_or_create_cq_progress(p_user_id UUID)
RETURNS code_quest_progress
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_progress code_quest_progress;
BEGIN
    SELECT * INTO v_progress
    FROM code_quest_progress
    WHERE user_id = p_user_id;

    IF NOT FOUND THEN
        INSERT INTO code_quest_progress (user_id)
        VALUES (p_user_id)
        RETURNING * INTO v_progress;
    END IF;

    RETURN v_progress;
END;
$$;

-- Function to update streak
CREATE OR REPLACE FUNCTION update_cq_streak(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_last_play DATE;
    v_current_streak INT;
BEGIN
    SELECT last_play_date, current_streak INTO v_last_play, v_current_streak
    FROM code_quest_progress
    WHERE user_id = p_user_id;

    IF v_last_play IS NULL THEN
        -- First time playing
        UPDATE code_quest_progress
        SET current_streak = 1,
            longest_streak = 1,
            last_play_date = CURRENT_DATE
        WHERE user_id = p_user_id;
    ELSIF v_last_play = CURRENT_DATE THEN
        -- Already played today, no change
        RETURN;
    ELSIF v_last_play = CURRENT_DATE - INTERVAL '1 day' THEN
        -- Played yesterday, increment streak
        UPDATE code_quest_progress
        SET current_streak = current_streak + 1,
            longest_streak = GREATEST(longest_streak, current_streak + 1),
            last_play_date = CURRENT_DATE
        WHERE user_id = p_user_id;
    ELSE
        -- Streak broken, reset to 1
        UPDATE code_quest_progress
        SET current_streak = 1,
            last_play_date = CURRENT_DATE
        WHERE user_id = p_user_id;
    END IF;
END;
$$;

-- Function to award XP and update level (integrates with arcade XP system)
CREATE OR REPLACE FUNCTION award_cq_xp(
    p_user_id UUID,
    p_xp INT,
    p_session_id UUID DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_old_level INT;
    v_new_level INT;
    v_old_xp INT;
    v_new_xp INT;
    v_leveled_up BOOLEAN := false;
BEGIN
    -- Get current progress
    SELECT total_xp, level INTO v_old_xp, v_old_level
    FROM code_quest_progress
    WHERE user_id = p_user_id;

    -- Update Code Quest XP
    UPDATE code_quest_progress
    SET total_xp = total_xp + p_xp,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Calculate new level (level = floor(sqrt(total_xp / 100)))
    v_new_xp := v_old_xp + p_xp;
    v_new_level := FLOOR(SQRT(v_new_xp / 100.0)) + 1;

    IF v_new_level > v_old_level THEN
        v_leveled_up := true;

        UPDATE code_quest_progress
        SET level = v_new_level,
            current_tier = CASE
                WHEN v_new_level <= 5 THEN 1
                WHEN v_new_level <= 10 THEN 2
                WHEN v_new_level <= 20 THEN 3
                WHEN v_new_level <= 35 THEN 4
                WHEN v_new_level <= 50 THEN 5
                ELSE 6
            END
        WHERE user_id = p_user_id;
    END IF;

    -- CRITICAL: Award XP to global DevPulse arcade system
    -- This makes Code Quest XP count toward Neon Pioneer badge and global leaderboard
    PERFORM award_xp(
        p_user_id,
        p_xp,
        'code_quest',
        'codequest' -- game_id for tracking
    );

    RETURN jsonb_build_object(
        'xp_awarded', p_xp,
        'old_level', v_old_level,
        'new_level', v_new_level,
        'leveled_up', v_leveled_up,
        'total_xp', v_new_xp
    );
END;
$$;

-- Function to update topic mastery
CREATE OR REPLACE FUNCTION update_topic_mastery(
    p_user_id UUID,
    p_topic VARCHAR(50),
    p_correct BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO code_quest_topic_mastery (user_id, topic, questions_attempted, questions_correct, last_practiced)
    VALUES (
        p_user_id,
        p_topic,
        1,
        CASE WHEN p_correct THEN 1 ELSE 0 END,
        NOW()
    )
    ON CONFLICT (user_id, topic) DO UPDATE SET
        questions_attempted = code_quest_topic_mastery.questions_attempted + 1,
        questions_correct = code_quest_topic_mastery.questions_correct + CASE WHEN p_correct THEN 1 ELSE 0 END,
        mastery_percent = (code_quest_topic_mastery.questions_correct + CASE WHEN p_correct THEN 1 ELSE 0 END)::FLOAT
                         / (code_quest_topic_mastery.questions_attempted + 1)::FLOAT * 100.0,
        last_practiced = NOW();
END;
$$;

-- ============================================================================
-- INITIAL DATA - System-wide badges for Code Quest achievements
-- ============================================================================

-- Add Code Quest badges to main DevPulse badge system
INSERT INTO badges (id, name, description, icon, rarity, unlockable) VALUES
    ('python_prodigy', 'Python Prodigy', 'Reached Level 10 in Python Code Quest, mastering the fundamentals of Python programming.', '🐍', 'rare', true),
    ('syntax_savant', 'Syntax Savant', 'Achieved 100% mastery in 3 Python topics. A true expert in Python syntax and structure.', '📚', 'epic', true),
    ('speed_coder', 'Speed Coder', 'Maintained an average answer time under 2 seconds across 100 questions. Lightning-fast Python knowledge.', '⚡', 'rare', true),
    ('streak_legend', 'Streak Legend', 'Maintained a 100-day streak in Code Quest. Dedication and consistency personified.', '🔥', 'legendary', true),
    ('perfect_mind', 'Perfect Mind', 'Completed 10 perfect sessions with zero wrong answers. Flawless execution.', '💎', 'epic', true),
    ('topic_master', 'Topic Master', 'Reached 100% mastery in any Python topic. Complete domain expertise.', '🎯', 'uncommon', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VIEWS FOR LEADERBOARD INTEGRATION
-- ============================================================================

-- Code Quest leaderboard view (integrates with main arcade leaderboard)
CREATE OR REPLACE VIEW code_quest_leaderboard AS
SELECT
    cqp.user_id,
    up.username,
    cqp.total_xp as score,
    cqp.level,
    cqp.current_streak,
    cqp.updated_at as achieved_at,
    NULL as metadata, -- For compatibility with arcade leaderboard
    -- Include equipped badge info
    b.icon as badge_icon,
    b.name as badge_name,
    b.rarity as badge_rarity
FROM
    code_quest_progress cqp
    INNER JOIN user_profiles up ON cqp.user_id = up.id
    LEFT JOIN user_badges ub ON cqp.user_id = ub.user_id AND ub.is_equipped = true
    LEFT JOIN badges b ON ub.badge_id = b.id
ORDER BY
    cqp.total_xp DESC;

-- ============================================================================
-- CODE QUEST DATABASE READY!
-- ============================================================================
-- Fully integrated with DevPulse Arcade ecosystem:
-- - XP counts toward global DevPulse XP and Neon Pioneer badge
-- - Badges appear in main badge collection
-- - Leaderboard integrated with arcade leaderboard
-- ============================================================================
