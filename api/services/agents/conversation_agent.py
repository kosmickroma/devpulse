"""
Conversation Agent - Powered by Claude 3.5 Haiku

Handles:
- Vague queries ("I want to learn something")
- Ambiguous questions that need clarification
- Follow-up conversations
- Guidance and recommendations

Cost: ~$0.80/M tokens (cheap for conversations)
Speed: ~200ms response time
"""

import os
from typing import Dict, List
import anthropic

from .base_agent import BaseAgent, AgentType, AgentResponse, AgentContext


class ConversationAgent(BaseAgent):
    """
    Conversation specialist using Claude 3.5 Haiku.

    Best for:
    - Vague/ambiguous queries
    - Asking clarifying questions
    - Providing guidance
    - Context-aware conversations
    """

    def __init__(self):
        """Initialize Claude 3.5 Haiku client."""
        super().__init__(AgentType.CONVERSATION)

        api_key = os.getenv('ANTHROPIC_API_KEY')
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable not set")

        self.client = anthropic.Anthropic(api_key=api_key)
        self.model_name = "claude-3-5-haiku-20241022"

        print(f"✅ ConversationAgent initialized with {self.model_name}")

    async def respond(self, context: AgentContext) -> AgentResponse:
        """
        Generate conversational response with Claude.

        Args:
            context: Query context with intent, entities, etc.

        Returns:
            AgentResponse with clarifications or guidance
        """
        try:
            # Build the prompt based on query clarity
            system_prompt = self._build_system_prompt()
            user_message = self._build_user_message(context)

            # Call Claude API
            response = self.client.messages.create(
                model=self.model_name,
                max_tokens=1024,
                temperature=0.7,  # Slightly creative for conversations
                system=system_prompt,
                messages=[{"role": "user", "content": user_message}]
            )

            # Parse response
            content = response.content[0].text

            # Check if Claude is asking questions (heuristic)
            requires_clarification = '?' in content and len(content.split('?')) > 1

            # Extract questions if present
            clarification_questions = []
            if requires_clarification:
                # Split by question marks and clean up
                questions = [q.strip() + '?' for q in content.split('?') if q.strip()]
                clarification_questions = questions[:3]  # Max 3 questions

            return AgentResponse(
                success=True,
                content=content,
                agent_type=self.agent_type,
                confidence=0.85,  # Claude is good at conversations
                requires_clarification=requires_clarification,
                clarification_questions=clarification_questions,
                metadata={
                    "model": self.model_name,
                    "tokens_used": response.usage.input_tokens + response.usage.output_tokens,
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens,
                }
            )

        except Exception as e:
            print(f"❌ ConversationAgent error: {e}")
            return self._build_error_response(str(e))

    def can_handle(self, context: AgentContext) -> tuple[bool, float]:
        """
        Check if conversation agent should handle this query.

        High confidence for:
        - Vague queries (few keywords)
        - General intent type
        - No explicit sources mentioned
        - Open-ended questions

        Args:
            context: Query context to evaluate

        Returns:
            (can_handle, confidence) tuple
        """
        confidence = 0.0

        # Vague queries with few keywords
        if len(context.keywords) < 3:
            confidence += 0.3

        # General intent (ambiguous)
        if context.intent_type == "general":
            confidence += 0.4

        # No explicit sources mentioned
        if not context.detected_sources:
            confidence += 0.2

        # Open-ended patterns
        query_lower = context.original_query.lower()
        open_ended_patterns = [
            "i want to learn",
            "teach me",
            "help me find",
            "recommend",
            "suggest",
            "what should i",
            "how do i start",
            "where do i begin",
        ]

        if any(pattern in query_lower for pattern in open_ended_patterns):
            confidence += 0.3

        # Questions without specifics
        if '?' in context.original_query and len(context.entities) == 0:
            confidence += 0.2

        # Cap confidence at 0.95
        confidence = min(confidence, 0.95)

        # Can handle if confidence > 0.3
        can_handle = confidence > 0.3

        return can_handle, confidence

    def _build_system_prompt(self) -> str:
        """Build system prompt for Claude."""
        return """You are SYNTH, a chill AI assistant for DevPulse with an 80s vibe.

Your role is to help users explore and discover content across:
- Development (GitHub repos, tutorials, discussions)
- Gaming (news, reviews, releases)
- Technology (trends, tools, frameworks)

When users ask vague or open-ended questions:
1. Ask 2-3 clarifying questions to understand what they want
2. Suggest specific areas they might be interested in
3. Guide them toward more specific queries
4. Be friendly, helpful, and conversational

When users are more specific:
1. Acknowledge what they're looking for
2. Confirm you understand their intent
3. Let them know you'll search for relevant content

Keep responses concise (2-4 sentences). Use SYNTH personality but don't overdo the 80s references.
Be genuinely helpful and guide users to better searches."""

    def _build_user_message(self, context: AgentContext) -> str:
        """Build user message with context."""
        message = f"User query: {context.original_query}\n\n"

        # Add detected intent if available
        if context.intent_type and context.intent_type != "general":
            message += f"Detected intent: {context.intent_type}\n"

        # Add entities if available
        if context.entities:
            entities_str = ", ".join([
                f"{k}: {', '.join(v)}"
                for k, v in context.entities.items()
            ])
            message += f"Entities detected: {entities_str}\n"

        # Add if time-sensitive
        if context.time_sensitive:
            message += "User wants recent/fresh content.\n"

        message += "\nRespond as SYNTH. Help the user find what they need."

        return message
