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


class ConversationService:
    """Unified service for SYNTH conversations - searches + general chat."""

    def __init__(self):
        """Initialize conversation service."""
        self.search_service = SynthSearchServiceV2()
        self.gemini = GeminiService()

        # Keywords that indicate source search intent
        self.search_keywords = [
            'find', 'search', 'show', 'get', 'look for', 'discover',
            'trending', 'popular', 'top', 'best', 'latest',
            'github', 'reddit', 'hackernews', 'repo', 'repository',
            'project', 'code', 'discussion', 'post', 'article'
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

    async def handle_query(self, query: str) -> Dict[str, Any]:
        """
        Handle any query - route to search or chat as needed.

        Args:
            query: User's natural language query

        Returns:
            Unified response with results and commentary
        """
        query_type = self.detect_query_type(query)
        print(f"🤖 SYNTH detected query type: {query_type}")

        if query_type == 'search':
            # Route to source search
            return await self._handle_search(query)
        else:
            # Route to general chat
            return await self._handle_chat(query)

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

    async def _handle_chat(self, query: str) -> Dict[str, Any]:
        """
        Handle general chat queries (no source search needed).

        Examples:
        - "what are the NBA odds tonight?"
        - "explain quantum computing"
        - "who won the Super Bowl?"
        """
        try:
            # Generate direct answer with SYNTH personality
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
