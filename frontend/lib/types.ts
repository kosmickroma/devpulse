export interface TrendingItem {
  id: string
  title: string
  url: string
  source: 'github' | 'hackernews' | 'devto' | 'producthunt' | 'reddit'
  author?: string
  description?: string
  language?: string
  stars?: number
  score?: number
  comments?: number
  reactions?: number
  category: 'repository' | 'article' | 'discussion' | 'product'
  scrapedAt: Date
  momentum?: 'high' | 'medium' | 'low'
  isNew?: boolean
}
