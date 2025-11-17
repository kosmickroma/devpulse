'use client'

import { useState, useEffect } from 'react'
import { GAME_INFO, getAllLeaderboards, getLeaderboard } from '@/lib/arcade'
import { supabase } from '@/lib/supabase'

interface LeaderboardEntry {
  rank: number
  username: string
  score: number
  achieved_at: string
  metadata?: Record<string, any>
  isCurrentUser?: boolean
  badge_icon?: string | null
  badge_name?: string | null
  badge_rarity?: string | null
}

interface GameLeaderboards {
  [gameId: string]: LeaderboardEntry[]
}

export default function ArcadeLeaderboard({ onClose }: { onClose: () => void }) {
  const [selectedGame, setSelectedGame] = useState<string>('all')
  const [globalLeaderboards, setGlobalLeaderboards] = useState<GameLeaderboards>({})
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<string | null>(null)

  const allGames = [
    { id: 'snake', name: 'SNAKE', emoji: '🐍', color: 'cyan' },
    { id: 'minesweeper', name: 'MINESWEEPER', emoji: '💣', color: 'yellow' },
    { id: 'guess', name: 'GUESS', emoji: '🎲', color: 'green' },
    { id: 'bagels', name: 'BAGELS', emoji: '🥯', color: 'green' },
    { id: 'nim', name: 'NIM', emoji: '🎯', color: 'green' },
    { id: 'amazing', name: 'AMAZING', emoji: '🌀', color: 'green' },
    { id: 'stock', name: 'STOCK', emoji: '📈', color: 'green' },
    { id: 'oregon', name: 'OREGON', emoji: '🐂', color: 'green' },
    { id: 'startrek', name: 'STAR TREK', emoji: '🚀', color: 'green' },
  ]

  useEffect(() => {
    loadGlobalLeaderboards()
    loadCurrentUser()
  }, [])

  const loadCurrentUser = async () => {
    // Get current username from Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Try to get username from user metadata or email
        const username = user.user_metadata?.username || user.email?.split('@')[0] || null
        setCurrentUser(username)
      }
    } catch (error) {
      console.error('Failed to load current user:', error)
    }
  }

  const loadGlobalLeaderboards = async () => {
    setLoading(true)
    try {
      const leaderboards = await getAllLeaderboards(50)
      setGlobalLeaderboards(leaderboards)
    } catch (error) {
      console.error('Failed to load global leaderboards:', error)
      // Leaderboards will be empty, component will show "no scores" message
    } finally {
      setLoading(false)
    }
  }

  const getGameInfo = (gameId: string) => {
    return allGames.find(g => g.id === gameId) || allGames[0]
  }

  // Get displayed entries based on selected game
  const getDisplayedEntries = (): Array<LeaderboardEntry & { gameId: string }> => {
    if (selectedGame === 'all') {
      // Combine all games, take top entry from each, sort by score
      const topScores: Array<LeaderboardEntry & { gameId: string }> = []
      Object.entries(globalLeaderboards).forEach(([gameId, entries]) => {
        if (entries.length > 0) {
          topScores.push({ ...entries[0], gameId })
        }
      })
      return topScores.sort((a, b) => b.score - a.score).slice(0, 50)
    } else {
      // Show full leaderboard for selected game
      const entries = globalLeaderboards[selectedGame] || []
      return entries.map(e => ({ ...e, gameId: selectedGame }))
    }
  }

  const displayedEntries = getDisplayedEntries()

  // Calculate stats
  const totalGamesWithScores = Object.keys(globalLeaderboards).filter(k => globalLeaderboards[k].length > 0).length
  const totalPlayers = new Set(Object.values(globalLeaderboards).flat().map(e => e.username)).size

  const getRarityColor = (gameId: string) => {
    const rarity = GAME_INFO[gameId]?.rarity || 'common'
    switch (rarity) {
      case 'common': return 'text-gray-400 border-gray-600'
      case 'uncommon': return 'text-green-400 border-green-600'
      case 'rare': return 'text-blue-400 border-blue-600'
      case 'epic': return 'text-purple-400 border-purple-600'
      default: return 'text-gray-400 border-gray-600'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose} />

      <div className="relative z-10 w-full max-w-6xl max-h-[90vh] flex flex-col bg-gradient-to-br from-gray-900 via-black to-gray-900 border-4 border-cyan-500 rounded-lg overflow-hidden shadow-[0_0_60px_rgba(6,182,212,0.6)]">

        {/* Animated Border Glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 opacity-30 animate-pulse pointer-events-none" style={{ padding: '4px', zIndex: -1 }} />

        {/* Header */}
        <div className="relative bg-gradient-to-r from-cyan-900/50 to-purple-900/50 p-6 border-b-4 border-cyan-500/50">
          <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_0%,rgba(6,182,212,0.1)_50%,transparent_100%)] animate-scanline pointer-events-none" />

          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-4xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-2 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
                ⚡ GLOBAL LEADERBOARD ⚡
              </h2>
              <p className="text-cyan-300/70 font-mono text-sm">
                {loading ? 'Loading rankings...' : `${totalPlayers} Players • ${totalGamesWithScores} Games Active`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-800 border-2 border-red-400 text-white font-mono font-bold hover:from-red-700 hover:to-red-900 transition-all duration-300 shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:shadow-[0_0_30px_rgba(239,68,68,0.8)]"
            >
              ESC
            </button>
          </div>

          {/* Game Filter Tabs */}
          <div className="mt-6 flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-cyan-500 scrollbar-track-gray-800">
            <button
              onClick={() => setSelectedGame('all')}
              className={`px-4 py-2 font-mono text-sm font-bold border-2 transition-all whitespace-nowrap ${
                selectedGame === 'all'
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-black border-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.6)]'
                  : 'bg-gray-800/50 text-cyan-400 border-cyan-700 hover:border-cyan-500'
              }`}
            >
              🎮 ALL GAMES
            </button>
            {allGames.map(game => (
              <button
                key={game.id}
                onClick={() => setSelectedGame(game.id)}
                className={`px-4 py-2 font-mono text-sm font-bold border-2 transition-all whitespace-nowrap ${
                  selectedGame === game.id
                    ? `bg-gradient-to-r from-${game.color}-500 to-${game.color}-700 text-black border-${game.color}-300 shadow-[0_0_20px_rgba(6,182,212,0.6)]`
                    : 'bg-gray-800/50 text-gray-400 border-gray-700 hover:border-gray-500'
                }`}
              >
                {game.emoji} {game.name}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="text-8xl mb-6 animate-spin">⚡</div>
              <h3 className="text-3xl font-bold text-cyan-400 mb-4 font-mono">LOADING...</h3>
              <p className="text-gray-400 font-mono">Fetching global rankings...</p>
            </div>
          ) : displayedEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="text-8xl mb-6 animate-pulse">🎮</div>
              <h3 className="text-3xl font-bold text-cyan-400 mb-4 font-mono">NO SCORES YET</h3>
              <p className="text-gray-400 font-mono">
                {selectedGame === 'all'
                  ? 'Be the first to set a high score!'
                  : 'Be the first to conquer this game!'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {displayedEntries.map((entry, index) => {
                const game = getGameInfo(entry.gameId)
                const isCurrentUser = currentUser && entry.username === currentUser
                const rankColors = [
                  'from-yellow-500 to-yellow-700 border-yellow-300 shadow-[0_0_30px_rgba(234,179,8,0.6)]', // 1st
                  'from-gray-300 to-gray-500 border-gray-200 shadow-[0_0_30px_rgba(156,163,175,0.6)]', // 2nd
                  'from-orange-600 to-orange-800 border-orange-400 shadow-[0_0_30px_rgba(234,88,12,0.6)]', // 3rd
                ]
                const isTopThree = entry.rank <= 3

                return (
                  <div
                    key={`${entry.gameId}-${entry.rank}-${entry.username}`}
                    className={`relative flex items-center gap-4 p-4 rounded-lg border-2 transition-all duration-300 ${
                      isTopThree
                        ? `bg-gradient-to-r ${rankColors[entry.rank - 1]} animate-pulse-slow`
                        : isCurrentUser
                        ? 'bg-purple-900/30 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                        : 'bg-gray-800/50 border-cyan-700/50 hover:border-cyan-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                    }`}
                  >
                    {/* Current user indicator */}
                    {isCurrentUser && !isTopThree && (
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 text-2xl animate-pulse">👈</div>
                    )}

                    {/* Rank */}
                    <div className={`flex-shrink-0 w-16 h-16 flex items-center justify-center font-mono text-2xl font-bold rounded ${
                      isTopThree ? 'text-black' : isCurrentUser ? 'text-purple-400 bg-purple-900/50 border-2 border-purple-500' : 'text-cyan-400 bg-gray-900/50 border-2 border-cyan-700'
                    }`}>
                      #{entry.rank}
                    </div>

                    {/* Game Info & Username */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-3xl">{game.emoji}</span>
                        <div>
                          <h3 className={`font-mono font-bold text-lg ${isTopThree ? 'text-black' : isCurrentUser ? 'text-purple-400' : 'text-cyan-400'}`}>
                            {game.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <div className={`text-sm font-mono flex items-center gap-1 ${isTopThree ? 'text-black/80' : isCurrentUser ? 'text-purple-300' : 'text-gray-300'}`}>
                              {entry.badge_icon ? (
                                <span className="text-base" title={entry.badge_name || ''}>{entry.badge_icon}</span>
                              ) : (
                                <span>👤</span>
                              )}
                              {entry.username}
                              {isCurrentUser && <span className="ml-2 text-xs">(YOU)</span>}
                            </div>
                            <div className={`text-xs font-mono uppercase px-2 py-0.5 rounded border inline-block ${isTopThree ? 'text-black/60 border-black/40' : getRarityColor(entry.gameId)}`}>
                              {GAME_INFO[entry.gameId]?.rarity || 'common'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="flex-shrink-0 text-right">
                      <div className={`text-xs font-mono mb-1 ${isTopThree ? 'text-black/70' : 'text-cyan-500/60'}`}>
                        SCORE
                      </div>
                      <div className={`text-4xl font-mono font-bold ${isTopThree ? 'text-black' : 'text-yellow-400'}`}>
                        {entry.score.toLocaleString()}
                      </div>
                    </div>

                    {/* Trophy Icons for Top 3 */}
                    {isTopThree && (
                      <div className="absolute -top-2 -right-2 text-4xl animate-bounce-slow">
                        {index === 0 && '🏆'}
                        {index === 1 && '🥈'}
                        {index === 2 && '🥉'}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="bg-gray-900/90 p-4 border-t-2 border-cyan-500/50">
          <div className="flex justify-around text-center">
            <div>
              <div className="text-2xl font-bold text-cyan-400 font-mono">{totalGamesWithScores}</div>
              <div className="text-xs text-gray-400 font-mono">ACTIVE GAMES</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400 font-mono">
                {totalPlayers}
              </div>
              <div className="text-xs text-gray-400 font-mono">TOTAL PLAYERS</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-pink-400 font-mono">
                {displayedEntries.length}
              </div>
              <div className="text-xs text-gray-400 font-mono">RANKINGS SHOWN</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scanlines Effect */}
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent bg-[length:100%_4px] animate-scanline" />
    </div>
  )
}
