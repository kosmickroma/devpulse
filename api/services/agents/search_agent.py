"""
Search Agent - Powered by Gemini 2.5 Flash

Handles:
- Fast multi-source searches
- News and trending content
- General queries with specific sources
- Real-time data (stocks, crypto, gaming)

Cost: FREE (10 RPM / 250 RPD on free tier)
Speed: ~100ms response time
Strength: Fast, reliable, good for structured search
"""

import os
from typing import Dict, List
import google.generativeai as genai

from .base_agent import BaseAgent, AgentType, AgentResponse, AgentContext


class SearchAgent(BaseAgent):
    """
    Search specialist using Gemini 2.5 Flash.

    Best for:
    - Multi-source searches
    - News and trending content
    - Specific source queries (Reddit, HackerNews, etc)
    - Gaming, stocks, crypto
    """

    def __init__(self):
        """Initialize Gemini 2.5 Flash client."""
        super().__init__(AgentType.SEARCH)

        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set")

        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        self.model_name = 'gemini-2.5-flash'

        print(f"✅ SearchAgent initialized with {self.model_name}")

    async def respond(self, context: AgentContext) -> AgentResponse:
        """
        Generate search-focused response with Gemini.

        Args:
            context: Query context with intent, entities, etc.

        Returns:
            AgentResponse with search plan and sources
        """
        try:
            # Build the prompt
            prompt = self._build_prompt(context)

            # Call Gemini API
            response = self.model.generate_content(prompt)
            content = response.text.strip()

            # Determine sources to search based on context
            suggested_sources = self._determine_sources(context)

            return AgentResponse(
                success=True,
                content=content,
                agent_type=self.agent_type,
                confidence=0.85,  # Gemini is reliable for search
                suggested_sources=suggested_sources,
                metadata={
                    "model": self.model_name,
                    # Gemini doesn't expose token counts in the same way
                    "prompt_length": len(prompt),
                }
            )

        except Exception as e:
            print(f"❌ SearchAgent error: {e}")
            return self._build_error_response(str(e))

    def can_handle(self, context: AgentContext) -> tuple[bool, float]:
        """
        Check if search agent should handle this query.

        High confidence for:
        - Explicit sources mentioned (Reddit, HN, DevTo, etc)
        - News/discussion/tutorial intents
        - Gaming queries
        - Stock/crypto queries
        - Time-sensitive queries

        Args:
            context: Query context to evaluate

        Returns:
            (can_handle, confidence) tuple
        """
        confidence = 0.0

        # Explicit sources mentioned (excluding GitHub)
        non_github_sources = [s for s in context.detected_sources if s != 'github']
        if non_github_sources:
            confidence += 0.5

        # Specific intent types good for search
        search_friendly_intents = ['news', 'discussion', 'tutorial', 'gaming', 'price_check']
        if context.intent_type in search_friendly_intents:
            confidence += 0.4

        # Gaming entities
        if 'games' in context.entities:
            confidence += 0.3

        # Crypto/stocks
        if 'cryptocurrencies' in context.entities or 'stocks' in context.entities:
            confidence += 0.3

        # Time-sensitive queries
        if context.time_sensitive:
            confidence += 0.2

        # Specific source keywords (not GitHub)
        query_lower = context.original_query.lower()
        source_keywords = [
            'reddit', 'hackernews', 'hacker news', 'hn',
            'devto', 'dev.to', 'news', 'discussion',
            'trending', 'popular', 'latest',
            'gaming', 'game', 'price', 'stock', 'crypto'
        ]

        keyword_matches = sum(1 for kw in source_keywords if kw in query_lower)
        confidence += min(keyword_matches * 0.15, 0.3)

        # Cap confidence at 0.95
        confidence = min(confidence, 0.95)

        # Can handle if confidence > 0.3
        can_handle = confidence > 0.3

        return can_handle, confidence

    def _build_prompt(self, context: AgentContext) -> str:
        """Build prompt for Gemini."""
        prompt = f"""You are SYNTH, a chill AI assistant for DevPulse with an 80s vibe.

User query: {context.original_query}

Intent: {context.intent_type}
"""

        if context.detected_sources:
            sources_str = ", ".join(context.detected_sources)
            prompt += f"Sources to search: {sources_str}\n"

        if context.entities:
            entities_str = ", ".join([
                f"{k}: {', '.join(v)}"
                for k, v in context.entities.items()
            ])
            prompt += f"Entities: {entities_str}\n"

        if context.time_sensitive:
            prompt += "User wants fresh/recent content.\n"

        prompt += """
Respond as SYNTH:
1. Acknowledge what they're looking for
2. Confirm which sources you'll search
3. Keep it brief (2-3 sentences)
4. Be helpful and enthusiastic

Don't make up results - just confirm you'll search."""

        return prompt

    def _determine_sources(self, context: AgentContext) -> List[str]:
        """
        Determine which sources to search based on context.

        Uses the IntentClassifier's source detection but can refine further.

        Args:
            context: Query context

        Returns:
            List of source names to search
        """
        sources = []

        # Start with detected sources
        if context.detected_sources:
            sources = context.detected_sources.copy()
        else:
            # Fall back to intent-based routing
            if context.intent_type == "news":
                sources = ['hackernews', 'reddit', 'devto']
            elif context.intent_type == "discussion":
                sources = ['reddit', 'hackernews']
            elif context.intent_type == "tutorial":
                sources = ['devto', 'github']
            elif context.intent_type == "gaming":
                sources = ['ign', 'pcgamer']
            elif context.intent_type == "price_check":
                sources = ['stocks', 'crypto']
            else:
                # Default multi-source
                sources = ['github', 'reddit', 'hackernews', 'devto']

        # Add crypto/stocks if entities detected
        if 'cryptocurrencies' in context.entities and 'crypto' not in sources:
            sources.insert(0, 'crypto')

        if 'stocks' in context.entities and 'stocks' not in sources:
            sources.insert(0, 'stocks')

        # Add gaming sources if games detected
        if 'games' in context.entities:
            if 'ign' not in sources:
                sources.append('ign')
            if 'pcgamer' not in sources:
                sources.append('pcgamer')

        # Remove duplicates
        seen = set()
        unique_sources = []
        for source in sources:
            if source not in seen:
                seen.add(source)
                unique_sources.append(source)

        return unique_sources
