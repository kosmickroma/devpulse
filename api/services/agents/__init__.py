"""
SYNTH v2 Multi-Agent System

Exports:
- BaseAgent: Abstract base class
- ConversationAgent: Claude 3.5 Haiku for vague queries
- CodeAgent: GPT-4o mini for technical queries
- SearchAgent: Gemini 2.5 Flash for fast search
"""

from .base_agent import BaseAgent, AgentType, AgentResponse, AgentContext

__all__ = [
    'BaseAgent',
    'AgentType',
    'AgentResponse',
    'AgentContext',
]
