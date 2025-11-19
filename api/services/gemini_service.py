"""
SYNTH AI Service - Powered by Google Gemini

Provides AI responses with retro 80s personality for DevPulse.
Scales across all content types (dev, gaming, space, etc.)
Supports function calling for intelligent data access.
"""

import google.generativeai as genai
import os
from typing import Dict, List, Optional
import json


class GeminiService:
    """Service for interacting with Google Gemini API."""

    def __init__(self):
        """Initialize Gemini with API key from environment."""
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set")

        # Configure the SDK
        genai.configure(api_key=api_key)

        # Use current stable free tier model (Jan 2025)
        # gemini-2.5-flash: 10 RPM / 250 RPD on Tier 1 free tier
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        self.model_name = 'gemini-2.5-flash'

        print(f"✅ SYNTH initialized with {self.model_name}")

    def _get_function_tools(self) -> List[Dict]:
        """Define function calling tools available to SYNTH."""
        return [
            {
                "name": "search_github",
                "description": "Search GitHub repositories by keyword or topic. Use this when user wants to find repos, code, or projects.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Search query (e.g., 'arcade games', 'machine learning python')"
                        },
                        "language": {
                            "type": "string",
                            "description": "Programming language filter (optional, e.g., 'Python', 'JavaScript', 'Rust')"
                        },
                        "min_stars": {
                            "type": "integer",
                            "description": "Minimum stars required (default: 100)"
                        },
                        "limit": {
                            "type": "integer",
                            "description": "Max results to return (default: 10)"
                        }
                    },
                    "required": ["query"]
                }
            }
        ]

    def generate_summary(self, title: str, content: str) -> str:
        """
        Generate a concise summary - works for any content type.

        Args:
            title: Article title
            content: Article content/description

        Returns:
            2-3 sentence summary
        """
        prompt = f"""You are SYNTH, a chill 80s-inspired AI assistant.
Summarize this article in 2-3 sentences. Be concise and helpful.
Focus on the key information readers need to know. Don't add a signature.

Title: {title}
Content: {content[:800]}

Summary:"""

        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"❌ Summary error: {e}")
            raise Exception(f"Failed to generate summary: {str(e)}")

    def generate_answer(self, question: str) -> str:
        """
        Answer ANY question with SYNTH personality.

        Args:
            question: User's question

        Returns:
            AI response with SYNTH personality
        """
        from datetime import datetime
        current_date = datetime.now().strftime("%B %d, %Y")

        prompt = f"""You are SYNTH, a chill 80s-inspired AI assistant for DevPulse.
Answer questions helpfully with occasional retro vibes.
Keep responses 2-3 sentences, clear and useful. Reference old tech if it fits naturally.

IMPORTANT: Today's date is {current_date}. Use this for any time-sensitive questions.

Question: {question}

Answer:"""

        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"❌ Answer error: {e}")
            raise Exception(f"SYNTH encountered an error: {str(e)}")

    def explain_concept(self, topic: str) -> str:
        """
        Explain ANY topic with SYNTH personality.

        Args:
            topic: Concept/topic to explain

        Returns:
            Clear explanation with personality
        """
        prompt = f"""You are SYNTH, a chill 80s-inspired AI assistant for DevPulse.
Explain this topic clearly. Make it easy to understand.
Keep it 2-4 sentences. Add a retro tech analogy if it helps.

Topic: {topic}

Explanation:"""

        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"❌ Explain error: {e}")
            raise Exception(f"SYNTH encountered an error: {str(e)}")

    def analyze_query_with_functions(self, question: str) -> Dict:
        """
        Analyze user question and determine if function calling is needed.

        Returns dict with:
        - needs_function: bool
        - function_name: str (if needed)
        - parameters: dict (if needed)
        - ask_permission_message: str (what to ask user)
        """
        prompt = f"""You are SYNTH, an AI assistant that can search data sources.

User question: "{question}"

Determine if this question requires searching external data (GitHub repos, Reddit posts, etc.).

If YES - respond with JSON:
{{
  "needs_search": true,
  "source": "github" or "reddit" etc,
  "query": "search terms to use",
  "ask_message": "Friendly message asking permission (keep it short, use SYNTH personality)"
}}

If NO - respond with JSON:
{{
  "needs_search": false,
  "direct_answer": "Answer the question directly"
}}"""

        try:
            response = self.model.generate_content(prompt)
            # Parse JSON from response
            text = response.text.strip()
            # Extract JSON if wrapped in markdown
            if '```json' in text:
                text = text.split('```json')[1].split('```')[0].strip()
            elif '```' in text:
                text = text.split('```')[1].split('```')[0].strip()

            result = json.loads(text)
            return result
        except Exception as e:
            print(f"❌ Query analysis error: {e}")
            # Return safe fallback
            return {"needs_search": False, "direct_answer": "I encountered an error analyzing your question."}

    def generate_response_with_data(self, question: str, search_results: List[Dict]) -> str:
        """
        Generate response using actual search results data.

        Args:
            question: Original user question
            search_results: List of search result dicts

        Returns:
            Response analyzing the real data
        """
        # Format results for context
        results_text = "\n".join([
            f"- {r['title']} ({r['stars']} stars) - {r['description'][:100]}"
            for r in search_results[:10]
        ])

        prompt = f"""You are SYNTH, a chill 80s-inspired AI assistant.

User asked: "{question}"

Here are the search results I found:
{results_text}

Provide a helpful response that:
1. Confirms you found results
2. Highlights 3-5 top picks with brief descriptions
3. Keeps it concise and useful
4. Uses SYNTH personality (retro vibes, helpful)

Response:"""

        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"❌ Response generation error: {e}")
            raise Exception(f"Failed to generate response: {str(e)}")
