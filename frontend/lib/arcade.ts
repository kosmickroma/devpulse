// Arcade API utilities for score submission and leaderboards

import { supabase } from './supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface ScoreSubmission {
  gameId: string
  score: number
  metadata?: Record<string, any>
}

export interface ScoreResponse {
  success: boolean
  is_new_high_score: boolean
  xp_awarded: number
  global_rank: number | null
  score: number
}

export interface LeaderboardEntry {
  rank: number
  username: string
  score: number
  achieved_at: string
  metadata?: Record<string, any>
}

export interface ArcadeProfile {
  profile: {
    user_id: string
    total_xp: number
    level: number
    is_early_explorer: boolean
    early_explorer_granted_at: string | null
    daily_streak: number
    last_play_date: string | null
  }
  high_scores: Array<{
    game_id: string
    score: number
    achieved_at: string
  }>
  ranks: Record<string, number>
}

/**
 * Submit a score to the arcade system
 * Automatically saves to localStorage AND submits to backend
 * - localStorage: immediate local storage for display
 * - Backend: global leaderboards and XP (requires authentication)
 */
export async function submitScore(submission: ScoreSubmission): Promise<ScoreResponse> {
  // Always save to localStorage first (works for everyone)
  const currentBest = getLocalHighScore(submission.gameId)
  const isNewLocalBest = submission.score > currentBest

  if (isNewLocalBest) {
    saveLocalHighScore(submission.gameId, submission.score)
  }

  // Try to submit to backend (requires authentication)
  try {
    // Get token from Supabase session
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    if (!token) {
      // Not authenticated - return local-only response
      console.log('[Arcade] No auth token, score saved locally only')
      return {
        success: true,
        is_new_high_score: isNewLocalBest,
        xp_awarded: 0,
        global_rank: null,
        score: submission.score
      }
    }

    console.log('[Arcade] Submitting score to backend...', submission)

    // Convert to snake_case for backend
    const backendPayload = {
      game_id: submission.gameId,
      score: submission.score,
      metadata: submission.metadata || {}
    }

    const response = await fetch(`${API_URL}/api/arcade/submit-score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(backendPayload)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to submit score to backend:', error)
    // Return fallback response with local info
    return {
      success: true,
      is_new_high_score: isNewLocalBest,
      xp_awarded: 0,
      global_rank: null,
      score: submission.score
    }
  }
}

/**
 * Get leaderboard for a specific game
 */
export async function getLeaderboard(gameId: string, limit: number = 50): Promise<LeaderboardEntry[]> {
  try {
    const response = await fetch(`${API_URL}/api/arcade/leaderboard/${gameId}?limit=${limit}`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    return data.leaderboard || []
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error)
    return []
  }
}

/**
 * Get all leaderboards (for leaderboard page)
 */
export async function getAllLeaderboards(limit: number = 10): Promise<Record<string, LeaderboardEntry[]>> {
  try {
    const response = await fetch(`${API_URL}/api/arcade/all-leaderboards?limit=${limit}`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    return data.leaderboards || {}
  } catch (error) {
    console.error('Failed to fetch all leaderboards:', error)
    return {}
  }
}

/**
 * Get user's arcade profile
 */
export async function getArcadeProfile(): Promise<ArcadeProfile | null> {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      return null
    }

    const response = await fetch(`${API_URL}/api/arcade/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to fetch arcade profile:', error)
    return null
  }
}

/**
 * Get high score from localStorage (fallback for non-authenticated users)
 */
export function getLocalHighScore(gameId: string): number {
  if (typeof window === 'undefined') return 0
  const score = localStorage.getItem(`${gameId}-highscore`)
  return score ? parseInt(score) : 0
}

/**
 * Save high score to localStorage (fallback)
 */
export function saveLocalHighScore(gameId: string, score: number): void {
  if (typeof window === 'undefined') return
  const currentBest = getLocalHighScore(gameId)
  if (score > currentBest) {
    localStorage.setItem(`${gameId}-highscore`, score.toString())
  }
}

/**
 * Game metadata helpers
 */
export const GAME_INFO: Record<string, { name: string; rarity: string }> = {
  snake: { name: 'Snake', rarity: 'common' },
  minesweeper: { name: 'Minesweeper', rarity: 'uncommon' },
  guess: { name: 'GUESS', rarity: 'common' },
  bagels: { name: 'BAGELS', rarity: 'common' },
  nim: { name: 'NIM', rarity: 'uncommon' },
  amazing: { name: 'AMAZING', rarity: 'uncommon' },
  stock: { name: 'STOCK', rarity: 'uncommon' },
  oregon: { name: 'OREGON', rarity: 'rare' },
  startrek: { name: 'SUPER STAR TREK', rarity: 'epic' }
}

/**
 * Badge types
 */
export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  rarity: string
}

export interface UserBadge {
  id: string
  badge_id: string
  unlocked_at: string
  is_equipped: boolean
  badges: Badge
}

/**
 * Check for newly unlocked badges by comparing with seen badges in localStorage
 * Returns badges that should trigger the unlock popup
 */
export async function checkNewBadges(): Promise<Badge[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    if (!token) {
      console.log('[Badge Check] No auth token')
      return []
    }

    // Get all user badges
    const response = await fetch(`${API_URL}/api/arcade/badges/user`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      console.error('[Badge Check] API error:', response.status)
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    const allBadges: UserBadge[] = data.badges || []
    console.log('[Badge Check] All user badges:', allBadges)

    if (allBadges.length === 0) {
      return []
    }

    // Get list of badge IDs we've already shown
    const seenBadgesJson = localStorage.getItem('seen-badges')
    const seenBadgeIds: Set<string> = new Set(seenBadgesJson ? JSON.parse(seenBadgesJson) : [])
    console.log('[Badge Check] Previously seen badges:', Array.from(seenBadgeIds))

    // Find new badges (not in seen list)
    const newBadges = allBadges
      .filter(ub => !seenBadgeIds.has(ub.badge_id))
      .map(ub => ub.badges)

    if (newBadges.length > 0) {
      console.log('[Badge Check] Found NEW badges to show:', newBadges)
      // Mark these as seen
      allBadges.forEach(ub => seenBadgeIds.add(ub.badge_id))
      localStorage.setItem('seen-badges', JSON.stringify(Array.from(seenBadgeIds)))
    }

    return newBadges
  } catch (error) {
    console.error('[Badge Check] Failed to check new badges:', error)
    return []
  }
}

/**
 * Get all user's badges
 */
export async function getUserBadges(): Promise<UserBadge[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    if (!token) {
      return []
    }

    const response = await fetch(`${API_URL}/api/arcade/badges/user`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    return data.badges || []
  } catch (error) {
    console.error('Failed to fetch user badges:', error)
    return []
  }
}

/**
 * Equip or unequip a badge
 */
export async function equipBadge(badgeId: string, isEquipped: boolean): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    if (!token) {
      return false
    }

    const response = await fetch(`${API_URL}/api/arcade/badges/equip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        badge_id: badgeId,
        is_equipped: isEquipped
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return true
  } catch (error) {
    console.error('Failed to equip badge:', error)
    return false
  }
}
