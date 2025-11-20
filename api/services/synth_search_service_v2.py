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
from api.services.search_cache_service import SearchCacheService


class SynthSearchServiceV2:
    """Refactored SYNTH search service using unified source interface."""

    def __init__(self):
        """Initialize search service with source registry."""
        self.gemini = GeminiService()
        self.registry = get_registry()
        self.cache = SearchCacheService()

        # Register all sources
        self._register_sources()

        # Source keywords for intent detection
        self.source_keywords = {
            'github': ['github', 'repo', 'repository', 'code', 'project', 'open source', 'opensource'],
            'reddit': ['reddit', 'discussion', 'community', 'thread', 'post'],
            'hackernews': ['hackernews', 'hn', 'hacker news', 'tech news'],
            'devto': ['dev.to', 'devto', 'dev to'],  # Note: DevTo source not implemented yet
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

    def _optimize_query_for_source(self, keywords: List[str], source_name: str, original_query: str) -> str:
        """
        Smart query optimization for each source.

        Uses intelligent keyword prioritization to avoid overly restrictive queries.
        Implements progressive refinement strategy used by professional search engines.

        Args:
            keywords: Extracted keywords from user query
            source_name: Target source (github, reddit, hackernews)
            original_query: Original user query for fallback

        Returns:
            Optimized search query string
        """
        if not keywords:
            return original_query

        # For GitHub: Use smart keyword selection to avoid overly restrictive AND queries
        if source_name == 'github':
            # Strategy: Identify primary subject vs descriptive modifiers
            # e.g., "frogger arcade game" -> primary="frogger", modifiers=["arcade", "game"]

            # Common descriptive words that should be deprioritized
            descriptive_words = {
                'game', 'app', 'tool', 'library', 'framework', 'project',
                'code', 'script', 'program', 'software', 'api', 'web', 'mobile',
                'tutorial', 'example', 'demo', 'sample', 'clone', 'implementation',
                'open', 'source', 'free', 'simple', 'basic', 'advanced',
                'arcade', 'retro', 'classic', 'modern', 'new', 'old'
            }

            # Separate primary keywords from descriptive modifiers
            primary_keywords = [kw for kw in keywords if kw not in descriptive_words]
            modifiers = [kw for kw in keywords if kw in descriptive_words]

            # Strategy 1: If we have clear primary keywords, use those
            if primary_keywords:
                # Use first 2 primary keywords to keep query focused but not too restrictive
                return " ".join(primary_keywords[:2])

            # Strategy 2: If only modifiers, use the most specific one (usually first)
            if modifiers:
                return modifiers[0]

            # Strategy 3: Fallback to first keyword
            return keywords[0]

        # For Reddit/HN: Use broader queries since communities are pre-filtered
        elif source_name in ['reddit', 'hackernews']:
            # Use all keywords for better context matching
            return " ".join(keywords)

        # Default: use all keywords
        return " ".join(keywords)

    def _detect_time_filter(self, query: str) -> Optional[str]:
        """
        Detect time-based filtering from query.

        Args:
            query: Lowercase query string

        Returns:
            'today' | 'week' | 'month' | 'year' | None
        """
        # Time period keywords
        if any(word in query for word in ['today', 'last 24 hours', '24h']):
            return 'day'
        elif any(word in query for word in ['this week', 'past week', 'last week', '7 days']):
            return 'week'
        elif any(word in query for word in ['this month', 'past month', 'last month', '30 days']):
            return 'month'
        elif any(word in query for word in ['this year', 'past year', 'last year']):
            return 'year'

        # "Newest" and "latest" imply recent time filter
        if any(word in query for word in ['newest', 'latest', 'recent']):
            return 'week'  # Default to week for "newest/latest"

        return None

    def _detect_sort_preference(self, query: str) -> Optional[str]:
        """
        Detect sorting preference from query.

        Args:
            query: Lowercase query string

        Returns:
            'stars' | 'new' | 'top' | 'updated' | None
        """
        # Most stars/popular/trending
        if any(phrase in query for phrase in ['most stars', 'most starred', 'top starred', 'highest rated', 'most popular']):
            return 'stars'

        # Most upvotes (Reddit/HN)
        if any(phrase in query for phrase in ['most upvotes', 'most upvoted', 'top rated']):
            return 'top'

        # Newest/latest/recent
        if any(word in query for word in ['newest', 'latest', 'most recent', 'recently updated']):
            return 'new'

        # Trending
        if 'trending' in query:
            return 'stars'  # For GitHub, stars = popularity

        return None

    def _detect_limit(self, query: str) -> Optional[int]:
        """
        Detect result limit from query.

        Args:
            query: Lowercase query string

        Returns:
            Integer limit or None
        """
        # Look for patterns like "5 repos", "top 10", "3 articles"
        import re

        # Pattern 1: "X repos/articles/posts/results"
        match = re.search(r'(\d+)\s+(?:repos?|articles?|posts?|results?|projects?|discussions?)', query)
        if match:
            return int(match.group(1))

        # Pattern 2: "top X" or "first X"
        match = re.search(r'(?:top|first)\s+(\d+)', query)
        if match:
            return int(match.group(1))

        # Pattern 3: Just a standalone number at the start
        match = re.search(r'^(\d+)\s', query)
        if match:
            num = int(match.group(1))
            if num <= 50:  # Reasonable limit
                return num

        return None

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

        # Detect programming language (word boundary matching to avoid false positives)
        detected_language = None
        query_words = set(re.findall(r'\b\w+\b', query_lower))
        for lang in self.language_keywords:
            if lang in query_words:
                detected_language = lang.capitalize()
                break

        # Extract keywords
        stop_words = ['find', 'me', 'some', 'show', 'get', 'search', 'for', 'about',
                      'the', 'a', 'an', 'on', 'in', 'from', 'with', 'that', 'this',
                      'can', 'you', 'what', 'where', 'when', 'why', 'how', 'all', 'sources',
                      # Command verbs
                      'scan', 'look', 'check', 'explore', 'browse', 'discover', 'lookup',
                      'pull', 'fetch', 'grab', 'give', 'list', 'view', 'tell',
                      # Conversational/filler words
                      'thank', 'thanks', 'please', 'anyway', 'now', 'ok', 'well',
                      'just', 'really', 'very', 'much', 'more', 'most']
        words = re.findall(r'\b\w+\b', query_lower)
        keywords = [w for w in words if w not in stop_words and len(w) > 2]

        # Remove source and language keywords from final search terms
        all_source_keywords = [kw for kws in self.source_keywords.values() for kw in kws]
        keywords = [kw for kw in keywords if kw not in all_source_keywords and kw not in self.language_keywords]

        # Detect time-based filtering
        time_filter = self._detect_time_filter(query_lower)

        # Detect sort preference
        sort_by = self._detect_sort_preference(query_lower)

        # Detect result limit
        limit = self._detect_limit(query_lower)

        return {
            'sources': detected_sources,
            'language': detected_language,
            'keywords': keywords,
            'original_query': query,
            'time_filter': time_filter,  # 'today', 'week', 'month', None
            'sort_by': sort_by,          # 'stars', 'new', 'top', None
            'limit': limit               # int or None
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

        # Check cache first
        cached = await self.cache.get_cached_results(query, intent)
        if cached:
            # Add AI commentary to cached results
            commentary = self._generate_commentary(query, intent, cached['results'])
            cached['commentary'] = commentary
            cached['query'] = query
            return cached

        # Build search tasks for parallel execution
        search_tasks = []
        for source_name in intent['sources']:
            source = self.registry.get_source(source_name)
            if not source:
                print(f"⚠️ Source not found: {source_name}")
                continue

            # Build source-specific filters
            filters = {}

            # Language filter (GitHub only)
            if source_name == 'github' and intent.get('language'):
                filters['language'] = intent['language']

            # Time filter (all sources support this differently)
            if intent.get('time_filter'):
                if source_name == 'reddit':
                    filters['time_filter'] = intent['time_filter']  # Reddit: day, week, month, year, all
                elif source_name == 'github':
                    filters['time_filter'] = intent['time_filter']  # GitHub: will use created:>DATE in query
                # HackerNews uses created_at in post-processing

            # Sort preference (source-specific mapping)
            if intent.get('sort_by'):
                if source_name == 'github':
                    # Map generic sort to GitHub-specific
                    sort_map = {'stars': 'stars', 'new': 'updated', 'top': 'stars'}
                    filters['sort'] = sort_map.get(intent['sort_by'], 'stars')
                elif source_name == 'reddit':
                    # Map generic sort to Reddit-specific
                    sort_map = {'stars': 'top', 'new': 'new', 'top': 'top'}
                    filters['sort'] = sort_map.get(intent['sort_by'], 'relevance')
                # HackerNews will sort in post-processing

            # Build optimized search query using smart keyword prioritization
            search_query = self._optimize_query_for_source(
                intent['keywords'],
                source_name,
                query
            )

            # Use detected limit or default to 15
            result_limit = intent.get('limit') or 15

            print(f"🔍 {source_name} query: '{search_query}' (limit={result_limit}, filters={filters})")

            # Add to parallel tasks
            task = source.search(query=search_query, limit=result_limit, **filters)
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

        # Cache results for future queries
        await self.cache.cache_results(query, intent, result_dicts)

        return {
            'query': query,
            'intent': intent,
            'results': result_dicts,
            'total_found': len(result_dicts),
            'commentary': commentary,
            'errors': errors if errors else None,
            'from_cache': False
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
            # Combine context + question into single parameter
            full_question = f"{context}\n\nProvide a brief (1-2 sentences) comment on these search results."
            commentary = self.gemini.generate_answer(full_question)
            return commentary
        except Exception as e:
            print(f"⚠️ Commentary generation failed: {e}")
            return f"Found {len(results)} results across {', '.join(intent['sources'])}. Check them out!"
