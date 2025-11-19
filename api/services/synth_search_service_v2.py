"""
SYNTH Search Service V2 - Unified Source Architecture + Parallel Execution

Uses new SourceRegistry for clean, fast, reliable searches.
Fixes 'stars' KeyError and enables parallel multi-source searching.
"""

from typing import Dict, List, Any, Optional
import asyncio
import re
from api.services.source_registry import get_registry, SearchResult
from api.services.sources import GitHubSource, RedditSource, HackerNewsSource
from api.services.gemini_service import GeminiService


class SynthSearchServiceV2:
    """Refactored SYNTH search service using unified source interface."""

    def __init__(self):
        """Initialize search service with source registry."""
        self.gemini = GeminiService()
        self.registry = get_registry()

        # Register all sources
        self._register_sources()

        # Source keywords for intent detection
        self.source_keywords = {
            'github': ['github', 'repo', 'repository', 'code', 'project', 'open source', 'opensource'],
            'reddit': ['reddit', 'discussion', 'community', 'thread', 'post'],
            'hackernews': ['hackernews', 'hn', 'hacker news', 'tech news'],
        }

        # Programming language keywords
        self.language_keywords = [
            'python', 'javascript', 'typescript', 'java', 'go', 'rust', 'c++', 'cpp',
            'c#', 'csharp', 'ruby', 'php', 'swift', 'kotlin', 'dart', 'scala',
            'elixir', 'haskell', 'clojure', 'r', 'julia', 'lua', 'perl', 'shell'
        ]

    def _register_sources(self):
        """Register all available search sources."""
        try:
            self.registry.register(GitHubSource())
        except Exception as e:
            print(f"⚠️ Failed to register GitHub: {e}")

        try:
            self.registry.register(RedditSource())
        except Exception as e:
            print(f"⚠️ Failed to register Reddit: {e}")

        try:
            self.registry.register(HackerNewsSource())
        except Exception as e:
            print(f"⚠️ Failed to register HackerNews: {e}")

    def parse_search_intent(self, query: str) -> Dict[str, Any]:
        """
        Parse user query to determine search intent.

        Args:
            query: User's natural language query

        Returns:
            Dict with sources, language, keywords
        """
        query_lower = query.lower()

        # Detect sources
        detected_sources = []
        for source, keywords in self.source_keywords.items():
            if any(keyword in query_lower for keyword in keywords):
                detected_sources.append(source)

        # If no source specified, search all available
        if not detected_sources:
            detected_sources = self.registry.get_source_names()

        # Detect programming language
        detected_language = None
        for lang in self.language_keywords:
            if lang in query_lower:
                detected_language = lang.capitalize()
                break

        # Extract keywords
        stop_words = ['find', 'me', 'some', 'show', 'get', 'search', 'for', 'about',
                      'the', 'a', 'an', 'on', 'in', 'from', 'with', 'that', 'this',
                      'can', 'you', 'what', 'where', 'when', 'why', 'how', 'scan', 'all', 'sources']
        words = re.findall(r'\b\w+\b', query_lower)
        keywords = [w for w in words if w not in stop_words and len(w) > 2]

        # Remove source and language keywords from final search terms
        all_source_keywords = [kw for kws in self.source_keywords.values() for kw in kws]
        keywords = [kw for kw in keywords if kw not in all_source_keywords and kw not in self.language_keywords]

        return {
            'sources': detected_sources,
            'language': detected_language,
            'keywords': keywords,
            'original_query': query
        }

    async def search(self, query: str) -> Dict[str, Any]:
        """
        Execute search across detected sources (IN PARALLEL).

        Args:
            query: User's natural language search query

        Returns:
            Search results with AI commentary
        """
        # Parse intent
        intent = self.parse_search_intent(query)
        print(f"🔍 SYNTH Intent: {intent}")

        # Build search tasks for parallel execution
        search_tasks = []
        for source_name in intent['sources']:
            source = self.registry.get_source(source_name)
            if not source:
                print(f"⚠️ Source not found: {source_name}")
                continue

            # Build source-specific filters
            filters = {}
            if source_name == 'github' and intent.get('language'):
                filters['language'] = intent['language']

            # Build search query
            search_query = " ".join(intent['keywords']) if intent['keywords'] else query

            # Add to parallel tasks
            task = source.search(query=search_query, limit=15, **filters)
            search_tasks.append((source_name, task))

        # Execute all searches in parallel
        results_by_source = await asyncio.gather(
            *[task for _, task in search_tasks],
            return_exceptions=True
        )

        # Collect results and errors
        all_results: List[SearchResult] = []
        errors = []

        for (source_name, _), result in zip(search_tasks, results_by_source):
            if isinstance(result, Exception):
                error_msg = f"Error searching {source_name}: {str(result)}"
                errors.append(error_msg)
                print(f"❌ {error_msg}")
            else:
                all_results.extend(result)

        # Sort by score (stars/upvotes/points) and deduplicate by URL
        all_results.sort(key=lambda x: x.score, reverse=True)
        seen_urls = set()
        unique_results = []
        for result in all_results:
            if result.url not in seen_urls:
                seen_urls.add(result.url)
                unique_results.append(result)

        # Limit to top 15
        final_results = unique_results[:15]

        # Convert to dict format for API response
        result_dicts = [r.to_dict() for r in final_results]

        # Generate AI commentary
        commentary = self._generate_commentary(query, intent, result_dicts)

        return {
            'query': query,
            'intent': intent,
            'results': result_dicts,
            'total_found': len(result_dicts),
            'commentary': commentary,
            'errors': errors if errors else None
        }

    def _generate_commentary(self, query: str, intent: Dict[str, Any], results: List[Dict[str, Any]]) -> str:
        """
        Generate AI commentary about search results.

        Args:
            query: Original user query
            intent: Parsed search intent
            results: Search results

        Returns:
            SYNTH's commentary
        """
        if not results:
            return f"Couldn't find anything matching '{query}'. Try different keywords or check back later when fresh content rolls in! 🌆"

        # Create summary for Gemini
        result_summary = []
        for r in results[:5]:
            result_summary.append(f"- {r.get('title', 'Untitled')} ({r.get('source', 'unknown')})")

        summary_text = '\n'.join(result_summary)

        context = f"""User searched for: "{query}"
Found {len(results)} results from {', '.join(intent['sources'])}.
Top items: {summary_text}"""

        try:
            commentary = self.gemini.generate_answer(
                query=f"Provide a brief (1-2 sentences) comment on these search results",
                context=context
            )
            return commentary
        except Exception as e:
            print(f"⚠️ Commentary generation failed: {e}")
            return f"Found {len(results)} results across {', '.join(intent['sources'])}. Check them out!"
