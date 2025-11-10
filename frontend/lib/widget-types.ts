/**
 * Widget system types
 */

import { Layout } from 'react-grid-layout'

export type WidgetType =
  | 'feed'           // Main trending feed (GitHub, HN, Dev.to)
  | 'stock_ticker'   // Stock market ticker
  | 'crypto_ticker'  // Cryptocurrency ticker
  | 'synth_chat'     // SYNTH AI chat
  | 'news'           // News aggregator

export type WidgetViewMode = 'compact' | 'card' | 'fullscreen'

export interface WidgetConfig {
  id: string
  type: WidgetType
  title: string
  viewMode: WidgetViewMode
  settings: Record<string, any> // Widget-specific settings
}

export interface StockTickerSettings {
  tickers: string[]         // ['AAPL', 'TSLA', 'NVDA']
  showTrending: boolean     // Show trending alongside watchlist
  refreshInterval: number   // Seconds between updates
}

export interface CryptoTickerSettings {
  coins: string[]           // ['bitcoin', 'ethereum', 'solana']
  showTrending: boolean
  refreshInterval: number
}

export interface FeedSettings {
  sources: string[]         // ['github', 'hackernews', 'devto']
  layout: 'grid' | 'list'
}

export interface SynthChatSettings {
  personality: string
  autoGreet: boolean
}

export interface NewsSettings {
  sources: string[]
  topics: string[]
}

export interface UserWidget {
  id: string
  user_id: string
  widget_type: WidgetType
  position: Layout          // react-grid-layout position
  config: WidgetConfig
  created_at: string
}

// Default widget configurations
export const DEFAULT_WIDGET_CONFIGS: Record<WidgetType, Partial<WidgetConfig>> = {
  feed: {
    title: 'Trending Feed',
    viewMode: 'card',
    settings: {
      sources: ['github', 'hackernews', 'devto'],
      layout: 'grid'
    } as FeedSettings
  },
  stock_ticker: {
    title: 'Stock Tracker',
    viewMode: 'card',
    settings: {
      tickers: [],
      showTrending: true,
      refreshInterval: 30
    } as StockTickerSettings
  },
  crypto_ticker: {
    title: 'Crypto Tracker',
    viewMode: 'card',
    settings: {
      coins: [],
      showTrending: true,
      refreshInterval: 30
    } as CryptoTickerSettings
  },
  synth_chat: {
    title: 'SYNTH AI',
    viewMode: 'card',
    settings: {
      personality: 'default',
      autoGreet: false
    } as SynthChatSettings
  },
  news: {
    title: 'News Aggregator',
    viewMode: 'card',
    settings: {
      sources: [],
      topics: []
    } as NewsSettings
  }
}

// Default grid layouts for each widget type
export const DEFAULT_WIDGET_LAYOUTS: Record<WidgetType, Partial<Layout>> = {
  feed: { w: 12, h: 8, minW: 6, minH: 4 },
  stock_ticker: { w: 6, h: 4, minW: 4, minH: 3 },
  crypto_ticker: { w: 6, h: 4, minW: 4, minH: 3 },
  synth_chat: { w: 4, h: 6, minW: 3, minH: 4 },
  news: { w: 6, h: 6, minW: 4, minH: 4 }
}
