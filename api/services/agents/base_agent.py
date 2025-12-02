"""
Base Agent - Abstract Interface for SYNTH v2 Multi-Agent System

All specialized agents (conversation, code, search) inherit from this.
Provides common interface: async def respond(query, context)
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum


class AgentType(Enum):
    """Types of agents in the system."""
    CONVERSATION = "conversation"  # Claude 3.5 Haiku - vague queries, clarifications
    CODE = "code"                  # GPT-4o mini - GitHub/technical queries
    SEARCH = "search"              # Gemini 2.5 Flash - fast multi-source search


@dataclass
class AgentResponse:
    """Standardized response from any agent."""
    success: bool
    content: str                           # Main response text
    agent_type: AgentType                  # Which agent responded
    confidence: float                      # 0.0-1.0 how confident
    requires_clarification: bool = False   # True if needs more info
    clarification_questions: List[str] = None  # Questions to ask user
    suggested_sources: List[str] = None    # Sources to search
    metadata: Dict[str, Any] = None        # Extra data (tokens used, etc)
    error: Optional[str] = None            # Error message if failed

    def __post_init__(self):
        """Initialize optional fields."""
        if self.clarification_questions is None:
            self.clarification_questions = []
        if self.suggested_sources is None:
            self.suggested_sources = []
        if self.metadata is None:
            self.metadata = {}


@dataclass
class AgentContext:
    """Context passed to agents for decision making."""
    original_query: str
    intent_type: str                       # From IntentClassifier
    detected_sources: List[str]            # From IntentClassifier
    entities: Dict[str, List[str]]         # From IntentClassifier
    keywords: List[str]                    # From IntentClassifier
    conversation_history: List[Dict] = None  # Previous messages
    user_preferences: Dict = None          # User settings
    time_sensitive: bool = False           # Needs fresh data

    def __post_init__(self):
        """Initialize optional fields."""
        if self.conversation_history is None:
            self.conversation_history = []
        if self.user_preferences is None:
            self.user_preferences = {}


class BaseAgent(ABC):
    """
    Abstract base class for all SYNTH v2 agents.

    Each agent must implement:
    - respond(): Generate response for a query
    - can_handle(): Check if agent should handle this query
    """

    def __init__(self, agent_type: AgentType):
        """
        Initialize base agent.

        Args:
            agent_type: Type of this agent (conversation, code, search)
        """
        self.agent_type = agent_type
        self.model_name = None  # Set by subclass

    @abstractmethod
    async def respond(self, context: AgentContext) -> AgentResponse:
        """
        Generate response for the given query and context.

        Args:
            context: Full context including query, intent, entities, etc.

        Returns:
            AgentResponse with content and metadata
        """
        pass

    @abstractmethod
    def can_handle(self, context: AgentContext) -> tuple[bool, float]:
        """
        Check if this agent can handle the given query.

        Args:
            context: Query context to evaluate

        Returns:
            Tuple of (can_handle: bool, confidence: float)
            - can_handle: True if agent should handle this
            - confidence: 0.0-1.0 how well suited this agent is
        """
        pass

    def _build_error_response(self, error_msg: str) -> AgentResponse:
        """
        Build standardized error response.

        Args:
            error_msg: Error message to include

        Returns:
            AgentResponse with error state
        """
        return AgentResponse(
            success=False,
            content="I encountered an error processing your query.",
            agent_type=self.agent_type,
            confidence=0.0,
            error=error_msg
        )

    def get_model_info(self) -> Dict[str, str]:
        """
        Get information about this agent's model.

        Returns:
            Dict with model name, type, and capabilities
        """
        return {
            "agent_type": self.agent_type.value,
            "model_name": self.model_name or "unknown",
        }
