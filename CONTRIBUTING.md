# Contributing to DevPulse

Thank you for your interest in contributing to DevPulse! This document provides guidelines and information for contributors.

## Code of Conduct

Be respectful, inclusive, and constructive. We're all here to build something useful for the developer community.

## How to Contribute

### Reporting Bugs

Found a bug? Please open an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Your environment (OS, Python version, etc.)
- Any error messages or logs

### Suggesting Features

Have an idea? Open an issue with:
- Clear description of the feature
- Use case and benefits
- Any implementation ideas (optional)

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/your-feature-name`
3. **Make your changes**
4. **Test thoroughly**
5. **Commit with clear messages**
6. **Push to your fork**
7. **Open a Pull Request**

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/devpulse.git
cd devpulse

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Test a spider
python run.py --spider hackernews
```

## Project Structure

```
devpulse/
├── devpulse/
│   ├── spiders/         # Add new platform scrapers here
│   ├── items.py         # Data models (usually don't need changes)
│   ├── pipelines.py     # Data processing pipelines
│   ├── settings.py      # Scrapy configuration
│   └── middlewares.py   # Custom middleware
├── run.py               # CLI interface
└── tests/               # Tests (coming soon)
```

## Adding a New Platform

Want to add a new data source? Here's how:

### 1. Create the Spider

Create a new file in `devpulse/spiders/`:

```python
# devpulse/spiders/yourplatform_spider.py

import scrapy
from scrapy.http import Response
from typing import Generator

class YourPlatformSpider(scrapy.Spider):
    """Spider for scraping YourPlatform."""

    name = "yourplatform"
    allowed_domains = ["yourplatform.com"]

    custom_settings = {
        'ROBOTSTXT_OBEY': True,
        'DOWNLOAD_DELAY': 2,  # Be respectful!
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.start_urls = ["https://yourplatform.com/trending"]

    def parse(self, response: Response) -> Generator:
        """Parse the page and extract items."""
        # Your extraction logic here
        for item in response.css('your-selector'):
            yield {
                'title': item.css('title::text').get(),
                'url': item.css('link::attr(href)').get(),
                'source': 'yourplatform',
                # ... other fields
            }
```

### 2. Update CLI

Add your spider to `run.py`:

```python
AVAILABLE_SPIDERS = ['github', 'hackernews', 'devto', 'yourplatform']
```

### 3. Test It

```bash
python run.py --spider yourplatform
```

### 4. Document It

Update README.md with:
- Platform status in the table
- Usage examples
- Any platform-specific notes

## Coding Standards

### Python Style

- Follow PEP 8
- Use type hints
- Write docstrings for classes and complex functions
- Keep functions focused and small

**Example:**

```python
def extract_score(self, element) -> Optional[int]:
    """
    Extract score from element.

    Args:
        element: Scrapy selector element

    Returns:
        Score as integer, or None if not found
    """
    score_text = element.css('.score::text').get()
    if score_text:
        return int(score_text.strip())
    return None
```

### Web Scraping Best Practices

1. **Respect robots.txt** - Always set `ROBOTSTXT_OBEY = True`
2. **Use delays** - Add reasonable `DOWNLOAD_DELAY` (2-3 seconds)
3. **Handle errors gracefully** - Sites change, code should handle it
4. **Use proper selectors** - CSS or XPath, with fallbacks
5. **Log appropriately** - Help debugging without spam

### Commit Messages

Write clear, descriptive commit messages:

```bash
# Good
git commit -m "Add Reddit spider for r/programming"
git commit -m "Fix price extraction in eBay spider"
git commit -m "Update README with new platform"

# Bad
git commit -m "fix stuff"
git commit -m "updates"
git commit -m "wip"
```

## Testing

Currently manual testing. Automated tests coming soon!

**Manual testing checklist:**
- [ ] Spider runs without errors
- [ ] Extracts expected number of items
- [ ] Data validates through Pydantic
- [ ] CSV export works correctly
- [ ] Respects robots.txt
- [ ] Handles pagination (if applicable)

## Areas Needing Help

### High Priority

1. **GitHub API Integration** (v1.1)
   - Replace HTML scraper with API client
   - Handle authentication
   - Implement rate limiting

2. **Web UI** (v2.0)
   - React dashboard design
   - Data visualization components
   - Backend API for frontend

3. **Additional Platforms**
   - Product Hunt spider
   - Reddit integration
   - Stack Overflow trending

### Medium Priority

4. **Testing**
   - Unit tests for pipelines
   - Spider tests with mock responses
   - CI/CD setup

5. **Documentation**
   - API documentation
   - Architecture diagrams
   - Video tutorials

6. **Performance**
   - Optimize scraping efficiency
   - Caching strategies
   - Database integration

## Questions?

- Open an issue for questions
- Check existing issues and PRs first
- Be patient - this is maintained by volunteers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to DevPulse!** 🚀

Every contribution, no matter how small, helps make DevPulse better for developers everywhere.
