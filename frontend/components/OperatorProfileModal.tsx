'use client'

import { useState, useEffect } from 'react'
import { getMyProfile, updateUsername, checkUsernameAvailability, type UserProfile } from '@/lib/profile'
import { getUserBadges, equipBadge, type UserBadge } from '@/lib/arcade'

interface OperatorProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function OperatorProfileModal({ isOpen, onClose }: OperatorProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [badges, setBadges] = useState<UserBadge[]>([])
  const [loading, setLoading] = useState(true)

  // Username change state
  const [newUsername, setNewUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [usernameMessage, setUsernameMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Load profile and badges
  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  const loadData = async () => {
    setLoading(true)
    const [profileData, badgesData] = await Promise.all([
      getMyProfile(),
      getUserBadges()
    ])
    setProfile(profileData)
    setBadges(badgesData)
    setNewUsername(profileData?.username || '')
    setLoading(false)
  }

  // Check username availability (debounced)
  useEffect(() => {
    if (!newUsername || newUsername === profile?.username) {
      setUsernameStatus('idle')
      setUsernameMessage('')
      return
    }

    setUsernameStatus('checking')
    const timer = setTimeout(async () => {
      const result = await checkUsernameAvailability(newUsername)
      if (result.available) {
        setUsernameStatus('available')
        setUsernameMessage('✓ Username available')
      } else {
        setUsernameStatus(result.reason?.includes('already taken') ? 'taken' : 'invalid')
        setUsernameMessage(result.reason || 'Invalid username')
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [newUsername, profile?.username])

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (usernameStatus !== 'available') return

    setSubmitting(true)
    const result = await updateUsername(newUsername)

    if (result.success) {
      setSuccessMessage('✓ Username updated successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
      // Reload profile
      const updatedProfile = await getMyProfile()
      setProfile(updatedProfile)
    } else {
      setUsernameMessage(result.message || 'Failed to update')
      setUsernameStatus('invalid')
    }
    setSubmitting(false)
  }

  const handleEquipBadge = async (badgeId: string, isCurrentlyEquipped: boolean) => {
    const success = await equipBadge(badgeId, !isCurrentlyEquipped)
    if (success) {
      // Reload badges and profile
      const [badgesData, profileData] = await Promise.all([
        getUserBadges(),
        getMyProfile()
      ])
      setBadges(badgesData)
      setProfile(profileData)
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'holographic': return 'holographic'
      case 'legendary': return 'neon-magenta'
      case 'epic': return 'neon-purple'
      case 'rare': return 'neon-blue'
      case 'uncommon': return 'neon-cyan'
      case 'common': return 'neon-green'
      default: return 'neon-green'
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/90 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 overflow-y-auto">
        <div
          className="bg-dark-bg border-4 border-neon-magenta rounded-lg shadow-[0_0_60px_rgba(255,0,255,0.4)] w-full max-w-4xl my-8 animate-in zoom-in-95 fade-in duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b-2 border-neon-magenta/30 flex items-center justify-between sticky top-0 bg-dark-bg z-10">
            <div>
              <h2 className="text-3xl font-mono font-bold text-neon-magenta drop-shadow-[0_0_10px_rgba(255,0,255,0.8)]">
                👤 OPERATOR PROFILE
              </h2>
              <p className="text-sm font-mono text-gray-400 mt-1">
                Manage your identity and achievements
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-neon-magenta text-2xl font-bold transition-colors"
            >
              ×
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="text-neon-cyan font-mono animate-pulse">Loading profile...</div>
            </div>
          ) : (
            <div className="p-6 space-y-8">
              {/* Username Section */}
              <div className="border-2 border-neon-cyan/30 rounded-lg p-6 bg-black/30">
                <h3 className="text-xl font-mono font-bold text-neon-cyan mb-4 flex items-center gap-2">
                  <span>🏷️</span>
                  OPERATOR HANDLE
                </h3>

                <div className="mb-4">
                  <div className="text-sm font-mono text-gray-400 mb-2">Current Username:</div>
                  <div className="text-2xl font-mono font-bold text-neon-cyan">
                    {profile?.username || 'Not set'}
                  </div>
                </div>

                <form onSubmit={handleUsernameSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-mono text-gray-300 mb-2">
                      New Username (3-20 characters, letters/numbers/underscores):
                    </label>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full bg-black/50 border-2 border-gray-700 focus:border-neon-cyan rounded px-4 py-2 font-mono text-cyan-400 outline-none transition-colors"
                      placeholder="Enter new username"
                    />
                    {usernameStatus !== 'idle' && (
                      <div className={`text-sm font-mono mt-2 ${
                        usernameStatus === 'available' ? 'text-neon-green' :
                        usernameStatus === 'checking' ? 'text-gray-400' :
                        'text-neon-magenta'
                      }`}>
                        {usernameStatus === 'checking' ? 'Checking...' : usernameMessage}
                      </div>
                    )}
                  </div>

                  {successMessage && (
                    <div className="bg-neon-green/10 border-2 border-neon-green rounded p-3 text-neon-green font-mono text-sm">
                      {successMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={usernameStatus !== 'available' || submitting}
                    className={`px-6 py-2 font-mono font-bold rounded transition-all ${
                      usernameStatus === 'available' && !submitting
                        ? 'bg-neon-cyan text-black hover:shadow-[0_0_20px_rgba(0,255,255,0.6)] border-2 border-neon-cyan'
                        : 'bg-gray-700 text-gray-500 border-2 border-gray-700 cursor-not-allowed'
                    }`}
                  >
                    {submitting ? 'Updating...' : 'Update Username'}
                  </button>
                </form>
              </div>

              {/* Equipped Badge Section */}
              {profile?.equipped_badge && (
                <div className="border-2 border-neon-purple/30 rounded-lg p-6 bg-black/30">
                  <h3 className="text-xl font-mono font-bold text-neon-purple mb-4 flex items-center gap-2">
                    <span>⭐</span>
                    CURRENTLY EQUIPPED
                  </h3>
                  {(() => {
                    const isHolographic = profile.equipped_badge.badges.rarity.toLowerCase() === 'holographic'
                    const color = getRarityColor(profile.equipped_badge.badges.rarity)

                    return (
                      <div
                        className={`flex items-center gap-4 p-4 border-2 ${isHolographic ? 'border-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 p-[2px]' : `border-${color}`} rounded bg-black/50`}
                        style={isHolographic ? {
                          boxShadow: '0 0 30px rgba(255, 0, 255, 0.5), 0 0 45px rgba(0, 255, 255, 0.3)'
                        } : undefined}
                      >
                        {isHolographic && <div className="absolute inset-[2px] bg-black/50 rounded z-0" />}
                        <div className="relative z-10">
                          {profile.equipped_badge.badges.icon.startsWith('/') ? (
                            <img
                              src={profile.equipped_badge.badges.icon}
                              alt={profile.equipped_badge.badges.name}
                              className="w-20 h-20"
                            />
                          ) : (
                            <div className="text-6xl">{profile.equipped_badge.badges.icon}</div>
                          )}
                        </div>
                        <div className="relative z-10">
                          <div className={`text-2xl font-mono font-bold ${isHolographic ? 'text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500' : `text-${color}`}`}>
                            {profile.equipped_badge.badges.name}
                          </div>
                          <div className={`text-xs font-mono uppercase ${isHolographic ? 'text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500' : `text-${color}/70`}`}>
                            {profile.equipped_badge.badges.rarity}
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* Badge Collection */}
              <div className="border-2 border-neon-purple/30 rounded-lg p-6 bg-black/30">
                <h3 className="text-xl font-mono font-bold text-neon-purple mb-4 flex items-center gap-2">
                  <span>🎖️</span>
                  BADGE COLLECTION ({badges.length})
                </h3>

                {badges.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 font-mono">
                    No badges earned yet. Play games to unlock badges!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {badges.map((userBadge) => {
                      const badge = userBadge.badges
                      const color = getRarityColor(badge.rarity)
                      const isEquipped = userBadge.is_equipped
                      const isHolographic = badge.rarity.toLowerCase() === 'holographic'

                      return (
                        <div
                          key={userBadge.id}
                          className={`border-2 ${isHolographic ? 'border-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 p-[2px]' : `border-${color}/30`} rounded-lg ${isHolographic ? '' : 'p-4'} bg-black/50 transition-all ${isHolographic ? '' : `hover:border-${color} hover:shadow-[0_0_20px_rgba(255,0,255,0.3)]`}`}
                          style={isHolographic ? {
                            boxShadow: '0 0 30px rgba(255, 0, 255, 0.5), 0 0 45px rgba(0, 255, 255, 0.3)'
                          } : undefined}
                        >
                          {isHolographic && <div className="absolute inset-[2px] bg-black/50 rounded-lg z-0" />}
                          <div className={`flex items-start gap-3 ${isHolographic ? 'p-4 relative z-10' : ''}`}>
                            <div className="flex-shrink-0">
                              {badge.icon.startsWith('/') ? (
                                <img
                                  src={badge.icon}
                                  alt={badge.name}
                                  className="w-12 h-12"
                                />
                              ) : (
                                <div className="text-4xl">{badge.icon}</div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className={`font-mono font-bold mb-1 ${isHolographic ? 'text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500' : `text-${color}`}`}>
                                {badge.name}
                              </div>
                              <div className="text-xs text-gray-400 font-mono mb-2">
                                {badge.description}
                              </div>
                              <div className={`text-xs font-mono uppercase mb-3 ${isHolographic ? 'text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500' : `text-${color}/70`}`}>
                                {badge.rarity}
                              </div>
                              <button
                                onClick={() => handleEquipBadge(badge.id, isEquipped)}
                                className={`px-3 py-1 text-xs font-mono font-bold rounded transition-all ${
                                  isEquipped
                                    ? isHolographic
                                      ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-black border-2 border-transparent'
                                      : `bg-${color}/20 border-2 border-${color} text-${color}`
                                    : `bg-gray-700 border-2 border-gray-600 text-gray-300 ${isHolographic ? 'hover:border-pink-500 hover:text-pink-500' : `hover:border-${color} hover:text-${color}`}`
                                }`}
                              >
                                {isEquipped ? '✓ EQUIPPED' : 'EQUIP'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scanline effect */}
      <div className="fixed inset-0 z-[9997] pointer-events-none bg-gradient-to-b from-transparent via-magenta-500/5 to-transparent bg-[length:100%_4px] animate-scanline" />
    </>
  )
}
