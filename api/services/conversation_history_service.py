"""
Conversation History Service - Manages SYNTH AI conversation persistence.

Handles:
- Creating/loading conversations
- Saving queries and results
- Natural language commands (show history, clear history, etc.)
- Power user shortcuts (/h, /c, /r)
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from supabase import Client
import re


class ConversationHistoryService:
    """Manages conversation history for SYNTH AI."""

    def __init__(self, supabase_client: Client):
        """Initialize with Supabase client."""
        self.supabase = supabase_client

    async def detect_history_command(self, query: str) -> Optional[Dict[str, Any]]:
        """
        Detect if query is a history management command.

        Returns:
            {
                'type': 'show_history' | 'clear_history' | 'load_conversation' | 'save_conversation' | None,
                'params': {...}  # Command-specific parameters
            }
        """
        query_lower = query.lower().strip()

        # Power user shortcuts
        if query_lower in ['/h', '/history']:
            return {'type': 'show_history', 'params': {'limit': 10}}

        if query_lower in ['/c', '/clear']:
            return {'type': 'clear_current', 'params': {}}

        if query_lower in ['/clear all', '/flush']:
            return {'type': 'clear_all', 'params': {}}

        # Recall shortcut: /r 3 or /recall 3
        recall_match = re.match(r'^/r(?:ecall)?\s+(\d+)$', query_lower)
        if recall_match:
            conv_num = int(recall_match.group(1))
            return {'type': 'load_conversation', 'params': {'conversation_number': conv_num}}

        # Natural language: Show history
        show_patterns = [
            r'\b(show|display|list|view)\s+(my\s+)?(history|conversations|searches|recent)',
            r'what\s+(did\s+we|have\s+i)\s+(talk|search|discuss)',
            r'my\s+recent\s+(searches|queries|conversations)',
        ]
        if any(re.search(pattern, query_lower) for pattern in show_patterns):
            # Check for limit: "show last 5 conversations"
            limit_match = re.search(r'(?:last|recent)\s+(\d+)', query_lower)
            limit = int(limit_match.group(1)) if limit_match else 10
            return {'type': 'show_history', 'params': {'limit': limit}}

        # Natural language: Clear history
        clear_patterns = [
            r'\b(clear|delete|remove|forget)\s+(all\s+)?(my\s+)?(history|conversations|everything)',
            r'start\s+(fresh|over)',
            r'forget\s+(everything|our\s+conversations)',
        ]
        if any(re.search(pattern, query_lower) for pattern in clear_patterns):
            clear_all = bool(re.search(r'\ball\b', query_lower))
            return {'type': 'clear_all' if clear_all else 'clear_current', 'params': {}}

        # Natural language: Load conversation
        load_patterns = [
            r'load\s+conversation\s+(\d+)',
            r'recall\s+(?:conversation\s+)?(\d+)',
            r'show\s+(?:me\s+)?(?:conversation\s+)?#?(\d+)',
            r'go\s+back\s+to\s+(?:conversation\s+)?(\d+)',
        ]
        for pattern in load_patterns:
            match = re.search(pattern, query_lower)
            if match:
                conv_num = int(match.group(1))
                return {'type': 'load_conversation', 'params': {'conversation_number': conv_num}}

        # Natural language: Save conversation
        save_patterns = [
            r'save\s+(?:this\s+)?(?:conversation\s+)?(?:as\s+)?["\']?(.+?)["\']?$',
            r'remember\s+this\s+as\s+["\']?(.+?)["\']?$',
            r'bookmark\s+(?:this\s+)?(?:as\s+)?["\']?(.+?)["\']?$',
        ]
        for pattern in save_patterns:
            match = re.search(pattern, query_lower)
            if match and not re.search(r'\b(show|display|list|clear|load)', query_lower):
                name = match.group(1).strip().strip('"\'')
                return {'type': 'save_conversation', 'params': {'name': name}}

        return None

    async def create_conversation(self, user_id: str, title: Optional[str] = None) -> str:
        """
        Create a new conversation session.

        Args:
            user_id: User's UUID
            title: Optional conversation title

        Returns:
            conversation_id: UUID of created conversation
        """
        response = self.supabase.table('conversations').insert({
            'user_id': user_id,
            'title': title,
            'query_count': 0,
            'is_saved': False
        }).execute()

        return response.data[0]['id']

    async def add_query_to_conversation(
        self,
        conversation_id: str,
        query: str,
        result_count: int,
        sources: List[str],
        intent: Dict[str, Any]
    ) -> str:
        """
        Add a query to an existing conversation.

        Args:
            conversation_id: Conversation UUID
            query: User's search query
            result_count: Number of results returned
            sources: List of sources searched
            intent: Intent classification result

        Returns:
            query_id: UUID of created query record
        """
        response = self.supabase.table('conversation_queries').insert({
            'conversation_id': conversation_id,
            'query': query,
            'result_count': result_count,
            'sources': sources,
            'intent': intent
        }).execute()

        # Auto-generate title from first query if not set
        conv_response = self.supabase.table('conversations').select('title, query_count').eq('id', conversation_id).single().execute()

        if conv_response.data['query_count'] == 1 and not conv_response.data['title']:
            # Use first query as title (truncated to 50 chars)
            title = query[:50] + '...' if len(query) > 50 else query
            self.supabase.table('conversations').update({'title': title}).eq('id', conversation_id).execute()

        return response.data[0]['id']

    async def save_query_results(self, query_id: str, results: List[Dict[str, Any]]):
        """
        Save search results for a query (optional, for full replay).

        Args:
            query_id: Query UUID
            results: List of SearchResult objects (serialized to dict)
        """
        records = [
            {
                'query_id': query_id,
                'result_data': result
            }
            for result in results
        ]

        if records:
            self.supabase.table('conversation_results').insert(records).execute()

    async def get_user_conversations(
        self,
        user_id: str,
        limit: int = 10,
        saved_only: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Get user's recent conversations.

        Args:
            user_id: User's UUID
            limit: Number of conversations to return
            saved_only: Only return explicitly saved conversations

        Returns:
            List of conversation dicts with metadata
        """
        query = self.supabase.table('conversations').select('*').eq('user_id', user_id)

        if saved_only:
            query = query.eq('is_saved', True)

        response = query.order('updated_at', desc=True).limit(limit).execute()
        return response.data

    async def get_conversation_details(self, conversation_id: str) -> Dict[str, Any]:
        """
        Get full conversation details including all queries.

        Args:
            conversation_id: Conversation UUID

        Returns:
            Conversation dict with nested queries
        """
        # Get conversation metadata
        conv_response = self.supabase.table('conversations').select('*').eq('id', conversation_id).single().execute()
        conversation = conv_response.data

        # Get all queries for this conversation
        queries_response = self.supabase.table('conversation_queries').select('*').eq('conversation_id', conversation_id).order('created_at', desc=False).execute()
        conversation['queries'] = queries_response.data

        return conversation

    async def load_conversation_results(self, query_id: str) -> List[Dict[str, Any]]:
        """
        Load saved results for a specific query.

        Args:
            query_id: Query UUID

        Returns:
            List of result dicts
        """
        response = self.supabase.table('conversation_results').select('result_data').eq('query_id', query_id).execute()
        return [r['result_data'] for r in response.data]

    async def save_conversation_with_name(self, conversation_id: str, name: str):
        """
        Mark a conversation as saved with a custom name.

        Args:
            conversation_id: Conversation UUID
            name: User-provided name for the conversation
        """
        self.supabase.table('conversations').update({
            'title': name,
            'is_saved': True
        }).eq('id', conversation_id).execute()

    async def clear_current_conversation(self, conversation_id: str):
        """
        Clear current conversation (deletes it).

        Args:
            conversation_id: Conversation UUID
        """
        self.supabase.table('conversations').delete().eq('id', conversation_id).execute()

    async def clear_all_conversations(self, user_id: str, except_saved: bool = True):
        """
        Clear all conversations for a user.

        Args:
            user_id: User's UUID
            except_saved: If True, keep conversations marked as saved
        """
        query = self.supabase.table('conversations').delete().eq('user_id', user_id)

        if except_saved:
            query = query.eq('is_saved', False)

        query.execute()

    def format_history_response(self, conversations: List[Dict[str, Any]]) -> str:
        """
        Format conversation history for terminal display.

        Args:
            conversations: List of conversation dicts

        Returns:
            Formatted string for SYNTH response
        """
        if not conversations:
            return "📜 No conversation history yet. Start searching to build your history!"

        lines = ["📜 RECENT CONVERSATIONS:", "━" * 50]

        for idx, conv in enumerate(conversations, 1):
            title = conv.get('title', 'Untitled')
            query_count = conv.get('query_count', 0)
            updated_at = datetime.fromisoformat(conv['updated_at'].replace('Z', '+00:00'))
            time_ago = self._format_time_ago(updated_at)
            saved_marker = "💾 " if conv.get('is_saved') else ""

            lines.append(f"{saved_marker}[{idx}] {title}")
            lines.append(f"    {query_count} queries • {time_ago}")

        lines.append("━" * 50)
        lines.append("Type '/recall <number>' or say 'load conversation <number>' to restore")
        lines.append("Type '/clear all' to delete all conversations")

        return "\n".join(lines)

    def _format_time_ago(self, dt: datetime) -> str:
        """Format datetime as 'X min/hours/days ago'."""
        now = datetime.now(dt.tzinfo)
        delta = now - dt

        seconds = delta.total_seconds()
        if seconds < 60:
            return "just now"
        elif seconds < 3600:
            minutes = int(seconds / 60)
            return f"{minutes} min ago"
        elif seconds < 86400:
            hours = int(seconds / 3600)
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        else:
            days = int(seconds / 86400)
            return f"{days} day{'s' if days > 1 else ''} ago"
