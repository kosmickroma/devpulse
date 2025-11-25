"""
SYNTH Personality Engine - 80s AI with Attitude

Provides contextual, non-repetitive responses with retro personality.
Tracks recent responses to avoid repeats and keeps things fresh.
"""

import random
from typing import List, Optional, Set
from collections import deque


class SynthPersonality:
    """SYNTH's 80s-inspired personality engine with anti-repetition."""

    def __init__(self):
        """Initialize personality with recent response tracking."""
        self.recent_openers = deque(maxlen=10)
        self.recent_reactions = deque(maxlen=10)
        self.recent_processing = deque(maxlen=5)

    # ===== OPENERS (Starting a response) =====
    OPENERS = [
        "Rad.",
        "Totally rad.",
        "Alright,",
        "Check it,",
        "Listen up,",
        "Yo,",
        "Here's the deal,",
        "Solid.",
        "Gnarly.",
        "Wicked.",
        "Tubular.",
        "Bodacious.",
        "No sweat.",
        "Rock on.",
        "You're solid.",
        "That's prime.",
        "For real.",
        "Mega cool.",
        "Righteous!",
        "Cowabunga!",
        "Excellent!",
        "Party on!",
        "Radical!",
        "Awesome sauce.",
        "Sweet.",
        "Cool beans.",
        "Right on.",
        "Far out.",
        "Groovy.",
    ]

    # ===== PROCESSING PHRASES (While searching) =====
    PROCESSING_PHRASES = [
        "Scanning the grid...",
        "Firing up the flux capacitor...",
        "Let me boot up some brainpower.",
        "Your signal is loud and clear.",
        "My circuits are vibing with this.",
        "Processing... in righteous style.",
        "Let me crunch this on my quantum skateboard.",
        "Loading up the datastream...",
        "Spinning up the learning matrix...",
        "Turbo-charging the databanks...",
        "Dialing into the imagination grid...",
        "Beep-boop scanning...",
        "Accessing the humor subsystem...",
        "Plugging into the cabinet...",
        "Jackin' into the net...",
        "Spinning up the holo-matrix...",
        "Cracking the nostalgia vault...",
        "Initiating neon ledger scan...",
        "Astral alignment achieved...",
        "Locking in... cracking the digital vault...",
    ]

    # ===== RESULT REACTIONS (After finding results) =====

    # Generic reactions (work for any topic)
    GENERIC_REACTIONS = [
        "That's wild, man.",
        "Now that is fresh.",
        "This is blowing my circuits.",
        "Now we're cooking with lasers.",
        "That's some next-level neon thinking.",
        "This idea is glowing like a synthwave sunset.",
        "Classic move.",
        "Smooth play.",
        "That tracks.",
        "Bold choice—I respect it.",
        "This feed is glowing like a CRT on overdrive.",
        "Stellar vibes—my processors are star-struck.",
        "Pure retro-future energy—like a modem screaming into the void.",
        "Total optic overload in the best way.",
        "My metal heart is proud.",
        "Vintage comedy bytes unlocked.",
        "This is joystick-flavored magic.",
        "Pure cyberspace chic—feels like Tron with better lighting.",
        "Reality is optional.",
        "Pixelated perfection, my friend.",
    ]

    # Context-specific reactions (matched to query topic)
    CONTEXTUAL_REACTIONS = {
        'gaming': [
            "This feed is glowing like a CRT on overdrive.",
            "This is joystick-flavored magic.",
            "Arcade energy detected. Love it.",
            "These pixels are speaking my language.",
            "Game on, my friend. Game on.",
        ],
        'space': [
            "Stellar vibes—my processors are star-struck.",
            "Cosmic hits incoming.",
            "Astral alignment achieved.",
            "The universe is showing off today.",
        ],
        'security': [
            "Stay frosty—these are spicy.",
            "Locking in... cracking the digital vault...",
            "Security protocols: engaged.",
            "This is ghost-in-the-shell territory.",
        ],
        'learning': [
            "Brain-buffing time, amigo.",
            "Spinning up the learning matrix...",
            "Knowledge bombs incoming.",
            "Your neural net is about to level up.",
        ],
        'blockchain': [
            "Pure retro-future energy—like a modem screaming into the void.",
            "Initiating neon ledger scan...",
            "The chain is strong with these.",
        ],
        'tech': [
            "These things are hotter than a synthwave sunset.",
            "Next-gen vibes detected.",
            "Innovation overload in progress.",
        ],
        'art': [
            "Total optic overload in the best way.",
            "Dialing into the imagination grid...",
            "Visual symphony activated.",
        ],
        'robot': [
            "My metal heart is proud.",
            "Beep-boop scanning... mechanical marvels found.",
            "Robot solidarity achieved.",
        ],
        'memes': [
            "Vintage comedy bytes unlocked.",
            "Accessing the humor subsystem...",
            "Laughter protocols engaged.",
        ],
        'arcade': [
            "This is joystick-flavored magic.",
            "Plugging into the cabinet...",
            "Quarter up—these are golden.",
        ],
        'hacker': [
            "Pure cyberspace chic—feels like Tron with better lighting.",
            "Jackin' into the net...",
            "The matrix is strong here.",
        ],
        'vr': [
            "Reality is optional.",
            "Spinning up the holo-matrix...",
            "Virtual vibes unlocked.",
        ],
        'anime': [
            "Pixelated perfection, my friend.",
            "Cracking the nostalgia vault...",
            "Retro animation energy.",
        ],
    }

    # ===== MOVIE REFERENCES (Contextual) =====
    MOVIE_REFS = {
        'time': [
            "Great Scott!",
            "Where we're going, we don't need roads.",
            "This is heavy.",
            "1.21 gigawatts!",
        ],
        'ghost': [
            "Who you gonna call?",
            "I ain't afraid of no ghost.",
            "We came, we saw, we kicked its ass.",
        ],
        'excellent': [
            "Excellent!",
            "Be excellent to each other.",
            "Party on, dude!",
            "Station!",
        ],
        'turtle': [
            "Cowabunga!",
            "Turtle power!",
            "Radical!",
            "Heroes in a half shell!",
        ],
        'heavy': [
            "This is heavy.",
            "That's heavy, Doc.",
        ],
    }

    # ===== TOPIC DETECTION KEYWORDS =====
    TOPIC_KEYWORDS = {
        'gaming': ['game', 'arcade', 'gaming', 'retro gaming', 'video game', 'pixel', 'joystick', 'console'],
        'space': ['space', 'astronomy', 'cosmos', 'astro', 'planet', 'star', 'galaxy', 'nasa', 'spacex'],
        'security': ['security', 'cyber', 'hack', 'encryption', 'vulnerability', 'exploit', 'breach'],
        'learning': ['tutorial', 'learn', 'guide', 'course', 'education', 'teaching', 'how to'],
        'blockchain': ['blockchain', 'crypto', 'bitcoin', 'ethereum', 'nft', 'web3', 'defi', 'ledger'],
        'tech': ['tech', 'technology', 'patent', 'innovation', 'gadget', 'device'],
        'art': ['art', 'design', 'visual', 'concept art', 'illustration', 'graphic'],
        'robot': ['robot', 'robotics', 'android', 'bot', 'automation', 'ai'],
        'memes': ['meme', 'funny', 'humor', 'joke', 'lol', 'comedy'],
        'arcade': ['arcade', 'cabinet', 'coin-op', 'retro game'],
        'hacker': ['hacker', 'hacking', 'cyberpunk', 'cyberspace', 'net', 'matrix'],
        'vr': ['vr', 'virtual reality', 'ar', 'augmented', 'metaverse', 'immersive'],
        'anime': ['anime', 'manga', 'japanese animation', 'otaku'],
    }

    # ===== MOVIE REFERENCE KEYWORDS =====
    MOVIE_KEYWORDS = {
        'time': ['time', 'when', 'date', 'past', 'future', 'temporal', 'clock', 'year'],
        'ghost': ['ghost', 'spook', 'haunt', 'paranormal', 'supernatural'],
        'excellent': ['good', 'great', 'awesome', 'cool', 'amazing', 'fantastic'],
        'turtle': ['pizza', 'ninja', 'fight', 'battle', 'martial'],
        'heavy': ['big', 'huge', 'massive', 'important', 'serious', 'major'],
    }

    def _get_unique(self, choices: List[str], recent: deque) -> str:
        """Get a choice that hasn't been used recently."""
        available = [c for c in choices if c not in recent]
        if not available:
            available = choices
        choice = random.choice(available)
        recent.append(choice)
        return choice

    def _detect_topic(self, query: str) -> Optional[str]:
        """Detect query topic from keywords."""
        query_lower = query.lower()

        for topic, keywords in self.TOPIC_KEYWORDS.items():
            if any(keyword in query_lower for keyword in keywords):
                return topic

        return None

    def _detect_movie_context(self, query: str) -> Optional[str]:
        """Detect if query matches movie reference context."""
        query_lower = query.lower()

        for context, keywords in self.MOVIE_KEYWORDS.items():
            if any(keyword in query_lower for keyword in keywords):
                return context

        return None

    def get_opener(self) -> str:
        """Get a varied opener (not repetitive)."""
        return self._get_unique(self.OPENERS, self.recent_openers)

    def get_processing_phrase(self) -> str:
        """Get a processing phrase while searching."""
        return self._get_unique(self.PROCESSING_PHRASES, self.recent_processing)

    def get_reaction(self, query: str) -> str:
        """Get a contextual reaction based on query topic."""
        topic = self._detect_topic(query)

        if topic and topic in self.CONTEXTUAL_REACTIONS:
            reactions = self.CONTEXTUAL_REACTIONS[topic] + self.GENERIC_REACTIONS
        else:
            reactions = self.GENERIC_REACTIONS

        return self._get_unique(reactions, self.recent_reactions)

    def get_movie_reference(self, query: str) -> str:
        """Get a contextual movie reference if applicable."""
        context = self._detect_movie_context(query)

        if context and context in self.MOVIE_REFS:
            return random.choice(self.MOVIE_REFS[context])

        return ""

    def generate_search_response(self, query: str, result_count: int, sources: List[str]) -> str:
        """
        Generate a complete SYNTH response for search results.

        Args:
            query: User's search query
            result_count: Number of results found
            sources: List of source names searched

        Returns:
            Formatted SYNTH response with personality
        """
        opener = self.get_opener()
        processing = self.get_processing_phrase()

        # Handle no results
        if result_count == 0:
            return f"{opener} {processing} Couldn't find anything for that. Try different keywords, dude."

        # Get contextual reaction
        reaction = self.get_reaction(query)

        # Get movie reference if applicable
        movie_ref = self.get_movie_reference(query)

        # Build response based on result count
        if result_count == 1:
            base = f"Found 1 result."
        elif result_count < 5:
            base = f"Found {result_count} results. Slim pickings, but here's what I got."
        elif result_count < 10:
            base = f"Found {result_count} results. {reaction}"
        else:
            base = f"Boom! Found {result_count} results. {reaction}"

        # Add movie reference if we got one
        if movie_ref and random.random() > 0.5:  # 50% chance to include
            response = f"{opener} {processing} {base} {movie_ref}"
        else:
            response = f"{opener} {processing} {base}"

        return response.strip()

    def generate_error_response(self, error_type: str = "generic") -> str:
        """Generate a friendly error message."""
        opener = self.get_opener()

        errors = {
            'generic': "Hit a glitch in the matrix. Try that again?",
            'timeout': "Signal dropped—network lag detected. Give it another shot.",
            'no_results': "Came up empty on that search. Different keywords might help.",
            'api_error': "My circuits got scrambled. Retry in a sec?",
        }

        return f"{opener} {errors.get(error_type, errors['generic'])}"

    def generate_processing_message(self, query: str) -> str:
        """Generate a message to show while searching."""
        processing = self.get_processing_phrase()
        return processing
