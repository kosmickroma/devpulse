"""
Source Registry - Unified interface for all search sources.

Provides abstract base class and registry for managing search sources.
Makes adding new sources trivial and fixes cross-source field issues.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Optional, Any
from enum import Enum


class SourceType(Enum):
    """Types of search sources available."""
    REPOSITORY = "repository"  # GitHub repos
    DISCUSSION = "discussion"  # Reddit, HackerNews
    ARTICLE = "article"        # Dev.to, blogs
    MARKET = "market"          # Crypto, stocks


class SearchResult:
    """
    Standardized search result that works across all sources.

    Each source maps its specific fields to this common format.
    Source-specific data goes in 'metadata' dict.
    """

    def __init__(
        self,
        title: str,
        url: str,
        source: str,
        result_type: SourceType,
        description: str = "",
        author: str = "",
        score: int = 0,  # Generic score (stars/upvotes/points)
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.title = title
        self.url = url
        self.source = source
        self.result_type = result_type
        self.description = description
        self.author = author
        self.score = score
        self.metadata = metadata or {}

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses."""
        return {
            'title': self.title,
            'url': self.url,
            'source': self.source,
            'type': self.result_type.value,
            'description': self.description,
            'author': self.author,
            'score': self.score,
            **self.metadata  # Merge source-specific fields
        }


class SearchSource(ABC):
    """
    Abstract base class for all search sources.

    Each source (GitHub, Reddit, HN, etc.) implements this interface.
    Makes adding new sources trivial - just implement search() method.
    """

    @abstractmethod
    def get_name(self) -> str:
        """Return source identifier (e.g., 'github', 'reddit')."""
        pass

    @abstractmethod
    def get_display_name(self) -> str:
        """Return human-readable name (e.g., 'GitHub', 'Reddit')."""
        pass

    @abstractmethod
    def get_source_type(self) -> SourceType:
        """Return what type of source this is."""
        pass

    @abstractmethod
    async def search(
        self,
        query: str,
        limit: int = 10,
        **filters
    ) -> List[SearchResult]:
        """
        Execute search and return standardized results.

        Args:
            query: Search query string
            limit: Max results to return
            **filters: Source-specific filters (language, subreddit, etc.)

        Returns:
            List of SearchResult objects
        """
        pass

    def get_capabilities(self) -> Dict[str, Any]:
        """
        Return what this source can do.

        Override this to specify available filters, etc.
        """
        return {
            'filters': [],
            'supports_sort': False,
            'max_limit': 100
        }


class SourceRegistry:
    """
    Central registry for all search sources.

    Manages registration, lookup, and parallel searching across sources.
    """

    def __init__(self):
        self._sources: Dict[str, SearchSource] = {}

    def register(self, source: SearchSource):
        """Register a new search source."""
        name = source.get_name()
        self._sources[name] = source
        print(f"✅ Registered source: {source.get_display_name()}")

    def get_source(self, name: str) -> Optional[SearchSource]:
        """Get source by name (e.g., 'github')."""
        return self._sources.get(name)

    def get_all_sources(self) -> List[SearchSource]:
        """Get all registered sources."""
        return list(self._sources.values())

    def get_source_names(self) -> List[str]:
        """Get list of all source names."""
        return list(self._sources.keys())

    def get_sources_by_type(self, source_type: SourceType) -> List[SearchSource]:
        """Get all sources of a specific type."""
        return [
            source for source in self._sources.values()
            if source.get_source_type() == source_type
        ]


# Global registry instance (singleton)
_registry = None


def get_registry() -> SourceRegistry:
    """Get the global source registry instance."""
    global _registry
    if _registry is None:
        _registry = SourceRegistry()
    return _registry
