"""
SYNTH v2 Service - Multi-Agent Orchestrator

Orchestrates the multi-agent system:
1. AgentRouter determines best agent for query
2. Agent provides response and source recommendations
3. SearchServiceV2 executes actual searches
4. Results combined with agent insights

Backward compatible with SYNTH v1.
"""

from typing import Dict, List, Any, Optional
import asyncio
from datetime import datetime

from .agent_router import AgentRouter, RoutingDecision
from .agents.base_agent import AgentResponse, AgentType
from .synth_search_service_v2 import SynthSearchServiceV2


class SynthV2Service:
    """
    SYNTH v2 orchestrator with multi-agent intelligence.

    Flow:
    1. Route query to best agent (Conversation/Code/Search)
    2. Agent analyzes and provides guidance
    3. Execute search across recommended sources
    4. Return combined results + agent insights
    """

    def __init__(self):
        """Initialize v2 service with router and search."""
        self.router = AgentRouter()
        self.search_service = SynthSearchServiceV2()

        print("✅ SYNTH v2 Service initialized with multi-agent orchestrator")

    async def search(
        self,
        query: str,
        conversation_history: List[Dict] = None,
        skip_search: bool = False
    ) -> Dict[str, Any]:
        """
        Execute intelligent multi-agent search.

        Args:
            query: User's search query
            conversation_history: Optional conversation context
            skip_search: If True, only return agent response (no search)

        Returns:
            Dict with agent insights and search results
        """
        start_time = datetime.now()

        # Step 1: Route to best agent and get response
        agent_response, routing_decision = await self.router.route_query(
            query,
            conversation_history
        )

        # Step 2: Check if agent needs clarification
        if agent_response.requires_clarification or skip_search:
            # Return agent response only (conversational mode)
            return self._build_conversation_response(
                query,
                agent_response,
                routing_decision,
                start_time
            )

        # Step 3: Determine sources to search
        # Priority: agent suggestions > intent classifier sources
        sources_to_search = agent_response.suggested_sources

        # Step 4: Build modified intent for search service
        # Use existing search service but override sources if agent specified
        if sources_to_search:
            # Execute search with agent-recommended sources
            search_results = await self._search_with_sources(
                query,
                sources_to_search
            )
        else:
            # Fall back to regular search (uses IntentClassifier)
            search_results = await self.search_service.search(query)

        # Step 5: Combine agent insights with search results
        return self._build_search_response(
            query,
            agent_response,
            routing_decision,
            search_results,
            start_time
        )

    async def _search_with_sources(
        self,
        query: str,
        sources: List[str]
    ) -> Dict[str, Any]:
        """
        Execute search with specific sources.

        Args:
            query: Search query
            sources: List of source names to search

        Returns:
            Search results dict
        """
        # Use the existing search service but with modified intent
        # We'll parse the intent first, then override sources
        intent = self.search_service.parse_search_intent(query)
        intent['sources'] = sources  # Override with agent-recommended sources

        # Check cache
        cached = await self.search_service.cache.get_cached_results(query, intent)
        if cached:
            return cached

        # Execute search with modified intent
        # Build search tasks
        search_tasks = []
        for source_name in sources:
            source = self.search_service.registry.get_source(source_name)
            if not source:
                print(f"⚠️ Source not found: {source_name}")
                continue

            # Build filters from intent
            filters = {}
            if source_name == 'github' and intent.get('language'):
                filters['language'] = intent['language']
            if intent.get('time_filter'):
                filters['time_filter'] = intent['time_filter']
            if intent.get('sort_by'):
                filters['sort'] = intent['sort_by']

            # Optimize query for source
            search_query = self.search_service._optimize_query_for_source(
                intent['keywords'],
                source_name,
                query
            )

            result_limit = intent.get('limit') or 15

            print(f"🔍 [v2] {source_name} query: '{search_query}' (limit={result_limit})")

            task = source.search(query=search_query, limit=result_limit, **filters)
            search_tasks.append((source_name, task))

        # Execute in parallel
        results_by_source = await asyncio.gather(
            *[task for _, task in search_tasks],
            return_exceptions=True
        )

        # Collect results
        all_results = []
        errors = []

        for (source_name, _), result in zip(search_tasks, results_by_source):
            if isinstance(result, Exception):
                error_msg = f"Error searching {source_name}: {str(result)}"
                errors.append(error_msg)
                print(f"❌ {error_msg}")
            else:
                all_results.extend(result)

        # Sort results
        all_results.sort(key=lambda x: x.score, reverse=True)

        # Take top results
        top_results = all_results[:intent.get('limit', 15)]

        # Convert to dict format
        results_dict = [r.to_dict() for r in top_results]

        # Generate commentary
        commentary = self.search_service._generate_commentary(query, intent, results_dict)

        # Cache results
        await self.search_service.cache.cache_results(query, intent, results_dict, commentary)

        return {
            'results': results_dict,
            'commentary': commentary,
            'sources': sources,
            'intent': intent,
            'errors': errors
        }

    def _build_conversation_response(
        self,
        query: str,
        agent_response: AgentResponse,
        routing_decision: RoutingDecision,
        start_time: datetime
    ) -> Dict[str, Any]:
        """
        Build response for conversational queries (no search).

        Args:
            query: Original query
            agent_response: Response from agent
            routing_decision: Routing decision made
            start_time: Start time for timing

        Returns:
            Response dict with conversation data
        """
        elapsed_ms = (datetime.now() - start_time).total_seconds() * 1000

        return {
            'mode': 'conversation',
            'query': query,
            'agent': {
                'type': agent_response.agent_type.value,
                'response': agent_response.content,
                'confidence': agent_response.confidence,
                'requires_clarification': agent_response.requires_clarification,
                'clarification_questions': agent_response.clarification_questions,
                'metadata': agent_response.metadata
            },
            'routing': {
                'primary_agent': routing_decision.primary_agent.value,
                'fallback_agents': [a.value for a in routing_decision.fallback_agents],
                'confidence': routing_decision.confidence,
                'reasoning': routing_decision.reasoning
            },
            'timing': {
                'total_ms': round(elapsed_ms, 2)
            }
        }

    def _build_search_response(
        self,
        query: str,
        agent_response: AgentResponse,
        routing_decision: RoutingDecision,
        search_results: Dict[str, Any],
        start_time: datetime
    ) -> Dict[str, Any]:
        """
        Build response with agent insights + search results.

        Args:
            query: Original query
            agent_response: Response from agent
            routing_decision: Routing decision made
            search_results: Results from search service
            start_time: Start time for timing

        Returns:
            Combined response dict
        """
        elapsed_ms = (datetime.now() - start_time).total_seconds() * 1000

        # Enhance the search results with agent insights
        enhanced_results = search_results.copy()

        # Add agent insights
        enhanced_results['agent_insights'] = {
            'type': agent_response.agent_type.value,
            'response': agent_response.content,
            'confidence': agent_response.confidence,
            'metadata': agent_response.metadata
        }

        # Add routing information
        enhanced_results['routing'] = {
            'primary_agent': routing_decision.primary_agent.value,
            'fallback_agents': [a.value for a in routing_decision.fallback_agents],
            'confidence': routing_decision.confidence,
            'reasoning': routing_decision.reasoning
        }

        # Update timing
        if 'timing' in enhanced_results:
            enhanced_results['timing']['total_ms'] = round(elapsed_ms, 2)
        else:
            enhanced_results['timing'] = {'total_ms': round(elapsed_ms, 2)}

        # Add mode
        enhanced_results['mode'] = 'search'
        enhanced_results['query'] = query

        return enhanced_results

    async def get_health(self) -> Dict[str, Any]:
        """
        Get health status of SYNTH v2 service.

        Returns:
            Health status dict
        """
        return {
            'service': 'synth_v2',
            'status': 'healthy',
            'components': {
                'agent_router': 'healthy',
                'search_service': 'healthy',
                'agents': self.router.get_stats()
            },
            'version': '2.0.0'
        }

    async def search_v1_compatible(self, query: str) -> Dict[str, Any]:
        """
        Backward compatible search method (v1 interface).

        This method can be used to gradually migrate from v1 to v2.
        It returns results in v1 format but uses v2 intelligence.

        Args:
            query: Search query

        Returns:
            v1-compatible response dict
        """
        # Get v2 results
        v2_results = await self.search(query)

        # If conversational mode, still do search for v1 compatibility
        if v2_results.get('mode') == 'conversation':
            # Execute search anyway for v1 compatibility
            v1_results = await self.search_service.search(query)
            return v1_results

        # Return search results in v1 format (strip v2-specific fields)
        v1_results = {
            'results': v2_results.get('results', []),
            'commentary': v2_results.get('commentary', ''),
            'sources': v2_results.get('sources', []),
            'intent': v2_results.get('intent', {}),
            'query': query
        }

        return v1_results
