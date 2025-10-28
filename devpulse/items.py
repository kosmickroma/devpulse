"""Data models for scraped trending content using Pydantic for validation."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class TrendingItem(BaseModel):
    """
    Represents trending content from tech platforms.

    Can represent GitHub repos, Hacker News stories, or Dev.to posts.
    Uses Pydantic for automatic validation and data cleaning.
    """
    title: str = Field(..., min_length=1, description="Title of the content")
    url: str = Field(..., description="URL to the content")
    source: str = Field(..., description="Source platform (github, hackernews, devto)")

    # Metrics (optional depending on source)
    stars: Optional[int] = Field(None, ge=0, description="GitHub stars or upvotes")
    language: Optional[str] = Field(None, description="Programming language (GitHub)")
    author: Optional[str] = Field(None, description="Author/creator username")
    description: Optional[str] = Field(None, description="Brief description")

    # Engagement metrics
    comments: Optional[int] = Field(None, ge=0, description="Number of comments/discussions")
    score: Optional[int] = Field(None, ge=0, description="Score/points (Hacker News)")
    reactions: Optional[int] = Field(None, ge=0, description="Total reactions (Dev.to)")

    # Metadata
    timestamp: datetime = Field(default_factory=datetime.now, description="When scraped")
    category: str = Field(default="tech", description="Content category")

    @field_validator('title')
    @classmethod
    def validate_title(cls, v: str) -> str:
        """Clean and validate title."""
        if not v or not v.strip():
            raise ValueError('Title cannot be empty')
        return v.strip()

    @field_validator('source')
    @classmethod
    def validate_source(cls, v: str) -> str:
        """Ensure source is one of the supported platforms."""
        allowed_sources = {'github', 'hackernews', 'devto'}
        if v.lower() not in allowed_sources:
            raise ValueError(f'Source must be one of {allowed_sources}')
        return v.lower()

    @field_validator('url')
    @classmethod
    def validate_url(cls, v: str) -> str:
        """Basic URL validation."""
        if not v or not v.strip():
            raise ValueError('URL cannot be empty')
        if not (v.startswith('http://') or v.startswith('https://')):
            raise ValueError('URL must start with http:// or https://')
        return v.strip()

    class Config:
        """Pydantic configuration."""
        validate_assignment = True
        str_strip_whitespace = True
