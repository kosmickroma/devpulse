"""
Search Sources Package

Contains all search source implementations using the unified interface.
"""

from api.services.sources.github_source import GitHubSource
from api.services.sources.reddit_source import RedditSource
from api.services.sources.hackernews_source import HackerNewsSource
from api.services.sources.devto_source import DevToSource
from api.services.sources.stocks_source import StocksSource
from api.services.sources.crypto_source import CryptoSource
from api.services.sources.bbc_news_source import BBCNewsSource
from api.services.sources.deutsche_welle_source import DeutscheWelleSource
from api.services.sources.the_hindu_source import TheHinduSource
from api.services.sources.africanews_source import AfricanewsSource
from api.services.sources.bangkok_post_source import BangkokPostSource
from api.services.sources.rt_source import RTSource

__all__ = [
    'GitHubSource',
    'RedditSource',
    'HackerNewsSource',
    'DevToSource',
    'StocksSource',
    'CryptoSource',
    'BBCNewsSource',
    'DeutscheWelleSource',
    'TheHinduSource',
    'AfricanewsSource',
    'BangkokPostSource',
    'RTSource'
]
