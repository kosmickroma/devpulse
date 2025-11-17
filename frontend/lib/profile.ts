// Profile API utilities for username management

import { supabase } from './supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface UserProfile {
  user_id: string
  username: string | null
  arcade_profile: {
    total_xp: number
    level: number
  } | null
  equipped_badge: {
    badge_id: string
    badges: {
      id: string
      name: string
      icon: string
      rarity: string
    }
  } | null
}

export interface UsernameAvailability {
  available: boolean
  reason: string | null
}

/**
 * Get current user's profile
 */
export async function getMyProfile(): Promise<UserProfile | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    if (!token) {
      return null
    }

    const response = await fetch(`${API_URL}/api/arcade/profile/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to fetch profile:', error)
    return null
  }
}

/**
 * Update username
 */
export async function updateUsername(newUsername: string): Promise<{ success: boolean; message?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    if (!token) {
      return { success: false, message: 'Not authenticated' }
    }

    const response = await fetch(`${API_URL}/api/arcade/profile/username`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ username: newUsername })
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, message: error.detail || 'Failed to update username' }
    }

    const data = await response.json()
    return { success: true, message: data.message }
  } catch (error) {
    console.error('Failed to update username:', error)
    return { success: false, message: 'Network error' }
  }
}

/**
 * Check if username is available
 */
export async function checkUsernameAvailability(username: string): Promise<UsernameAvailability> {
  try {
    const response = await fetch(`${API_URL}/api/arcade/profile/check-username/${encodeURIComponent(username)}`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to check username:', error)
    return { available: false, reason: 'Network error' }
  }
}
