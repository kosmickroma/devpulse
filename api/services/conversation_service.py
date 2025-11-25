"""
SYNTH Conversation Service - Handles both source searches and general chat.

Routes queries intelligently:
- Source searches: "find Python repos" → Search GitHub/Reddit/HN
- General questions: "what are NBA odds tonight?" → Direct Gemini response
- Mixed queries: "what's trending in AI?" → Sources + AI commentary
"""

from typing import Dict, Any, Optional
from api.services.synth_search_service_v2 import SynthSearchServiceV2
from api.services.gemini_service import GeminiService
from api.services.intent_classifier import IntentClassifier
from supabase import create_client, Client
import os


class ConversationService:
    """Unified service for SYNTH conversations - searches + general chat."""

    def __init__(self):
        """Initialize conversation service."""
        self.search_service = SynthSearchServiceV2()
        self.gemini = GeminiService()

        # NEW: Initialize IntentClassifier for pattern-based classification
        try:
            self.intent_classifier = IntentClassifier()
            print("✅ IntentClassifier initialized (shadow mode)")
        except Exception as e:
            print(f"⚠️ IntentClassifier failed to initialize: {e}")
            self.intent_classifier = None

        # Supabase for persistent conversation history
        try:
            SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
            SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
            if SUPABASE_URL and SUPABASE_KEY:
                self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
            else:
                self.supabase = None
                print("⚠️ Supabase not configured for conversation memory")
        except Exception as e:
            print(f"⚠️ Failed to initialize Supabase: {e}")
            self.supabase = None

        # Fallback in-memory history if DB unavailable
        self.conversation_history: Dict[str, str] = {}

        # Explicit search commands (highest priority)
        self.explicit_search_commands = [
            'search for', 'search all', 'find me', 'show me', 'get me', 'look for',
            'scan github', 'scan reddit', 'scan hackernews', 'scan all',
            'give me', 'show', 'discover', 'fetch', 'search'
        ]

        # Source mentions (high priority for search)
        self.source_mentions = [
            'on github', 'on reddit', 'on hackernews', 'on hacker news',
            'from github', 'from reddit', 'from hackernews', 'from hacker news',
            'github repo', 'reddit thread', 'hn post', 'hackernews', 'hacker news'
        ]

        # Conversational phrases (override ambiguous keywords)
        self.conversational_phrases = [
            'thank you', 'thanks', 'good job', 'nice work', 'nice job',
            'awesome', 'cool', 'great', 'excellent', 'perfect',
            'hey synth', 'hello', 'hi synth', 'hi there',
            'how are you', 'what\'s up', 'whats up'
        ]

    def detect_query_type(self, query: str) -> str:
        """
        Detect if query is a source search or general question.

        Uses Boolean logic with priority:
        1. Explicit search commands → search (highest priority)
        2. Source mentions → search
        3. Pure conversational phrases → chat (only if no search commands)
        4. Ambiguous → search (safer default)

        Args:
            query: User's query

        Returns:
            'search' | 'chat'
        """
        query_lower = query.lower()

        # PRIORITY 1: Explicit search commands - always trigger search
        has_explicit_search = any(cmd in query_lower for cmd in self.explicit_search_commands)

        # PRIORITY 2: Source mentions - high confidence for search
        has_source_mention = any(src in query_lower for src in self.source_mentions)

        # PRIORITY 3: Conversational phrases
        has_conversational_phrase = any(phrase in query_lower for phrase in self.conversational_phrases)

        # Boolean logic decision
        if has_explicit_search:
            return 'search'  # "thank you now search for X" → search
        elif has_source_mention:
            return 'search'  # "what's on github today" → search
        elif has_conversational_phrase and not has_explicit_search:
            return 'chat'    # "good job on that scan" → chat
        else:
            # Ambiguous cases - check for search-related nouns/adjectives
            search_indicators = [
                'repo', 'repository', 'project', 'code', 'trending', 'popular', 'latest',
                'tutorial', 'tutorials', 'discussion', 'discussions', 'article', 'articles',
                'post', 'posts', 'thread', 'threads', 'examples', 'resources',
                'tools', 'libraries', 'frameworks', 'packages'
            ]
            has_search_indicators = any(indicator in query_lower for indicator in search_indicators)

            if has_search_indicators:
                return 'search'
            else:
                return 'chat'  # Default to chat for truly ambiguous queries

    async def handle_query(self, query: str, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Handle any query - route to search or chat as needed.

        Args:
            query: User's natural language query
            user_id: Optional user ID for conversation memory

        Returns:
            Unified response with results and commentary
        """
        # Check for follow-up queries that need context
        follow_up_keywords = ['dive deeper', 'dig', 'tell me more', 'explain more', 'continue', 'go on', 'elaborate']
        is_follow_up = any(kw in query.lower() for kw in follow_up_keywords)

        # If it's a follow-up and we have history, add context
        if is_follow_up and user_id:
            last_query = await self._get_last_query(user_id)
            if last_query:
                query = f"{query} about {last_query}"
                print(f"💭 SYNTH adding context from DB: {last_query}")

        query_type = self.detect_query_type(query)
        print(f"🤖 SYNTH detected query type: {query_type}")

        # SHADOW MODE: Test IntentClassifier alongside current system
        if self.intent_classifier:
            try:
                intent_result = self.intent_classifier.classify(query)
                print(f"🔬 SHADOW MODE - IntentClassifier Results:")
                print(f"   Confidence: {intent_result.confidence:.2f}")
                print(f"   Intent: {intent_result.intent_type.value}")
                print(f"   Sources: {intent_result.sources}")
                print(f"   Keywords: {intent_result.keywords}")
                print(f"   Entities: {intent_result.entities}")
                print(f"   Time: {intent_result.classification_time_ms:.2f}ms")
                print(f"   Time Sensitive: {intent_result.time_sensitive}")
            except Exception as e:
                print(f"⚠️ SHADOW MODE - IntentClassifier error: {e}")

        if query_type == 'search':
            result = await self._handle_search(query)
        else:
            result = await self._handle_chat(query, user_id=user_id)

        # Store query in conversation history (DB or memory)
        if user_id:
            await self._save_query(user_id, query)

        return result

    async def _get_last_query(self, user_id: str) -> Optional[str]:
        """Get user's last query from DB or memory (for simple follow-ups)."""
        queries = await self._get_conversation_window(user_id, limit=1)
        return queries[0] if queries else None

    async def _get_conversation_window(self, user_id: str, limit: int = 5) -> list[str]:
        """Get user's last N queries for conversation context."""
        if self.supabase:
            try:
                response = self.supabase.table('conversations')\
                    .select('query_text')\
                    .eq('user_id', user_id)\
                    .order('created_at', desc=True)\
                    .limit(limit)\
                    .execute()

                if response.data:
                    # Return in chronological order (oldest first)
                    return [item['query_text'] for item in reversed(response.data)]
            except Exception as e:
                print(f"⚠️ DB query failed, using memory: {e}")

        # Fallback to in-memory (only has 1 query)
        last_query = self.conversation_history.get(user_id)
        return [last_query] if last_query else []

    async def _save_query(self, user_id: str, query: str):
        """Save query to DB or memory."""
        # Always save to memory as fallback
        self.conversation_history[user_id] = query

        # Try to save to DB
        if self.supabase:
            try:
                self.supabase.table('conversations').insert({
                    'user_id': user_id,
                    'query_text': query,
                    'response_text': '',  # We don't store full responses yet
                    'response_type': 'chat'  # Changed from 'unknown' to valid type
                }).execute()
            except Exception as e:
                print(f"⚠️ DB save failed, memory only: {e}")

    async def _handle_search(self, query: str) -> Dict[str, Any]:
        """Handle source search queries."""
        search_results = await self.search_service.search(query)

        return {
            'type': 'search',
            'query': query,
            'results': search_results.get('results', []),
            'commentary': search_results.get('commentary', ''),
            'total_found': search_results.get('total_found', 0),
            'intent': search_results.get('intent', {}),
            'errors': search_results.get('errors')
        }

    async def _handle_chat(self, query: str, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Handle general chat queries (no source search needed).

        Examples:
        - "what are the NBA odds tonight?"
        - "explain quantum computing"
        - "who won the Super Bowl?"
        """
        try:
            # Get conversation context for better responses
            context = None
            if user_id:
                conversation_window = await self._get_conversation_window(user_id, limit=5)
                if conversation_window:
                    context = "Recent conversation:\n" + "\n".join([f"- {q}" for q in conversation_window])
                    print(f"💭 SYNTH using conversation window: {len(conversation_window)} queries")

            # Generate direct answer with SYNTH personality and context
            if context:
                # Combine context + query into a single question
                full_question = f"{context}\n\nCurrent question: {query}"
                response = self.gemini.generate_answer(full_question)
            else:
                response = self.gemini.generate_answer(query)

            return {
                'type': 'chat',
                'query': query,
                'response': response,
                'results': [],  # No source results for general chat
                'commentary': response,
                'total_found': 0
            }

        except Exception as e:
            print(f"❌ Chat mode error: {e}")
            return {
                'type': 'chat',
                'query': query,
                'response': f"Sorry, I encountered an error: {str(e)}",
                'results': [],
                'commentary': '',
                'total_found': 0,
                'error': str(e)
            }
