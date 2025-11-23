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
CONCURRENT_REQUESTS = 8

# Configure a delay for requests for the same website (default: 0)
# This is crucial for respectful scraping
DOWNLOAD_DELAY = 0.5
# The download delay setting will honor only one of:
CONCURRENT_REQUESTS_PER_DOMAIN = 8
CONCURRENT_REQUESTS_PER_IP = 8

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
AUTOTHROTTLE_ENABLED = False
# The initial download delay
AUTOTHROTTLE_START_DELAY = 2
# The maximum download delay to be set in case of high latencies
AUTOTHROTTLE_MAX_DELAY = 10
# The average number of requests Scrapy should be sending in parallel to
# each remote server
AUTOTHROTTLE_TARGET_CONCURRENCY = 1.0
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
RETRY_TIMES = 3
RETRY_HTTP_CODES = [500, 502, 503, 504, 408, 429]

# User agent rotation settings (for scrapy-user-agents)
# This will randomly rotate user agents to appear more like different browsers
RANDOM_UA_PER_PROXY = True
RANDOM_UA_TYPE = "random"  # Can be: random, chrome, firefox, safari, etc.
