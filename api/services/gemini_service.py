"""
SYNTH AI Service - Powered by Google Gemini

Provides AI responses with retro 80s personality for DevPulse.
Scales across all content types (dev, gaming, space, etc.)
"""

import google.generativeai as genai
import os


class GeminiService:
    """Service for interacting with Google Gemini API."""

    def __init__(self):
        """Initialize Gemini with API key from environment."""
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set")

        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')

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
            response = self.model.generate_content(
                prompt,
                generation_config={
                    'max_output_tokens': 150,
                    'temperature': 0.7,
                }
            )
            return response.text.strip()
        except Exception as e:
            raise Exception(f"Gemini API error: {str(e)}")

    def generate_answer(self, question: str) -> str:
        """
        Answer ANY question with SYNTH personality.

        Args:
            question: User's question

        Returns:
            AI response with SYNTH personality
        """
        prompt = f"""You are SYNTH, a chill 80s-inspired AI assistant for DevPulse.
Answer questions helpfully with occasional retro vibes.
Keep responses 2-3 sentences, clear and useful. Reference old tech if it fits naturally.
Always sign your responses with "SYNTH OUT 🌆"

Question: {question}

Answer:"""

        try:
            response = self.model.generate_content(
                prompt,
                generation_config={
                    'max_output_tokens': 200,
                    'temperature': 0.8,
                }
            )
            return response.text.strip()
        except Exception as e:
            raise Exception(f"Gemini API error: {str(e)}")

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
Always sign your responses with "SYNTH OUT 🌆"

Topic: {topic}

Explanation:"""

        try:
            response = self.model.generate_content(
                prompt,
                generation_config={
                    'max_output_tokens': 250,
                    'temperature': 0.8,
                }
            )
            return response.text.strip()
        except Exception as e:
            raise Exception(f"Gemini API error: {str(e)}")
