"""
SYNTH Search Service - AI-powered content discovery from scraped sources.

SYNTH can intelligently search GitHub, HackerNews, and Dev.to based on natural language queries.
"""

from typing import Dict, List, Any, Optional
import re
from api.spider_runner import SpiderRunner
from api.services.gemini_service import GeminiService


class SynthSearchService:
    """Service for SYNTH to search content from DevPulse sources."""

    def __init__(self):
        """Initialize search service."""
        self.spider_runner = SpiderRunner()
        self.gemini = GeminiService()

        # Source keywords for intent detection
        self.source_keywords = {
            'github': ['github', 'repo', 'repository', 'code', 'project', 'open source', 'opensource'],
            'hackernews': ['hackernews', 'hn', 'hacker news', 'discussion', 'tech news'],
            'devto': ['dev.to', 'devto', 'article', 'tutorial', 'blog post']
        }

        # Programming language keywords
        self.language_keywords = [
            'python', 'javascript', 'typescript', 'java', 'go', 'rust', 'c++', 'cpp',
            'c#', 'csharp', 'ruby', 'php', 'swift', 'kotlin', 'dart', 'scala',
            'elixir', 'haskell', 'clojure', 'r', 'julia', 'lua', 'perl', 'shell'
        ]

    def parse_search_intent(self, query: str) -> Dict[str, Any]:
        """
        Parse user query to determine search intent.

        Args:
            query: User's natural language query

        Returns:
            Dict with source, language, keywords, and search type
        """
        query_lower = query.lower()

        # Detect source
        detected_sources = []
        for source, keywords in self.source_keywords.items():
            if any(keyword in query_lower for keyword in keywords):
                detected_sources.append(source)

        # If no source specified, search all
        if not detected_sources:
            detected_sources = ['github', 'hackernews', 'devto']

        # Detect programming language
        detected_language = None
        for lang in self.language_keywords:
            if lang in query_lower:
                detected_language = lang
                break

        # Extract keywords (remove common words and source references)
        stop_words = ['find', 'me', 'some', 'show', 'get', 'search', 'for', 'about',
                      'the', 'a', 'an', 'on', 'in', 'from', 'with', 'that', 'this']
        words = re.findall(r'\b\w+\b', query_lower)
        keywords = [w for w in words if w not in stop_words and len(w) > 2]

        # Remove source and language keywords from search keywords
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
        Execute search across detected sources based on user query.

        Args:
            query: User's natural language search query

        Returns:
            Search results with AI commentary
        """
        # Parse intent
        intent = self.parse_search_intent(query)

        # Execute searches
        results = []
        errors = []

        for source in intent['sources']:
            try:
                spider_name = self._get_spider_name(source)
                if not spider_name:
                    continue

                # Build search query for GitHub
                search_query = None
                if source == 'github' and intent['keywords']:
                    # Join keywords for GitHub search
                    search_query = " ".join(intent['keywords'])

                # Run spider
                async for event in self.spider_runner.run_spider_async(
                    spider_name=spider_name,
                    language=intent['language'] if source == 'github' else None,
                    time_range='daily',
                    search_query=search_query if source == 'github' else None
                ):
                    if event['type'] == 'item':
                        results.append(event['data'])
                    elif event['type'] == 'error':
                        errors.append(event['message'])

            except Exception as e:
                errors.append(f"Error searching {source}: {str(e)}")

        # Limit results
        results = results[:15]  # Return top 15 results

        # Generate AI commentary
        commentary = self._generate_commentary(query, intent, results)

        return {
            'query': query,
            'intent': intent,
            'results': results,
            'total_found': len(results),
            'commentary': commentary,
            'errors': errors if errors else None
        }

    def _get_spider_name(self, source: str) -> Optional[str]:
        """Map source name to spider name."""
        spider_map = {
            'github': 'github_api',
            'hackernews': 'hackernews',
            'devto': 'devto'
        }
        return spider_map.get(source)

    def _matches_keywords(self, item: Dict[str, Any], keywords: List[str]) -> bool:
        """Check if item matches search keywords."""
        if not keywords:
            return True  # No keywords = match all

        # Search in title, description, and tags
        searchable_text = ' '.join([
            item.get('title', ''),
            item.get('description', ''),
            item.get('language', ''),
            item.get('author', ''),
        ]).lower()

        # Match if ANY keyword is found
        return any(keyword in searchable_text for keyword in keywords)

    def _generate_commentary(self, query: str, intent: Dict[str, Any], results: List[Dict[str, Any]]) -> str:
        """
        Generate AI commentary about search results using SYNTH personality.

        Args:
            query: Original user query
            intent: Parsed search intent
            results: Search results

        Returns:
            SYNTH's commentary on the results
        """
        if not results:
            return f"Couldn't find anything matching '{query}'. Try different keywords or check back later when fresh content rolls in! 🌆"

        # Create summary of results for Gemini
        result_summary = []
        for r in results[:5]:  # Summarize top 5
            result_summary.append(f"- {r.get('title', 'Untitled')} ({r.get('source', 'unknown')})")

        summary_text = '\n'.join(result_summary)

        # Create a prompt for SYNTH commentary
        context = f"""User searched for: "{query}"
Found {len(results)} results from {', '.join(intent['sources'])}.
Top items: {summary_text}"""

        try:
            # Use the service method instead of calling model directly
            commentary = self.gemini.generate_answer(
                f"I found {len(results)} results for '{query}' on {', '.join(intent['sources'])}. Give me a quick 2-sentence commentary about these results."
            )
            return commentary
        except Exception as e:
            # Fallback commentary
            print(f"Commentary generation failed: {e}")
            return f"Found {len(results)} items matching your search! Check them out and let me know if you need something more specific. SYNTH OUT 🌆"
