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
from supabase import create_client, Client
import os


class ConversationService:
    """Unified service for SYNTH conversations - searches + general chat."""

    def __init__(self):
        """Initialize conversation service."""
        self.search_service = SynthSearchServiceV2()
        self.gemini = GeminiService()

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

        # Keywords that indicate source search intent
        self.search_keywords = [
            'find', 'search', 'show', 'get', 'look for', 'discover',
            'trending', 'popular', 'top', 'best', 'latest',
            'github', 'reddit', 'hackernews', 'repo', 'repository',
            'project', 'code', 'discussion', 'post', 'article', 'scan'
        ]

    def detect_query_type(self, query: str) -> str:
        """
        Detect if query is a source search or general question.

        Args:
            query: User's query

        Returns:
            'search' | 'chat' | 'mixed'
        """
        query_lower = query.lower()

        # Check for search keywords
        has_search_keywords = any(kw in query_lower for kw in self.search_keywords)

        # Source-specific detection
        mentions_sources = any(src in query_lower for src in ['github', 'reddit', 'hackernews', 'repo', 'code'])

        if mentions_sources or has_search_keywords:
            return 'search'
        else:
            # General question (NBA odds, explain quantum, etc.)
            return 'chat'

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
                    'response_type': 'unknown'
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
                response = self.gemini.generate_answer(
                    query=query,
                    context=context
                )
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
