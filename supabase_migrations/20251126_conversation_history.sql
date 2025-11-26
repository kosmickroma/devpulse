-- Create conversation history tables for SYNTH AI
-- Stores user conversations and individual queries for recall/resume

-- Main conversations table (one per session)
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,  -- Auto-generated from first query or user-provided
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  query_count int DEFAULT 0,  -- Number of queries in this conversation
  is_saved boolean DEFAULT false,  -- User explicitly saved this conversation
  CONSTRAINT conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Individual queries within conversations
CREATE TABLE IF NOT EXISTS conversation_queries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  query text NOT NULL,  -- The user's search query
  result_count int DEFAULT 0,  -- Number of results returned
  sources jsonb,  -- Array of sources searched: ['github', 'reddit', ...]
  intent jsonb,  -- Intent classification result
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT conversation_queries_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Results for each query (optional, for full history replay)
CREATE TABLE IF NOT EXISTS conversation_results (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  query_id uuid NOT NULL REFERENCES conversation_queries(id) ON DELETE CASCADE,
  result_data jsonb NOT NULL,  -- Full SearchResult object
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT conversation_results_query_id_fkey FOREIGN KEY (query_id) REFERENCES conversation_queries(id) ON DELETE CASCADE
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_created ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_queries_conversation ON conversation_queries(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_conversation_results_query ON conversation_results(query_id);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own conversations
CREATE POLICY "Users can view their own conversations"
ON conversations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
ON conversations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
ON conversations
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
ON conversations
FOR DELETE
USING (auth.uid() = user_id);

-- RLS for queries (inherit from conversation ownership)
CREATE POLICY "Users can view queries in their conversations"
ON conversation_queries
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = conversation_queries.conversation_id
    AND conversations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert queries in their conversations"
ON conversation_queries
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = conversation_queries.conversation_id
    AND conversations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete queries in their conversations"
ON conversation_queries
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = conversation_queries.conversation_id
    AND conversations.user_id = auth.uid()
  )
);

-- RLS for results (inherit from query ownership)
CREATE POLICY "Users can view results in their queries"
ON conversation_results
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_queries cq
    JOIN conversations c ON c.id = cq.conversation_id
    WHERE cq.id = conversation_results.query_id
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert results in their queries"
ON conversation_results
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversation_queries cq
    JOIN conversations c ON c.id = cq.conversation_id
    WHERE cq.id = conversation_results.query_id
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete results in their queries"
ON conversation_results
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM conversation_queries cq
    JOIN conversations c ON c.id = cq.conversation_id
    WHERE cq.id = conversation_results.query_id
    AND c.user_id = auth.uid()
  )
);

-- Function to auto-update conversation updated_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation timestamp when new query added
CREATE TRIGGER update_conversation_on_new_query
AFTER INSERT ON conversation_queries
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();

-- Function to increment query count
CREATE OR REPLACE FUNCTION increment_conversation_query_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET query_count = query_count + 1
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to increment query count
CREATE TRIGGER increment_query_count_on_insert
AFTER INSERT ON conversation_queries
FOR EACH ROW
EXECUTE FUNCTION increment_conversation_query_count();

-- Comments for documentation
COMMENT ON TABLE conversations IS 'User conversation sessions with SYNTH AI';
COMMENT ON TABLE conversation_queries IS 'Individual search queries within conversations';
COMMENT ON TABLE conversation_results IS 'Search results for each query (optional, for full replay)';
COMMENT ON COLUMN conversations.title IS 'Auto-generated from first query or user-provided save name';
COMMENT ON COLUMN conversations.is_saved IS 'User explicitly saved this conversation with a name';
COMMENT ON COLUMN conversation_queries.intent IS 'IntentClassifier result for this query';
