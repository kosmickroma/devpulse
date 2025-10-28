<div align="center">

![[DevPulse Logo](.github/devpulse_logo.svg)](https://github.com/kosmickroma/devpulse)

**Track the pulse of developer trends**

[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Scrapy](https://img.shields.io/badge/scrapy-2.11+-green.svg)](https://scrapy.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [Architecture](#architecture) • [Contributing](#contributing)

</div>

---

## Overview

**DevPulse** is a professional web scraping tool that aggregates trending developer content from GitHub, Hacker News, and Dev.to. Stay current with what's hot in tech by tracking trending repositories, popular discussions, and top articles—all in one place.

Built with Scrapy and designed with SOLID principles, DevPulse demonstrates production-ready architecture while providing genuinely useful data for developers who want to stay on top of industry trends.

## Features

✨ **Multi-Platform Tracking**
- GitHub trending repositories (with language filtering)
- Hacker News front page stories
- Dev.to trending posts (with tag filtering)

🛡️ **Production-Ready**
- Pydantic data validation
- Intelligent deduplication
- Respectful crawling (delays, user-agent rotation, robots.txt compliance)
- Comprehensive error handling

🎯 **Developer-Friendly**
- Simple CLI interface
- Flexible filtering options
- CSV export with timestamps
- Clean, well-documented code

🏗️ **Extensible Architecture**
- SOLID principles throughout
- Easy to add new platforms
- Modular pipeline system
- Type-safe with Python type hints

## Installation

### Requirements

- Python 3.8+
- pip

### Setup

```bash
# Clone the repository
git clone https://github.com/kosmickroma/devpulse.git
cd devpulse

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Usage

### Quick Start

Track trending content from all platforms:

```bash
python run.py --all
```

### Run Individual Spiders

**GitHub Trending:**

```bash
# Daily trending (all languages)
python run.py --spider github

# Weekly trending Python repos
python run.py --spider github --time-range weekly --language python

# Daily trending JavaScript
python run.py --spider github --language javascript
```

**Hacker News:**

```bash
# Front page
python run.py --spider hackernews

# Multiple pages
python run.py --spider hackernews --pages 3
```

**Dev.to:**

```bash
# Weekly top posts
python run.py --spider devto

# Monthly Python posts
python run.py --spider devto --time-range month --tag python
```

### Advanced Usage

**Run multiple spiders:**

```bash
python run.py --spider github hackernews
```

**Skip summary statistics:**

```bash
python run.py --all --no-summary
```

**Using Scrapy directly:**

```bash
# More control over scraping
scrapy crawl github -a time_range=weekly -a language=rust

# Custom output format
scrapy crawl hackernews -o custom_output.json -a page_limit=2
```

## Output

Results are saved to `output/devpulse_YYYY-MM-DD_HH-MM-SS.csv` with the following fields:

| Field | Description | Example |
|-------|-------------|---------|
| `title` | Content title | `facebook / react` |
| `url` | Direct link | `https://github.com/...` |
| `source` | Platform | `github`, `hackernews`, `devto` |
| `author` | Creator username | `gaearon` |
| `description` | Brief description | `A declarative...` |
| `language` | Programming language (GitHub) | `JavaScript` |
| `stars` | GitHub stars | `234567` |
| `score` | HN points | `342` |
| `comments` | Comment count | `87` |
| `reactions` | Dev.to reactions | `245` |
| `category` | Content type | `repository`, `article` |
| `timestamp` | When scraped | `2024-01-15T10:30:00` |

### Example Summary

```
============================================================
SUMMARY
============================================================

Results saved to: devpulse_2024-01-15_10-30-00.csv

Total items scraped: 85

Items by source:
  Github: 25 items
  Hackernews: 30 items
  Devto: 30 items

Top 5 trending items:
  1. facebook / react
     [github] ⭐ 234567 stars
  2. Show HN: Built a CLI tool for managing dotfiles
     [hackernews] ▲ 512 points
  3. Understanding Rust's Ownership Model
     [devto] ❤️ 245 reactions
  ...
```

## Architecture

DevPulse follows SOLID principles with clear separation of concerns:

```
devpulse/
├── spiders/          # Each platform has its own spider (Single Responsibility)
│   ├── github_spider.py
│   ├── hackernews_spider.py
│   └── devto_spider.py
├── items.py          # Pydantic models for data validation
├── pipelines.py      # Modular data processing pipeline
├── settings.py       # Centralized configuration
└── middlewares.py    # Custom request/response processing
```

### Data Flow

```
Spider extracts data
    ↓
ValidationPipeline: Validate with Pydantic
    ↓
CleaningPipeline: Normalize text
    ↓
DuplicatesPipeline: Remove duplicates by URL
    ↓
ExportPipeline: Save to CSV
```

## Why DevPulse?

**For Developers:**
- Stay current with trending tech
- Discover new projects and tools
- Track discussions in the dev community
- Monitor specific languages or topics

**For Portfolio:**
- Demonstrates professional Scrapy skills
- Shows understanding of SOLID principles
- Production-ready code quality
- Real-world useful application

**For Learning:**
- Clean, well-documented codebase
- Best practices for web scraping
- Pydantic validation examples
- CLI design patterns

## Extending DevPulse

### Adding a New Platform

1. Create spider in `devpulse/spiders/`:

```python
class NewPlatformSpider(scrapy.Spider):
    name = "newplatform"
    # Implement parsing logic
```

2. Update CLI in `run.py`:

```python
AVAILABLE_SPIDERS = ['github', 'hackernews', 'devto', 'newplatform']
```

3. Add platform-specific arguments if needed

### Adding New Fields

Update the `TrendingItem` model in `items.py` and adjust pipeline fieldnames accordingly.

## Best Practices

DevPulse demonstrates web scraping best practices:

- ✅ Respectful crawling delays (1-3 seconds)
- ✅ User-agent rotation
- ✅ Robots.txt compliance
- ✅ Comprehensive error handling
- ✅ Data validation before export
- ✅ URL-based deduplication
- ✅ Structured logging

## Troubleshooting

**"Scrapy not found" error:**

```bash
# Activate venv and install
source venv/bin/activate
pip install -r requirements.txt
```

**No items scraped:**

- Sites may have changed HTML structure
- Check network connectivity
- Verify robots.txt allows scraping
- Review logs for specific errors

**Validation errors:**

Check logs for Pydantic validation failures. Common issues:
- Malformed URLs
- Empty titles
- Invalid source names

## Roadmap

Future enhancements:

- [ ] Web dashboard for visualizing trends
- [ ] Database storage (PostgreSQL/MongoDB)
- [ ] Real-time updates via WebSocket
- [ ] Email/Slack notifications
- [ ] Trend analysis and insights
- [ ] API endpoint for programmatic access
- [ ] Docker containerization
- [ ] CI/CD pipeline

## Contributing

Contributions welcome! Areas for improvement:

- Additional platforms (Reddit, Lobsters, etc.)
- Sentiment analysis on comments
- Trend visualization
- Enhanced filtering options
- Performance optimizations

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

Built with:
- [Scrapy](https://scrapy.org/) - Web scraping framework
- [Pydantic](https://pydantic-docs.helpmanual.io/) - Data validation
- [scrapy-user-agents](https://github.com/alecxe/scrapy-user-agents) - User agent rotation

---

<div align="center">

**DevPulse** - Stay curious, stay current

[⭐ Star on GitHub](https://github.com/kosmickroma/devpulse) • [Report Bug](https://github.com/kosmickroma/devpulse/issues) • [Request Feature](https://github.com/kosmickroma/devpulse/issues)

</div>
