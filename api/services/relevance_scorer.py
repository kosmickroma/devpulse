"""
Unified relevance scoring for all SYNTH sources.

This module provides professional-grade relevance scoring with:
- Word boundary matching (no more "AI" matching "wait")
- Stop word filtering
- Quoted phrase support
- Position-aware scoring
- Multi-word query bonus
- Optional semantic search with OpenAI embeddings

Usage:
    from api.services.relevance_scorer import RelevanceScorer

    scorer = RelevanceScorer()
    score = scorer.calculate_relevance(
        title="Machine Learning Tutorial",
        body="Learn about AI and neural networks",
        tags=["ai", "ml"],
        search_query="AI tutorials"
    )
"""

import re
import os
import hashlib
from typing import List, Set, Optional, Tuple, TYPE_CHECKING

if TYPE_CHECKING:
    import numpy as np


class RelevanceScorer:
    """
    Professional relevance scoring for search results.

    Implements hybrid approach:
    - Phase 1: Improved keyword matching (word boundaries, stop words, phrases)
    - Phase 2: Semantic search with embeddings (future)
    """

    # Common stop words that shouldn't contribute to relevance
    STOP_WORDS: Set[str] = {
        'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
        'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
        'to', 'was', 'will', 'with', 'i', 'me', 'my', 'we', 'you', 'your',
        'can', 'could', 'should', 'would', 'this', 'these', 'those', 'what',
        'which', 'who', 'how', 'when', 'where', 'why', 'am', 'been', 'being',
        'have', 'had', 'do', 'does', 'did', 'about', 'after', 'before',
        'show', 'find', 'get', 'search'
    }

    def __init__(self, use_embeddings: bool = None):
        """
        Initialize the relevance scorer.

        Args:
            use_embeddings: Whether to use semantic search. If None, auto-detect based on OPENAI_API_KEY.
        """
        self.embedding_cache = {}  # Cache for text embeddings

        # Auto-detect if embeddings should be used
        if use_embeddings is None:
            self.use_embeddings = bool(os.getenv('OPENAI_API_KEY'))
        else:
            self.use_embeddings = use_embeddings

        # Lazy-load OpenAI client only if needed
        self._openai_client = None

        if self.use_embeddings:
            print("✨ Semantic search enabled (OpenAI embeddings)")
        else:
            print("📊 Using keyword-only search (set OPENAI_API_KEY for semantic search)")

    def calculate_relevance(
        self,
        title: str,
        body: Optional[str] = None,
        tags: Optional[List[str]] = None,
        search_query: str = "",
        metadata: Optional[dict] = None
    ) -> float:
        """
        Calculate relevance score for content.

        Args:
            title: Title/name of the content
            body: Body/description text (optional)
            tags: List of tags/topics (optional)
            search_query: User's search query
            metadata: Additional metadata (stars, date, etc.)

        Returns:
            Relevance score (0-100)
        """
        if not search_query.strip():
            return 50.0

        # Parse query for phrases and terms
        phrases, terms = self._parse_query(search_query)

        if not phrases and not terms:
            return 50.0

        score = 0.0
        title_lower = title.lower()
        body_lower = (body or "").lower()
        tags_lower = [t.lower() for t in (tags or [])]

        # Phase 1: Keyword and phrase matching
        keyword_score = 0.0
        keyword_score += self._score_phrases(phrases, title_lower, body_lower, tags_lower)
        keyword_score += self._score_terms(terms, title_lower, body_lower, tags_lower)

        # Bonus for multi-word queries (more specific = higher weight)
        if len(terms) + len(phrases) > 1:
            keyword_score *= 1.1

        # Bonus for metadata
        if metadata:
            keyword_score += self._score_metadata(metadata)

        score = keyword_score

        # Phase 2: Semantic search (if enabled and keywords found some relevance)
        if self.use_embeddings and keyword_score > 0:
            semantic_score = self._calculate_semantic_similarity(
                query=search_query,
                title=title,
                body=body or ""
            )
            # Blend keyword and semantic scores (70% keyword, 30% semantic)
            # This ensures keyword matches are still prioritized, but semantic adds refinement
            score = (keyword_score * 0.7) + (semantic_score * 0.3)

        return min(score, 100.0)

    def _parse_query(self, query: str) -> tuple[List[str], List[str]]:
        """
        Parse query into phrases (quoted) and individual terms.

        Returns:
            (phrases, terms) - both are lists of strings
        """
        phrases = []
        terms = []

        # Extract quoted phrases
        phrase_pattern = r'"([^"]+)"'
        for match in re.finditer(phrase_pattern, query):
            phrases.append(match.group(1).lower())

        # Remove quotes and extract individual terms
        query_without_quotes = re.sub(phrase_pattern, '', query)
        words = query_without_quotes.lower().split()

        # Filter out stop words
        terms = [w for w in words if w not in self.STOP_WORDS and len(w) > 1]

        return phrases, terms

    def _score_phrases(
        self,
        phrases: List[str],
        title: str,
        body: str,
        tags: List[str]
    ) -> float:
        """
        Score exact phrase matches.
        Phrases are the most specific queries, so they get high weight.
        """
        score = 0.0

        for phrase in phrases:
            # Exact phrase in title: very high weight
            if phrase in title:
                # Position matters: phrase at start > middle > end
                if title.startswith(phrase):
                    score += 60
                elif title.endswith(phrase):
                    score += 50
                else:
                    score += 45

            # Exact phrase in body: high weight
            elif phrase in body:
                score += 30

            # Phrase words in tags: medium weight
            elif any(phrase in tag for tag in tags):
                score += 25

        return score

    def _score_terms(
        self,
        terms: List[str],
        title: str,
        body: str,
        tags: List[str]
    ) -> float:
        """
        Score individual term matches with word boundary awareness.
        """
        score = 0.0
        matched_terms = 0

        for term in terms:
            # Use word boundaries to avoid false positives
            pattern = r'\b' + re.escape(term) + r'\b'
            term_matched = False

            # Title matches (highest weight)
            title_matches = len(re.findall(pattern, title))
            if title_matches > 0:
                # Multiple matches = higher relevance
                base_score = 35 if title_matches == 1 else 35 + (title_matches - 1) * 5

                # Position bonus: term at start of title
                if re.match(r'^' + pattern, title):
                    base_score += 10

                score += base_score
                term_matched = True

            # Body matches (medium weight)
            elif body:
                body_matches = len(re.findall(pattern, body))
                if body_matches > 0:
                    score += 15 + min(body_matches - 1, 5)
                    term_matched = True

            # Tag matches (medium-high weight)
            if tags:
                for tag in tags:
                    if re.search(pattern, tag):
                        score += 20
                        term_matched = True
                        break  # Only count once per term

            if term_matched:
                matched_terms += 1

        # Bonus for matching multiple terms (query comprehensiveness)
        if matched_terms > 1:
            score += matched_terms * 10

        return score

    def _score_metadata(self, metadata: dict) -> float:
        """
        Score based on metadata signals (stars, recency, etc.).
        """
        score = 0.0

        # Popularity signals
        stars = metadata.get('stars', 0)
        if stars > 1000:
            score += 5
        elif stars > 100:
            score += 3
        elif stars > 10:
            score += 1

        # Recency bonus (if provided)
        year = metadata.get('year')
        if year and year >= 2024:
            score += 5
        elif year and year >= 2023:
            score += 3

        # Has description/body
        if metadata.get('has_description'):
            score += 3

        return score

    def calculate_relevance_batch(
        self,
        items: List[dict],
        search_query: str,
        title_key: str = 'title',
        body_key: str = 'body',
        tags_key: str = 'tags'
    ) -> List[tuple[dict, float]]:
        """
        Score multiple items and return sorted by relevance.

        Args:
            items: List of items to score
            search_query: User's search query
            title_key: Key for title field
            body_key: Key for body field
            tags_key: Key for tags field

        Returns:
            List of (item, score) tuples sorted by score descending
        """
        scored_items = []

        for item in items:
            title = item.get(title_key, '')
            body = item.get(body_key, '')
            tags = item.get(tags_key, [])

            # Extract metadata
            metadata = {
                'stars': item.get('stars', 0) or item.get('points', 0),
                'year': self._extract_year(item.get('date', '') or item.get('updated_at', '')),
                'has_description': bool(body)
            }

            score = self.calculate_relevance(
                title=title,
                body=body,
                tags=tags,
                search_query=search_query,
                metadata=metadata
            )

            scored_items.append((item, score))

        # Sort by score descending
        scored_items.sort(key=lambda x: x[1], reverse=True)

        return scored_items

    def _extract_year(self, date_string: str) -> Optional[int]:
        """Extract year from date string."""
        if not date_string:
            return None

        # Try to find a 4-digit year
        match = re.search(r'(20\d{2})', str(date_string))
        if match:
            return int(match.group(1))

        return None

    # ==================== PHASE 2: SEMANTIC SEARCH ====================

    @property
    def openai_client(self):
        """Lazy-load OpenAI client."""
        if self._openai_client is None and self.use_embeddings:
            try:
                from openai import OpenAI
                self._openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
            except ImportError:
                print("⚠️ OpenAI package not installed. Run: pip install openai")
                self.use_embeddings = False
            except Exception as e:
                print(f"⚠️ Failed to initialize OpenAI client: {e}")
                self.use_embeddings = False
        return self._openai_client

    def _get_embedding(self, text: str) -> Optional['np.ndarray']:
        """
        Get embedding for text using OpenAI API.

        Uses caching to avoid redundant API calls.
        Cost: ~$0.00001 per query (text-embedding-3-small)
        """
        if not self.use_embeddings or not text.strip():
            return None

        # Create cache key (hash of text)
        cache_key = hashlib.md5(text.encode()).hexdigest()

        # Check cache first
        if cache_key in self.embedding_cache:
            return self.embedding_cache[cache_key]

        try:
            client = self.openai_client
            if not client:
                return None

            # Get embedding from OpenAI
            response = client.embeddings.create(
                model="text-embedding-3-small",
                input=text[:8000]  # Limit to ~8k chars to avoid token limits
            )

            # Import numpy only when needed
            import numpy as np
            embedding = np.array(response.data[0].embedding)

            # Cache the result
            self.embedding_cache[cache_key] = embedding

            return embedding

        except Exception as e:
            print(f"⚠️ Embedding API error: {e}")
            return None

    def _cosine_similarity(self, vec1: 'np.ndarray', vec2: 'np.ndarray') -> float:
        """Calculate cosine similarity between two vectors."""
        if vec1 is None or vec2 is None:
            return 0.0

        try:
            import numpy as np
            dot_product = np.dot(vec1, vec2)
            norm1 = np.linalg.norm(vec1)
            norm2 = np.linalg.norm(vec2)

            if norm1 == 0 or norm2 == 0:
                return 0.0

            return float(dot_product / (norm1 * norm2))
        except:
            return 0.0

    def _calculate_semantic_similarity(
        self,
        query: str,
        title: str,
        body: str
    ) -> float:
        """
        Calculate semantic similarity using embeddings.

        Returns:
            Semantic score (0-100)
        """
        # Combine title and body (title weighted 2x)
        content = f"{title} {title} {body[:500]}"  # Title appears twice for emphasis

        # Get embeddings
        query_embedding = self._get_embedding(query)
        content_embedding = self._get_embedding(content)

        if query_embedding is None or content_embedding is None:
            return 0.0

        # Calculate similarity
        similarity = self._cosine_similarity(query_embedding, content_embedding)

        # Convert to 0-100 scale
        # Cosine similarity ranges from -1 to 1, but realistic values are 0-1
        # Scale: 0.0 = 0, 0.5 = 50, 1.0 = 100
        score = max(0, min(100, similarity * 100))

        return score


# Singleton instance for easy import
relevance_scorer = RelevanceScorer()
