"""
Agent Router - Routes queries to the best agent

Uses existing IntentClassifier to understand queries, then routes to:
- ConversationAgent: Vague/open-ended queries
- CodeAgent: GitHub/technical queries
- SearchAgent: Multi-source/news/gaming queries

Implements fallback chains if primary agent fails.
"""

from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass

from .intent_classifier import IntentClassifier, IntentResult
from .agents.base_agent import AgentContext, AgentResponse, AgentType
from .agents.conversation_agent import ConversationAgent
from .agents.code_agent import CodeAgent
from .agents.search_agent import SearchAgent


@dataclass
class RoutingDecision:
    """Decision made by router about which agent to use."""
    primary_agent: AgentType
    fallback_agents: List[AgentType]
    confidence: float
    reasoning: str


class AgentRouter:
    """
    Routes queries to the most appropriate agent.

    Uses IntentClassifier for fast pattern matching, then
    evaluates each agent's can_handle() for final decision.
    """

    def __init__(self):
        """Initialize router with intent classifier and agents."""
        # Initialize IntentClassifier
        self.intent_classifier = IntentClassifier()

        # Initialize agents (lazy loading to avoid unnecessary API calls)
        self._conversation_agent: Optional[ConversationAgent] = None
        self._code_agent: Optional[CodeAgent] = None
        self._search_agent: Optional[SearchAgent] = None

        print("✅ AgentRouter initialized with IntentClassifier")

    def _get_conversation_agent(self) -> ConversationAgent:
        """Lazy load conversation agent."""
        if self._conversation_agent is None:
            self._conversation_agent = ConversationAgent()
        return self._conversation_agent

    def _get_code_agent(self) -> CodeAgent:
        """Lazy load code agent."""
        if self._code_agent is None:
            self._code_agent = CodeAgent()
        return self._code_agent

    def _get_search_agent(self) -> SearchAgent:
        """Lazy load search agent."""
        if self._search_agent is None:
            self._search_agent = SearchAgent()
        return self._search_agent

    async def route_query(self, query: str, conversation_history: List[Dict] = None) -> Tuple[AgentResponse, RoutingDecision]:
        """
        Route query to best agent and get response.

        Args:
            query: User's search query
            conversation_history: Optional conversation context

        Returns:
            Tuple of (AgentResponse, RoutingDecision)
        """
        # Step 1: Use IntentClassifier for fast analysis
        intent_result = self.intent_classifier.classify(query)

        # Step 2: Build agent context
        context = self._build_context(intent_result, conversation_history)

        # Step 3: Determine best agent
        routing_decision = self._determine_best_agent(context)

        # Step 4: Execute with fallback chain
        response = await self._execute_with_fallback(
            context,
            routing_decision.primary_agent,
            routing_decision.fallback_agents
        )

        return response, routing_decision

    def _build_context(self, intent_result: IntentResult, conversation_history: List[Dict] = None) -> AgentContext:
        """
        Build AgentContext from IntentResult.

        Args:
            intent_result: Result from IntentClassifier
            conversation_history: Optional conversation context

        Returns:
            AgentContext for agents to use
        """
        return AgentContext(
            original_query=intent_result.original_query,
            intent_type=intent_result.intent_type.value,
            detected_sources=intent_result.sources,
            entities=intent_result.entities,
            keywords=intent_result.keywords,
            time_sensitive=intent_result.time_sensitive,
            conversation_history=conversation_history or []
        )

    def _determine_best_agent(self, context: AgentContext) -> RoutingDecision:
        """
        Determine which agent should handle this query.

        Checks each agent's can_handle() method and picks best match.

        Args:
            context: Query context

        Returns:
            RoutingDecision with primary and fallback agents
        """
        # Get all agents (don't instantiate yet)
        agent_scores = []

        # Check ConversationAgent
        try:
            conv_agent = self._get_conversation_agent()
            can_handle, confidence = conv_agent.can_handle(context)
            if can_handle:
                agent_scores.append((AgentType.CONVERSATION, confidence))
        except Exception as e:
            print(f"⚠️ ConversationAgent check failed: {e}")

        # Check CodeAgent
        try:
            code_agent = self._get_code_agent()
            can_handle, confidence = code_agent.can_handle(context)
            if can_handle:
                agent_scores.append((AgentType.CODE, confidence))
        except Exception as e:
            print(f"⚠️ CodeAgent check failed: {e}")

        # Check SearchAgent
        try:
            search_agent = self._get_search_agent()
            can_handle, confidence = search_agent.can_handle(context)
            if can_handle:
                agent_scores.append((AgentType.SEARCH, confidence))
        except Exception as e:
            print(f"⚠️ SearchAgent check failed: {e}")

        # Sort by confidence
        agent_scores.sort(key=lambda x: x[1], reverse=True)

        # Determine primary and fallbacks
        if agent_scores:
            primary_agent = agent_scores[0][0]
            primary_confidence = agent_scores[0][1]
            fallback_agents = [agent for agent, _ in agent_scores[1:]]
        else:
            # Default to search agent if no matches
            primary_agent = AgentType.SEARCH
            primary_confidence = 0.5
            fallback_agents = [AgentType.CONVERSATION]

        reasoning = self._build_reasoning(context, agent_scores)

        return RoutingDecision(
            primary_agent=primary_agent,
            fallback_agents=fallback_agents,
            confidence=primary_confidence,
            reasoning=reasoning
        )

    async def _execute_with_fallback(
        self,
        context: AgentContext,
        primary_agent: AgentType,
        fallback_agents: List[AgentType]
    ) -> AgentResponse:
        """
        Execute query with primary agent and fallback chain.

        Args:
            context: Query context
            primary_agent: Primary agent to try
            fallback_agents: Fallback agents if primary fails

        Returns:
            AgentResponse from successful agent
        """
        # Try primary agent
        try:
            agent = self._get_agent(primary_agent)
            response = await agent.respond(context)

            if response.success:
                return response

            print(f"⚠️ {primary_agent.value} failed, trying fallbacks...")

        except Exception as e:
            print(f"❌ {primary_agent.value} error: {e}")

        # Try fallback agents
        for fallback_type in fallback_agents:
            try:
                agent = self._get_agent(fallback_type)
                response = await agent.respond(context)

                if response.success:
                    print(f"✅ Fallback {fallback_type.value} succeeded")
                    return response

            except Exception as e:
                print(f"❌ Fallback {fallback_type.value} error: {e}")
                continue

        # All agents failed - return error response
        return AgentResponse(
            success=False,
            content="I'm having trouble processing your query right now. Please try again.",
            agent_type=primary_agent,
            confidence=0.0,
            error="All agents failed"
        )

    def _get_agent(self, agent_type: AgentType):
        """Get agent instance by type."""
        if agent_type == AgentType.CONVERSATION:
            return self._get_conversation_agent()
        elif agent_type == AgentType.CODE:
            return self._get_code_agent()
        elif agent_type == AgentType.SEARCH:
            return self._get_search_agent()
        else:
            raise ValueError(f"Unknown agent type: {agent_type}")

    def _build_reasoning(self, context: AgentContext, agent_scores: List[Tuple[AgentType, float]]) -> str:
        """Build human-readable reasoning for routing decision."""
        reasoning_parts = []

        # Intent
        reasoning_parts.append(f"Intent: {context.intent_type}")

        # Sources
        if context.detected_sources:
            reasoning_parts.append(f"Sources: {', '.join(context.detected_sources)}")

        # Entities
        if context.entities:
            entity_types = list(context.entities.keys())
            reasoning_parts.append(f"Entities: {', '.join(entity_types)}")

        # Agent scores
        if agent_scores:
            scores_str = ", ".join([
                f"{agent.value}={conf:.2f}"
                for agent, conf in agent_scores
            ])
            reasoning_parts.append(f"Scores: {scores_str}")

        return " | ".join(reasoning_parts)

    def get_stats(self) -> Dict:
        """Get router statistics."""
        return {
            "intent_classifier_loaded": True,
            "conversation_agent_loaded": self._conversation_agent is not None,
            "code_agent_loaded": self._code_agent is not None,
            "search_agent_loaded": self._search_agent is not None,
        }
