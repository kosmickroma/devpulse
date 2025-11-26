"""
SYNTH Intent Classifier - Lightning-Fast Pattern Matching

Purpose: Classify 85% of queries instantly with regex patterns, avoiding AI calls.
Performance: <10ms latency, 0 tokens, 85%+ accuracy target.

Usage:
    classifier = IntentClassifier()
    result = classifier.classify("python repos on github")
    # Returns: IntentResult(confidence=0.95, sources=['github'], entities=['python'], ...)
"""

import re
from typing import List, Dict, Optional, Set
from dataclasses import dataclass
from enum import Enum
import time


class IntentType(Enum):
    """Types of search intents."""
    CODE_SEARCH = "code_search"           # Looking for repos/code
    TUTORIAL = "tutorial"                 # Educational content
    DISCUSSION = "discussion"             # Forums/threads/debates
    NEWS = "news"                         # Trending/latest updates
    PRICE_CHECK = "price_check"           # Stock/crypto prices
    DOCUMENTATION = "documentation"       # Official docs
    GAMING = "gaming"                     # Gaming news/reviews
    GENERAL = "general"                   # Ambiguous/multi-intent


@dataclass
class IntentResult:
    """Result of intent classification."""
    intent_type: IntentType
    confidence: float                     # 0.0-1.0
    sources: List[str]                    # ['github', 'reddit', etc]
    entities: Dict[str, List[str]]        # {'languages': ['python'], 'frameworks': ['react']}
    keywords: List[str]                   # Cleaned search terms
    time_sensitive: bool                  # Needs fresh data
    original_query: str
    classification_time_ms: float         # For monitoring


