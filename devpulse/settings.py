"""Scrapy settings for DevPulse project."""

# Scrapy settings for DevPulse project
BOT_NAME = "devpulse"

SPIDER_MODULES = ["devpulse.spiders"]
NEWSPIDER_MODULE = "devpulse.spiders"


# Crawl responsibly by identifying yourself (and your website) on the user-agent
USER_AGENT = "DevPulse/0.1 (+https://github.com/kosmickroma/devpulse)"

# Obey robots.txt rules
ROBOTSTXT_OBEY = True

# Configure maximum concurrent requests performed by Scrapy (default: 16)
# HYPER-PERFORMANCE: Max out concurrent requests for API-heavy workload
CONCURRENT_REQUESTS = 32

# Configure a delay for requests for the same website (default: 0)
# SPEED MODE: Zero delay for APIs (spiders override individually if needed)
DOWNLOAD_DELAY = 0
# The download delay setting will honor only one of:
CONCURRENT_REQUESTS_PER_DOMAIN = 16
CONCURRENT_REQUESTS_PER_IP = 16

# Disable cookies (enabled by default)
COOKIES_ENABLED = False

# Disable Telemetry (enabled by default)
TELNETCONSOLE_ENABLED = False

# Override the default request headers:
DEFAULT_REQUEST_HEADERS = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
}

# Enable or disable spider middlewares
# See https://docs.scrapy.org/en/latest/topics/spider-middleware.html
SPIDER_MIDDLEWARES = {
    "devpulse.middlewares.DevpulseSpiderMiddleware": 543,
}

# Enable or disable downloader middlewares
# See https://docs.scrapy.org/en/latest/topics/downloader-middleware.html
DOWNLOADER_MIDDLEWARES = {
    "devpulse.middlewares.DevpulseDownloaderMiddleware": 543,
    # User-agent rotation for better scraping reliability
    "scrapy_user_agents.middlewares.RandomUserAgentMiddleware": 400,
}

# Enable or disable extensions
# See https://docs.scrapy.org/en/latest/topics/extensions.html
EXTENSIONS = {
    "scrapy.extensions.telnet.TelnetConsole": None,
}

# Configure item pipelines (order matters!)
# See https://docs.scrapy.org/en/latest/topics/item-pipeline.html
ITEM_PIPELINES = {
    "devpulse.pipelines.ValidationPipeline": 100,      # Validate first
    "devpulse.pipelines.CleaningPipeline": 200,        # Then clean
    "devpulse.pipelines.DuplicatesPipeline": 300,      # Remove duplicates
    "devpulse.pipelines.ExportPipeline": 400,          # Finally export
}

# Enable and configure the AutoThrottle extension (disabled by default)
# See https://docs.scrapy.org/en/latest/topics/autothrottle.html
# DISABLED: We're using manual delay settings optimized per spider
AUTOTHROTTLE_ENABLED = False
# The initial download delay
AUTOTHROTTLE_START_DELAY = 0.5
# The maximum download delay to be set in case of high latencies
AUTOTHROTTLE_MAX_DELAY = 3
# The average number of requests Scrapy should be sending in parallel to
# each remote server
AUTOTHROTTLE_TARGET_CONCURRENCY = 8.0
# Enable showing throttle stats for every response received:
AUTOTHROTTLE_DEBUG = False

# Enable and configure HTTP caching (disabled by default)
# See https://docs.scrapy.org/en/latest/topics/downloader-middleware.html#httpcache-middleware-settings
HTTPCACHE_ENABLED = False
HTTPCACHE_EXPIRATION_SECS = 0
HTTPCACHE_DIR = "httpcache"
HTTPCACHE_IGNORE_HTTP_CODES = []
HTTPCACHE_STORAGE = "scrapy.extensions.httpcache.FilesystemCacheStorage"

# Set settings whose default value is deprecated to a future-proof value
REQUEST_FINGERPRINTER_IMPLEMENTATION = "2.7"
TWISTED_REACTOR = "twisted.internet.asyncioreactor.AsyncioSelectorReactor"
FEED_EXPORT_ENCODING = "utf-8"

# Logging configuration
LOG_LEVEL = "INFO"
LOG_FORMAT = "%(levelname)s: %(message)s"
LOG_DATEFORMAT = "%Y-%m-%d %H:%M:%S"

# Retry configuration
RETRY_ENABLED = True
RETRY_TIMES = 2  # Reduced retries for faster failure
RETRY_HTTP_CODES = [500, 502, 503, 504, 408, 429]

# Timeout configuration for faster failure detection
DOWNLOAD_TIMEOUT = 15  # Fail fast on slow responses

# DNS cache settings (massive performance boost)
DNSCACHE_ENABLED = True
DNSCACHE_SIZE = 10000

# Reactor thread pool (for better I/O performance)
REACTOR_THREADPOOL_MAXSIZE = 20

# User agent rotation settings (for scrapy-user-agents)
# This will randomly rotate user agents to appear more like different browsers
RANDOM_UA_PER_PROXY = True
RANDOM_UA_TYPE = "random"  # Can be: random, chrome, firefox, safari, etc.

# ============================================
# DEVPULSE HYPER-PERFORMANCE OPTIMIZATIONS
# ============================================
# These settings are tuned for maximum speed on API-based scraping
# while maintaining respectful scraping practices for web sources.
#
# Performance Profile:
# - Zero delay for API endpoints (GitHub, Reddit, Yahoo, CoinGecko)
# - Minimal delay for scraper-friendly sites (HN: 0.3s, Dev.to: 0.5s)
# - High concurrency (32 global, 16 per domain)
# - DNS caching enabled for faster lookups
# - Fail-fast timeouts (15s)
# - Optimized reactor thread pool (20 threads)
#
# Expected Results:
# - First item appears: 1-2 seconds (down from 48-50s)
# - Full scan completion: 8-12 seconds for all 6 sources
# - True "firehose mode" with interleaved streaming
# ============================================
