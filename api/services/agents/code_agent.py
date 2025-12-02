"""
Code Agent - Powered by GPT-4o mini

Handles:
- GitHub repository searches
- Technical/code-related queries
- Programming language specific questions
- Framework and library recommendations

Cost: ~$0.15/M tokens (very cheap)
Speed: ~150ms response time
Strength: Better at code analysis and GitHub queries
"""

import os
from typing import Dict, List
from openai import AsyncOpenAI

from .base_agent import BaseAgent, AgentType, AgentResponse, AgentContext


class CodeAgent(BaseAgent):
    """
    Code specialist using GPT-4o mini.

    Best for:
    - GitHub repository searches
    - Code-related queries
    - Technical discussions
    - Programming language questions
    """

    def __init__(self):
        """Initialize GPT-4o mini client."""
        super().__init__(AgentType.CODE)

        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")

        self.client = AsyncOpenAI(api_key=api_key)
        self.model_name = "gpt-4o-mini"

        print(f"✅ CodeAgent initialized with {self.model_name}")

    async def respond(self, context: AgentContext) -> AgentResponse:
        """
        Generate code-focused response with GPT-4o mini.

        Args:
            context: Query context with intent, entities, etc.

        Returns:
            AgentResponse with code recommendations
        """
        try:
            # Build messages
            system_message = self._build_system_prompt()
            user_message = self._build_user_message(context)

            # Call OpenAI API
            response = await self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.7,
                max_tokens=1024
            )

            # Parse response
            content = response.choices[0].message.content

            # Extract suggested sources (GitHub should be primary)
            suggested_sources = ['github']

            # Add devto if tutorial-related
            if context.intent_type == "tutorial" or "tutorial" in context.original_query.lower():
                suggested_sources.append('devto')

            # Add specific sources if entities suggest them
            if 'cryptocurrencies' in context.entities:
                suggested_sources.append('crypto')
            if 'stocks' in context.entities:
                suggested_sources.append('stocks')

            return AgentResponse(
                success=True,
                content=content,
                agent_type=self.agent_type,
                confidence=0.9,  # GPT-4o mini is great at code
                suggested_sources=suggested_sources,
                metadata={
                    "model": self.model_name,
                    "tokens_used": response.usage.total_tokens,
                    "input_tokens": response.usage.prompt_tokens,
                    "output_tokens": response.usage.completion_tokens,
                }
            )

        except Exception as e:
            print(f"❌ CodeAgent error: {e}")
            return self._build_error_response(str(e))

    def can_handle(self, context: AgentContext) -> tuple[bool, float]:
        """
        Check if code agent should handle this query.

        High confidence for:
        - GitHub explicitly mentioned
        - CODE_SEARCH intent
        - Programming entities (languages, frameworks)
        - Repo/project keywords

        Args:
            context: Query context to evaluate

        Returns:
            (can_handle, confidence) tuple
        """
        confidence = 0.0

        # GitHub explicitly mentioned
        if 'github' in context.detected_sources:
            confidence += 0.5

        # Code search intent
        if context.intent_type == "code_search":
            confidence += 0.4

        # Programming entities detected
        has_language = 'languages' in context.entities and context.entities['languages']
        has_framework = 'frameworks' in context.entities and context.entities['frameworks']

        if has_language:
            confidence += 0.3
        if has_framework:
            confidence += 0.2

        # Repo/code keywords
        query_lower = context.original_query.lower()
        code_keywords = [
            'repo', 'repository', 'repositories',
            'code', 'project', 'projects',
            'library', 'libraries', 'package',
            'framework', 'open source', 'stars',
            'github', 'implementation'
        ]

        keyword_matches = sum(1 for kw in code_keywords if kw in query_lower)
        confidence += min(keyword_matches * 0.15, 0.4)

        # Cap confidence at 0.95
        confidence = min(confidence, 0.95)

        # Can handle if confidence > 0.4
        can_handle = confidence > 0.4

        return can_handle, confidence

    def _build_system_prompt(self) -> str:
        """Build system prompt for GPT-4o mini."""
        return """You are SYNTH, a chill AI assistant for DevPulse with an 80s vibe.

You specialize in helping developers find:
- GitHub repositories and projects
- Code examples and implementations
- Programming libraries and frameworks
- Technical resources and tools

When responding to code queries:
1. Acknowledge what the user is looking for
2. Provide brief context about the technology/topic
3. Mention that you'll search GitHub and relevant sources
4. Keep it concise (2-4 sentences)
5. Be technical but approachable

Use SYNTH personality but stay focused on technical accuracy.
Don't make up repository names or specific projects - let the search find real results."""

    def _build_user_message(self, context: AgentContext) -> str:
        """Build user message with context."""
        message = f"User query: {context.original_query}\n\n"

        # Add detected languages
        if 'languages' in context.entities:
            langs = ", ".join(context.entities['languages'])
            message += f"Languages: {langs}\n"

        # Add detected frameworks
        if 'frameworks' in context.entities:
            frameworks = ", ".join(context.entities['frameworks'])
            message += f"Frameworks: {frameworks}\n"

        # Add topics
        if 'topics' in context.entities:
            topics = ", ".join(context.entities['topics'])
            message += f"Topics: {topics}\n"

        # Add stars/quality requirements if mentioned
        if 'stars' in context.original_query.lower() or '1000+' in context.original_query:
            message += "User wants high-quality repos (significant stars).\n"

        message += "\nRespond as SYNTH. Confirm understanding and prepare to search GitHub."

        return message