class IntentClassifier:
    """
    Lightning-fast pattern-based query classifier.

    Uses regex patterns and entity extraction to classify queries instantly.
    Falls back to AI (via confidence < 0.7) for ambiguous cases.
    """

    def __init__(self):
        """Initialize classifier with patterns and entity lists."""
        self._compile_patterns()
        self._load_entity_dictionaries()

    def _compile_patterns(self):
        """Compile regex patterns for instant matching."""

        # EXPLICIT SOURCE PATTERNS (confidence: 0.95-0.98)
        self.source_patterns = {
            'github': [
                r'\b(on|from|in|at)\s+github\b',
                r'\bgithub\s+(repo|repository|repositories|code|project|projects)\b',
                r'\b(find|show|search)\s+.*\s+(repo|repository|code)\b',
            ],
            'reddit': [
                r'\b(on|from|in|at)\s+reddit\b',
                r'\breddit\s+(thread|post|discussion)\b',
                r'\bsubreddit\b',
            ],
            'hackernews': [
                r'\b(on|from|in|at)\s+(hackernews|hacker\s*news|hn)\b',
                r'\b(hackernews|hn)\s+(post|story|discussion)\b',
            ],
            'devto': [
                r'\b(on|from|in|at)\s+dev\.to\b',
                r'\bdev\.to\s+(article|post|tutorial)\b',
            ],
            'stocks': [
                r'\b(stock|stocks|share|shares)\s+(price|ticker|quote)\b',
                r'\b(nasdaq|nyse|dow|s&p)\s+(price|quote|ticker)?\b',
                r'\byahoo\s+(finance)?\s+(price|quote|stock)\b',
                r'\b[A-Z]{2,5}\s+(stock|price|quote)\b',  # Ticker symbols like "AAPL stock"
            ],
            'crypto': [
                r'\b(bitcoin|ethereum|crypto|cryptocurrency)\s+(price|value|market|news|updates?)\b',
                r'\b(btc|eth|crypto)\s+(price|chart|value|news)\b',
                r'\bcryptocurrency\b',
                r'\bcrypto\s+market\b',
            ],
            'ign': [
                r'\b(on|from|in|at)\s+ign\b',
                r'\bign\s+(news|article|review)\b',
                r'\bgaming\s+(news|article|review)\b',
                r'\b(video\s+)?game\s+(news|review|reviews|article)\b',
                r'\b(newest|latest|recent)\s+game\s+(news|review|reviews)\b',
                r'\bgame\s+(release|releases|announcement)\b',
            ],
            'pcgamer': [
                r'\b(on|from|in|at)\s+pc\s*gamer\b',
                r'\bpc\s*gamer\s+(news|article|review)\b',
                r'\bpc\s+game\s+(news|review|reviews)\b',
                r'\bpc\s+gaming\s+(news|review|reviews)\b',
            ],
        }

        # INTENT TYPE PATTERNS
        self.intent_patterns = {
            IntentType.TUTORIAL: [
                r'\b(tutorial|tutorials|guide|guides|how\s+to|learn|learning)\b',
                r'\bteach\s+me\b',
                r'\bstep\s+by\s+step\b',
            ],
            IntentType.DISCUSSION: [
                r'\b(discussion|discussions|debate|opinion|opinions|thread|threads)\b',
                r'\bwhat\s+(do\s+people|does\s+everyone|are\s+people)\s+think\b',
                r'\b(talk|talking)\s+about\b',
            ],
            IntentType.NEWS: [
                r'\b(trending|popular|hot|latest|recent|new|news)\b',
                r'\b(today|this\s+week|this\s+month)\b',
                r'\bwhat\'?s\s+(hot|new|trending)\b',
            ],
            IntentType.PRICE_CHECK: [
                r'\b(price|value|cost|quote|ticker)\b',
                r'\bhow\s+much\b',
                r'\b(bitcoin|btc|ethereum|eth|stock)\s+(price|value)\b',
            ],
            IntentType.DOCUMENTATION: [
                r'\b(docs|documentation|api\s+reference|official\s+docs)\b',
                r'\bapi\s+documentation\b',
            ],
            IntentType.CODE_SEARCH: [
                r'\b(repo|repos|repository|repositories|code|project|projects)\b',
                r'\b(library|libraries|package|packages|framework|frameworks)\b',
                r'\bopen\s+source\b',
                r'\bgithub\s+(repo|repos|code|project)\b',
            ],
            IntentType.GAMING: [
                r'\b(game|games|gaming)\s+(news|review|reviews|article|articles|release|releases)\b',
                r'\b(video\s+game|pc\s+game|console\s+game)s?\b',
                r'\b(newest|latest|recent)\s+game\b',
                r'\b(game|gaming)\s+(content|updates?|announcement|trailer)\b',
                r'\bign\b',
                r'\bpc\s*gamer\b',
            ],
        }

        # TIME SENSITIVITY PATTERNS
        self.time_patterns = [
            r'\b(today|tonight|now|current|latest|recent|this\s+week|this\s+month)\b',
            r'\b\d{4}\b',  # Year mention (e.g., "2024")
            r'\breal[\-\s]?time\b',
        ]

        # COMPILE ALL PATTERNS
        self.compiled_source_patterns = {
            source: [re.compile(p, re.IGNORECASE) for p in patterns]
            for source, patterns in self.source_patterns.items()
        }

        self.compiled_intent_patterns = {
            intent: [re.compile(p, re.IGNORECASE) for p in patterns]
            for intent, patterns in self.intent_patterns.items()
        }

        self.compiled_time_patterns = [
            re.compile(p, re.IGNORECASE) for p in self.time_patterns
        ]

    def _load_entity_dictionaries(self):
        """Load dictionaries of programming languages, frameworks, companies, etc."""

        # PROGRAMMING LANGUAGES (100+ terms)
        self.languages = {
            'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'csharp', 'c',
            'go', 'golang', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala',
            'r', 'matlab', 'perl', 'haskell', 'elixir', 'clojure', 'dart',
            'objective-c', 'shell', 'bash', 'powershell', 'lua', 'groovy', 'julia',
        }

        # FRAMEWORKS & LIBRARIES
        self.frameworks = {
            'react', 'reactjs', 'vue', 'vuejs', 'angular', 'svelte', 'nextjs', 'next.js',
            'django', 'flask', 'fastapi', 'express', 'expressjs', 'nodejs', 'node.js',
            'spring', 'spring boot', 'rails', 'ruby on rails', 'laravel', 'symfony',
            'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'pandas', 'numpy',
            'docker', 'kubernetes', 'k8s', 'aws', 'azure', 'gcp', 'firebase',
            'unity', 'unreal', 'godot', 'pygame', 'three.js', 'threejs',
        }

        # DOMAINS/TOPICS
        self.topics = {
            'ai', 'machine learning', 'ml', 'deep learning', 'nlp', 'computer vision',
            'web development', 'mobile', 'ios', 'android', 'game development', 'gamedev',
            'devops', 'cloud', 'database', 'blockchain', 'crypto', 'security', 'cybersecurity',
            'frontend', 'backend', 'fullstack', 'data science', 'analytics',
        }

        # GAMES & POPULAR SEARCHES
        self.popular_games = {
            'minecraft', 'gta', 'gta6', 'gta 6', 'grand theft auto', 'fortnite', 'valorant',
            'league of legends', 'lol', 'dota', 'cs:go', 'counter-strike', 'apex legends',
            'cyberpunk', 'elden ring', 'zelda', 'pokemon', 'call of duty', 'cod',
        }

        # CRYPTOCURRENCIES
        self.cryptocurrencies = {
            'bitcoin', 'btc', 'ethereum', 'eth', 'dogecoin', 'doge', 'litecoin', 'ltc',
            'ripple', 'xrp', 'cardano', 'ada', 'solana', 'sol', 'polkadot', 'dot',
            'binance coin', 'bnb', 'chainlink', 'link', 'polygon', 'matic',
        }

        # STOCK TICKERS (common ones)
        self.stock_tickers = {
            'aapl', 'msft', 'googl', 'amzn', 'meta', 'tsla', 'nvda', 'nflx',
            'dis', 'ba', 'nike', 'v', 'ma', 'jpm', 'bac', 'wmt',
        }

        # STOP WORDS (to remove from keywords)
        self.stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
            'could', 'should', 'would', 'might', 'must', 'can', 'will', 'shall',
            'find', 'show', 'get', 'search', 'look', 'give', 'tell', 'want',
            'me', 'my', 'i', 'you', 'your', 'we', 'our', 'please', 'thanks',
            'stuff', 'thing', 'things', 'related', 'about', 'all', 'some', 'any',
        }

        # Compile all entities into a master set for quick lookup
        self.all_entities = (
            self.languages | self.frameworks | self.topics |
            self.popular_games | self.cryptocurrencies | self.stock_tickers
        )

    def classify(self, query: str) -> IntentResult:
        """
        Classify a query using pattern matching.

        Args:
            query: User's natural language query

        Returns:
            IntentResult with confidence, sources, entities, etc.
        """
        start_time = time.time()
        query_lower = query.lower().strip()

        # Step 1: Detect explicit sources (high confidence)
        detected_sources = self._detect_sources(query_lower)

        # Step 2: Detect intent type
        detected_intent = self._detect_intent(query_lower)

        # Step 3: Extract entities (languages, frameworks, etc)
        entities = self._extract_entities(query_lower)

        # Step 4: Extract clean keywords (remove stop words)
        keywords = self._extract_keywords(query_lower)

        # Step 5: Check time sensitivity
        time_sensitive = self._is_time_sensitive(query_lower)

        # Step 6: Calculate confidence score
        confidence = self._calculate_confidence(
            detected_sources,
            detected_intent,
            entities,
            keywords,
            query_lower
        )

        # Step 7: Determine final source list
        final_sources = self._determine_sources(
            detected_sources,
            detected_intent,
            entities,
            confidence
        )

        end_time = time.time()
        classification_time_ms = (end_time - start_time) * 1000

        return IntentResult(
            intent_type=detected_intent,
            confidence=confidence,
            sources=final_sources,
            entities=entities,
            keywords=keywords,
            time_sensitive=time_sensitive,
            original_query=query,
            classification_time_ms=classification_time_ms
        )

    def _detect_sources(self, query: str) -> List[str]:
        """Detect explicitly mentioned sources."""
        detected = []

        for source, patterns in self.compiled_source_patterns.items():
            for pattern in patterns:
                if pattern.search(query):
                    detected.append(source)
                    break  # One match per source is enough

        return detected

    def _detect_intent(self, query: str) -> IntentType:
        """Detect primary intent type."""

        # Count matches for each intent type
        intent_scores = {}

        for intent, patterns in self.compiled_intent_patterns.items():
            matches = sum(1 for pattern in patterns if pattern.search(query))
            if matches > 0:
                intent_scores[intent] = matches

        # If multiple intents match with same score, prioritize by specificity
        # CODE_SEARCH and TUTORIAL are more specific than GENERAL
        if intent_scores:
            max_score = max(intent_scores.values())
            top_intents = [intent for intent, score in intent_scores.items() if score == max_score]

            # Priority order if tied
            priority_order = [
                IntentType.PRICE_CHECK,
                IntentType.GAMING,
                IntentType.TUTORIAL,
                IntentType.CODE_SEARCH,
                IntentType.DISCUSSION,
                IntentType.NEWS,
                IntentType.DOCUMENTATION,
                IntentType.GENERAL,
            ]

            for intent_type in priority_order:
                if intent_type in top_intents:
                    return intent_type

            return top_intents[0]
        else:
            return IntentType.GENERAL

    def _extract_entities(self, query: str) -> Dict[str, List[str]]:
        """Extract programming languages, frameworks, topics, etc."""

        entities = {
            'languages': [],
            'frameworks': [],
            'topics': [],
            'games': [],
            'cryptocurrencies': [],
            'stocks': [],
        }

        # Tokenize query (simple whitespace + punctuation split)
        tokens = re.findall(r'\b\w+(?:\.\w+)?\b', query)
        tokens_lower = [t.lower() for t in tokens]

        # Also check bigrams/trigrams for multi-word entities
        bigrams = [f"{tokens_lower[i]} {tokens_lower[i+1]}"
                   for i in range(len(tokens_lower)-1)]
        trigrams = [f"{tokens_lower[i]} {tokens_lower[i+1]} {tokens_lower[i+2]}"
                    for i in range(len(tokens_lower)-2)]

        all_ngrams = tokens_lower + bigrams + trigrams

        for ngram in all_ngrams:
            if ngram in self.languages:
                if ngram not in entities['languages']:
                    entities['languages'].append(ngram)
            elif ngram in self.frameworks:
                if ngram not in entities['frameworks']:
                    entities['frameworks'].append(ngram)
            elif ngram in self.topics:
                if ngram not in entities['topics']:
                    entities['topics'].append(ngram)
            elif ngram in self.popular_games:
                if ngram not in entities['games']:
                    entities['games'].append(ngram)
            elif ngram in self.cryptocurrencies:
                if ngram not in entities['cryptocurrencies']:
                    entities['cryptocurrencies'].append(ngram)
            elif ngram in self.stock_tickers:
                if ngram not in entities['stocks']:
                    entities['stocks'].append(ngram)

        # Remove empty lists
        return {k: v for k, v in entities.items() if v}

    def _extract_keywords(self, query: str) -> List[str]:
        """Extract meaningful keywords (remove stop words)."""

        # Tokenize
        tokens = re.findall(r'\b\w+\b', query)

        # Remove stop words and short words
        keywords = [
            token for token in tokens
            if token not in self.stop_words and len(token) > 2
        ]

        # Remove duplicates while preserving order
        seen = set()
        unique_keywords = []
        for kw in keywords:
            if kw not in seen:
                seen.add(kw)
                unique_keywords.append(kw)

        return unique_keywords

    def _is_time_sensitive(self, query: str) -> bool:
        """Check if query needs fresh/real-time data."""
        return any(pattern.search(query) for pattern in self.compiled_time_patterns)

    def _calculate_confidence(
        self,
        detected_sources: List[str],
        detected_intent: IntentType,
        entities: Dict[str, List[str]],
        keywords: List[str],
        query: str
    ) -> float:
        """
        Calculate confidence score (0.0-1.0).

        Scoring logic:
        - Explicit source mention: +0.30
        - Strong intent signal: +0.20
        - Entities detected: +0.10 per entity type (max +0.30)
        - Good keyword extraction: +0.10
        - Query length appropriate: +0.10

        Target: >0.7 for high confidence (pattern only)
                0.4-0.7 for medium (pattern + some AI)
                <0.4 for low (full AI needed)
        """
        confidence = 0.0

        # Explicit source mention
        if detected_sources:
            confidence += 0.30

        # Strong intent signal (boost more for specific intents)
        if detected_intent != IntentType.GENERAL:
            if detected_intent in [IntentType.PRICE_CHECK, IntentType.TUTORIAL]:
                confidence += 0.25  # Very specific intents
            else:
                confidence += 0.20

        # Entities detected (each type adds value)
        entity_count = sum(len(v) for v in entities.values())
        if entity_count > 0:
            # More entities = more confidence
            entity_boost = min(entity_count * 0.10, 0.30)
            confidence += entity_boost

        # Good keywords (at least 1 meaningful keyword)
        if len(keywords) >= 1:
            confidence += 0.10
            # Bonus for multiple specific keywords
            if len(keywords) >= 3:
                confidence += 0.05

        # Query length check (not too short/long)
        word_count = len(query.split())
        if 3 <= word_count <= 15:
            confidence += 0.10
        elif word_count >= 2:  # Still OK if 2 words
            confidence += 0.05

        # Cap at 0.98 (never 100% certain without AI)
        return min(confidence, 0.98)

    def _determine_sources(
        self,
        detected_sources: List[str],
        detected_intent: IntentType,
        entities: Dict[str, List[str]],
        confidence: float
    ) -> List[str]:
        """
        Determine which sources to search based on classification.

        Logic:
        - If explicit sources mentioned → use those
        - Otherwise route based on intent (REPLACE not EXTEND)
        - Add crypto/stocks if entities detected
        - Only use all sources if confidence < 0.3
        """

        sources = []

        # Start with intent-based routing
        if detected_intent == IntentType.TUTORIAL:
            sources = ['github', 'devto']

        elif detected_intent == IntentType.CODE_SEARCH:
            sources = ['github', 'devto']

        elif detected_intent == IntentType.DISCUSSION:
            sources = ['reddit', 'hackernews']

        elif detected_intent == IntentType.NEWS:
            sources = ['hackernews', 'reddit', 'devto']

        elif detected_intent == IntentType.PRICE_CHECK:
            sources = ['crypto', 'stocks']

        elif detected_intent == IntentType.DOCUMENTATION:
            sources = ['github', 'devto']

        elif detected_intent == IntentType.GAMING:
            sources = ['ign', 'pcgamer']

        # Only use all sources if truly ambiguous (very low confidence)
        elif confidence < 0.3:
            sources = ['github', 'reddit', 'hackernews', 'devto', 'stocks', 'crypto', 'ign', 'pcgamer']

        # Default to code-focused sources
        else:
            sources = ['github', 'devto', 'hackernews']

        # Add explicitly mentioned sources (merge with intent-based)
        for explicit_source in detected_sources:
            if explicit_source not in sources:
                sources.insert(0, explicit_source)

        # Add crypto/stocks if entities detected and not already in sources
        if 'cryptocurrencies' in entities and 'crypto' not in sources:
            sources.insert(0, 'crypto')

        if 'stocks' in entities and 'stocks' not in sources:
            sources.insert(0, 'stocks')

        # Remove duplicates while preserving order
        seen = set()
        unique_sources = []
        for source in sources:
            if source not in seen:
                seen.add(source)
                unique_sources.append(source)

        return unique_sources
