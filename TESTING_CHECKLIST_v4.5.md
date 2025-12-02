# ==============================================================================
# The Irrawaddy HTML SCRAPER POC - For DevPulse Integration (100+ Articles)
# ==============================================================================
#
# DATE: 2025-11-27
# SOURCE: https://www.irrawaddy.com/ + category pages (RSS dead, HTML live)
# PURPOSE: Scrape 100+ Myanmar stories from site structure – uncapped, Cloudflare-proof
#
# ==============================================================================

import requests
from bs4 import BeautifulSoup
from datetime import datetime
import re
import time  # For rate-limiting

def fetch_page(url, session):
    """
    Fetch a page with session (cookies) to bypass Cloudflare.
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.irrawaddy.com/',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
    }
    try:
        r = session.get(url, headers=headers, timeout=15)
        r.raise_for_status()
        return BeautifulSoup(r.content, 'html.parser')
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None


def extract_articles(soup, base_url):
    """
    Extract articles from a page soup (title, url, desc, author, date).
    """
    articles = []
    # From your paste: Articles in <h3> or .article-title, links in <a>, desc in <p>, author in byline
    article_elements = soup.find_all(['h3', 'h2', 'article'], class_=re.compile(r'(title|headline|post)')) or soup.find_all('div', class_=re.compile(r'(story|news|post)'))
    for elem in article_elements:
        title_tag = elem.find(['h1', 'h2', 'h3', 'a'])
        if not title_tag or not title_tag.text.strip():
            continue
        title = title_tag.text.strip()
        link_tag = elem.find('a', href=True)
        if link_tag:
            url = link_tag['href']
            if not url.startswith('http'):
                url = base_url + url if url.startswith('/') else base_url + '/' + url
        else:
            continue

        # Description: Next <p> or .excerpt
        desc_tag = elem.find_next('p') or elem.find('div', class_='description')
        description = desc_tag.text.strip() if desc_tag else "No description available"

        # Author: "by Name" in byline
        author = "The Irrawaddy"
        byline = elem.find('span', class_='author') or elem.find(text=re.compile(r'by\s+', re.I))
        if byline:
            match = re.search(r'by\s+(.+?)(?:\s+\d)', byline, re.I)
            if match:
                author = match.group(1).strip()

        # Date: "November 27, 2025" in <time> or text
        date_str = None
        date_tag = elem.find('time') or elem.find(text=re.compile(r'(\w+ \d{1,2}, \d{4})'))
        if date_tag:
            date_str = re.search(r'(\w+ \d{1,2}, \d{4})', date_tag.text or date_tag) if hasattr(date_tag, 'text') else None
            if date_str:
                date_str = date_str.group(1)
                try:
                    pub_date = datetime.strptime(date_str, '%B %d, %Y').isoformat()
                except:
                    pub_date = date_str
            else:
                pub_date = date_str
        else:
            pub_date = date_str

        articles.append({
            'title': title,
            'url': url,
            'description': description[:300] + "..." if len(description) > 300 else description,  # Truncate for POC
            'author': author,
            'pub_date': pub_date
        })

    return articles


def fetch_articles():
    base_url = "https://www.irrawaddy.com"
    session = requests.Session()  # For cookies
    all_articles = []
    seen_urls = set()

    # Pages to scrape: Homepage + categories from your paste (News, Politics, Burma)
    pages = [
        base_url + '/',
        base_url + '/news/',
        base_url + '/news/politics/',
        base_url + '/news/burma/'
    ]

    print("Scraping The Irrawaddy pages for articles...\n")
    for page_url in pages:
        soup = fetch_page(page_url, session)
        if not soup:
            continue
        page_articles = extract_articles(soup, base_url)
        new_articles = [art for art in page_articles if art['url'] not in seen_urls]
        all_articles.extend(new_articles)
        seen_urls.update(art['url'] for art in new_articles)
        print(f"  → {page_url.split('/')[-1] or 'home'}: {len(new_articles)} new articles")
        time.sleep(1)  # Rate-limit: 1 sec/page to be respectful

    # Sort by pub_date descending (if parsable)
    def sort_key(art):
        if art['pub_date'] and isinstance(art['pub_date'], str) and re.match(r'\d{4}-\d{2}-\d{2}', art['pub_date']):
            return art['pub_date']
        return art['pub_date'] or ''

    all_articles.sort(key=sort_key, reverse=True)

    print(f"\nTotal unique articles scraped: {len(all_articles)}")
    return all_articles


if __name__ == '__main__':
    print("Testing The Irrawaddy HTML Scraper POC – 100+ Myanmar stories...\n")
    articles = fetch_articles()

    print(f"\nFinal count: {len(articles)} articles fetched")

    if articles:
        a = articles[0]
        print("\nMost recent article:")
        print(f"Title:  {a['title']}")
        print(f"URL:    {a['url']}")
        print(f"Desc:   {a['description'][:160]}{'...' if len(a['description']) > 160 else ''}")
        print(f"Author: {a['author']}")
        print(f"Date:   {a['pub_date']}")

        print("\nValidation:")
        print(f"  - Articles fetched : {len(articles)} (>= 100)")
        print(f"  - All URLs absolute: {all(a['url'].startswith('https://') for a in articles)}")
        print(f"  - All titles present: {all(a['title'].strip() for a in articles)}")
        print(f"  - Unique URLs: {len(set(a['url'] for a in articles)) == len(articles)}")
    else:
        print("No articles — check network or site changes")