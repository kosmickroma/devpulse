'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import XPProgressBar from './XPProgressBar'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Question {
  id: string
  type: string
  difficulty: number
  tier: number
  level: number
  topics: string[]
  code?: string
  question: string
  options: {
    A: string
    B: string
    C: string
    D: string
  }
  hint?: string
  time_limit: number
}

interface LevelProgress {
  tier: number
  level: number
  unlocked: boolean
  completed: boolean
  accuracy: number
  questions_answered: number
  questions_correct: number
}

interface GameProps {
  onGameOver?: (score: number, xp: number) => void
}

export default function CodeQuest({ onGameOver }: GameProps) {
  // Game mode state
  const [gameMode, setGameMode] = useState<'menu' | 'levelSelect' | 'playing' | 'feedback' | 'gameOver'>('menu')
  const [currentTier, setCurrentTier] = useState(1)
  const [currentLevel, setCurrentLevel] = useState(1)

  // Game state
  const [question, setQuestion] = useState<Question | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [lives, setLives] = useState(5)
  const [score, setScore] = useState(0)
  const [totalXP, setTotalXP] = useState(0)
  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)
  const [questionNumber, setQuestionNumber] = useState(0)
  const [isCorrect, setIsCorrect] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [answerStartTime, setAnswerStartTime] = useState<number>(0)
  const [speedBonus, setSpeedBonus] = useState(1.0)
  const [xpEarned, setXpEarned] = useState(0)

  // Retry state
  const [questionAttempts, setQuestionAttempts] = useState<Record<string, number>>({})
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<string[]>([])

  // Progress tracking
  const [levelProgress, setLevelProgress] = useState<LevelProgress[]>([])
  const [isReplay, setIsReplay] = useState(false)

  // User XP and level
  const [userXP, setUserXP] = useState(0)
  const [userLevel, setUserLevel] = useState(1)

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Load level progress and user XP on mount
  useEffect(() => {
    loadLevelProgress()
    loadUserProgress()
  }, [])

  const loadUserProgress = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return

      const response = await fetch(`${API_URL}/api/arcade/codequest/progress`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to load user progress')

      const data = await response.json()
      setUserXP(data.total_xp || 0)
      setUserLevel(data.level || 1)
    } catch (error) {
      console.error('Error loading user progress:', error)
    }
  }

  const loadLevelProgress = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return

      const response = await fetch(`${API_URL}/api/arcade/codequest/progress/levels`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to load progress')

      const data = await response.json()
      setLevelProgress(data.levels || [])
    } catch (error) {
      console.error('Error loading progress:', error)
    }
  }

  // Start level selection
  const openLevelSelect = () => {
    setGameMode('levelSelect')
    setCurrentTier(1)
  }

  // Start a level
  const startLevel = async (tier: number, level: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        alert('Please sign in to play Code Quest!')
        return
      }

      // Check if level is already completed (replay mode)
      const progress = levelProgress.find(p => p.tier === tier && p.level === level)
      setIsReplay(progress?.completed || false)

      // Start session on backend
      const response = await fetch(`${API_URL}/api/arcade/codequest/session/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tier,
          level,
          mode: 'quest'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.detail || 'Failed to start level')
        return
      }

      const data = await response.json()
      setSessionId(data.session_id)

      // Reset game state
      setCurrentTier(tier)
      setCurrentLevel(level)
      setLives(5)
      setScore(0)
      setTotalXP(0)
      setCombo(0)
      setBestCombo(0)
      setQuestionNumber(0)
      setQuestionAttempts({})
      setAnsweredQuestionIds([])
      setGameMode('playing')

      // Load first question
      loadQuestion(tier, level)
    } catch (error) {
      console.error('Error starting level:', error)
      alert('Failed to start level. Please try again.')
    }
  }

  // Load question from API
  const loadQuestion = async (tier: number, level: number) => {
    try {
      // Check if we've already answered 20 questions
      if (answeredQuestionIds.length >= 20) {
        // Level complete!
        completeLevel()
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      // Build exclude list
      const excludeIds = answeredQuestionIds.join(',')

      const response = await fetch(
        `${API_URL}/api/arcade/codequest/question/by-level?tier=${tier}&level=${level}&exclude_ids=${excludeIds}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (!response.ok) {
        const error = await response.json()
        if (error.detail?.includes('No more questions')) {
          // Level complete!
          completeLevel()
          return
        }
        throw new Error('Failed to load question')
      }

      const data = await response.json()

      // Options are already shuffled by the backend
      setQuestion(data)
      setSelectedAnswer(null)
      setAnswerStartTime(Date.now())
      setQuestionNumber(prev => prev + 1)
    } catch (error) {
      console.error('Error loading question:', error)
      alert('Failed to load question')
    }
  }

  // Submit answer
  const submitAnswer = async (answer: string) => {
    if (!question || !sessionId) return

    setSelectedAnswer(answer)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const timeTaken = (Date.now() - answerStartTime) / 1000
      const attempts = questionAttempts[question.id] || 0

      const response = await fetch(`${API_URL}/api/arcade/codequest/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question_id: question.id,
          user_answer: answer,
          time_taken: timeTaken,
          session_id: sessionId,
          attempt_number: attempts + 1,
          tier: currentTier,
          level: currentLevel
        })
      })

      if (!response.ok) throw new Error('Failed to submit answer')

      const result = await response.json()

      // Calculate combo multiplier XP
      let comboMultiplier = 1.0
      if (combo >= 10) comboMultiplier = 5.0
      else if (combo >= 5) comboMultiplier = 3.0
      else if (combo >= 3) comboMultiplier = 2.0

      const finalXP = Math.floor(result.xp_earned * comboMultiplier)

      setIsCorrect(result.correct)
      setFeedback(result.explanation)
      setCorrectAnswer(result.correct_answer)
      setSpeedBonus(result.speed_multiplier)
      setXpEarned(finalXP)

      if (result.correct) {
        // Correct answer!
        setScore(prev => prev + 1)
        setTotalXP(prev => prev + finalXP)
        setCombo(prev => {
          const newCombo = prev + 1
          setBestCombo(current => Math.max(current, newCombo))
          return newCombo
        })

        // Mark question as answered
        setAnsweredQuestionIds(prev => [...prev, question.id])

        setGameMode('feedback')

        // Auto-continue after 2 seconds
        setTimeout(() => {
          nextQuestion()
        }, 2000)
      } else {
        // Wrong answer
        const currentAttempts = attempts + 1
        setQuestionAttempts(prev => ({...prev, [question.id]: currentAttempts}))

        if (currentAttempts === 1) {
          // First wrong - can retry
          setCombo(0)
          const newLives = lives - 1
          setLives(newLives)

          if (newLives <= 0) {
            // Game over
            setGameMode('feedback')
            setTimeout(() => {
              endGame()
            }, 3000)
          } else {
            // Show feedback briefly, then allow retry
            setGameMode('feedback')
            setTimeout(() => {
              setGameMode('playing')
            }, 2000)
          }
        } else {
          // Second wrong - show answer and move on
          setCombo(0)
          const newLives = lives - 1
          setLives(newLives)

          // Mark as answered (can't retry again)
          setAnsweredQuestionIds(prev => [...prev, question.id])

          setGameMode('feedback')

          if (newLives <= 0) {
            setTimeout(() => {
              endGame()
            }, 3000)
          } else {
            setTimeout(() => {
              nextQuestion()
            }, 3000)
          }
        }
      }

    } catch (error) {
      console.error('Error submitting answer:', error)
    }
  }

  // Next question
  const nextQuestion = () => {
    if (lives > 0) {
      // Clear old question first to prevent flash
      setQuestion(null)
      setGameMode('playing')
      loadQuestion(currentTier, currentLevel)
    }
  }

  // Complete level
  const completeLevel = async () => {
    if (!sessionId) return

    // Clear question to prevent flash
    setQuestion(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const response = await fetch(`${API_URL}/api/arcade/codequest/level/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          session_id: sessionId,
          tier: currentTier,
          level: currentLevel,
          questions_answered: questionNumber,
          questions_correct: score,
          best_combo: bestCombo
        })
      })

      if (!response.ok) throw new Error('Failed to complete level')

      const result = await response.json()

      // Reload progress and user XP
      await loadLevelProgress()
      await loadUserProgress()

      // Show completion screen
      setGameMode('gameOver')
    } catch (error) {
      console.error('Error completing level:', error)
      setGameMode('gameOver')
    }
  }

  // End game (ran out of lives)
  const endGame = () => {
    // Clear question to prevent flash
    setQuestion(null)
    setGameMode('gameOver')
  }

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameMode !== 'playing' || !question) return

      const key = e.key.toUpperCase()
      if (['A', 'B', 'C', 'D', '1', '2', '3', '4'].includes(key)) {
        const answer = key === '1' ? 'A' : key === '2' ? 'B' : key === '3' ? 'C' : key === '4' ? 'D' : key
        submitAnswer(answer)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameMode, question, combo, lives, answerStartTime, sessionId, questionAttempts])

  // Get combo display
  const getComboDisplay = () => {
    if (combo >= 10) return '🔥 UNSTOPPABLE 5x'
    if (combo >= 5) return '🔥 ON FIRE 3x'
    if (combo >= 3) return '🔥 HOT STREAK 2x'
    return null
  }

  // Check if level is unlocked
  const isLevelUnlocked = (tier: number, level: number) => {
    const progress = levelProgress.find(p => p.tier === tier && p.level === level)
    return progress?.unlocked || (tier === 1 && level === 1)
  }

  // Get level status icon
  const getLevelIcon = (tier: number, level: number) => {
    const progress = levelProgress.find(p => p.tier === tier && p.level === level)
    if (!progress?.unlocked && !(tier === 1 && level === 1)) return '🔒'
    if (progress?.completed) return '✓'
    return '🔓'
  }

  // Get level accuracy
  const getLevelAccuracy = (tier: number, level: number) => {
    const progress = levelProgress.find(p => p.tier === tier && p.level === level)
    if (!progress || !progress.completed) return '--'
    return `${Math.round(progress.accuracy)}%`
  }

  // === RENDER MENU ===
  if (gameMode === 'menu') {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full p-6">
        <div className="text-center space-y-6 max-w-3xl w-full">
          <h1 className="text-5xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500">
            ⚡ PYTHON CODE QUEST
          </h1>

          {/* XP Progress Bar */}
          <div className="flex justify-center my-6">
            <XPProgressBar
              currentXP={userXP}
              currentLevel={userLevel}
              onLevelUp={(newLevel) => {
                console.log('Level up!', newLevel)
                loadUserProgress()
              }}
            />
          </div>

          <p className="text-cyan-400 font-mono text-lg">
            Master Python through progressive challenges!
          </p>
          <div className="space-y-2 text-sm font-mono text-gray-400">
            <p>✓ 5 lives per level - lose one for each wrong answer</p>
            <p>✓ 2 attempts per question before moving on</p>
            <p>✓ 20 questions per level</p>
            <p>✓ 80% accuracy unlocks next level</p>
            <p>✓ Combo streaks multiply your XP (up to 5x!)</p>
          </div>
          <button
            onClick={openLevelSelect}
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-bold font-mono text-xl hover:from-purple-500 hover:to-pink-500 transition-all duration-300 shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:shadow-[0_0_40px_rgba(168,85,247,0.8)] relative overflow-hidden"
          >
            <span className="relative z-10">▶ START QUEST</span>
          </button>
        </div>
      </div>
    )
  }

  // === RENDER LEVEL SELECT ===
  if (gameMode === 'levelSelect') {
    return (
      <div className="h-full w-full flex flex-col items-center justify-start overflow-y-auto p-6">
        <div className="max-w-4xl w-full space-y-6">
          <div className="text-center">
            <h2 className="text-4xl font-mono font-bold text-cyan-400 mb-2">
              TIER {currentTier}: BEGINNER PYTHON
            </h2>
            <p className="text-gray-400 font-mono mb-4">Select a level to begin</p>

            {/* XP Progress Bar */}
            <div className="flex justify-center mb-4">
              <XPProgressBar
                currentXP={userXP}
                currentLevel={userLevel}
                onLevelUp={(newLevel) => {
                  console.log('Level up!', newLevel)
                  loadUserProgress()
                }}
              />
            </div>
          </div>

          {/* Level Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5].map(level => {
              const unlocked = isLevelUnlocked(currentTier, level)
              const icon = getLevelIcon(currentTier, level)
              const accuracy = getLevelAccuracy(currentTier, level)

              return (
                <button
                  key={level}
                  onClick={() => unlocked ? startLevel(currentTier, level) : null}
                  disabled={!unlocked}
                  className={`p-6 border-4 rounded-lg font-mono text-center transition-all duration-300 ${
                    unlocked
                      ? 'border-cyan-500 bg-cyan-900/20 hover:bg-cyan-800/40 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] cursor-pointer'
                      : 'border-gray-700 bg-gray-900/20 cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className="text-4xl mb-2">{icon}</div>
                  <div className="text-2xl font-bold text-white mb-1">LEVEL {level}</div>
                  <div className={`text-lg ${accuracy === '--' ? 'text-gray-500' : 'text-green-400'}`}>
                    {accuracy}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Back Button */}
          <div className="text-center">
            <button
              onClick={() => setGameMode('menu')}
              className="px-6 py-3 bg-gray-800 border-2 border-gray-600 text-gray-300 font-mono hover:bg-gray-700 transition-colors"
            >
              ← BACK TO MENU
            </button>
          </div>
        </div>
      </div>
    )
  }

  // === RENDER PLAYING ===
  if (gameMode === 'playing' && question) {
    const comboText = getComboDisplay()
    const currentAttempts = questionAttempts[question.id] || 0

    return (
      <div className="h-full w-full flex justify-center items-start overflow-y-auto">
        <div className="flex flex-col p-6 max-w-4xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="font-mono text-cyan-400">
              TIER {currentTier} - LEVEL {currentLevel}
            </div>
            <div className="font-mono text-gray-400">
              Question {questionNumber}/20
            </div>
            <div className="flex gap-2">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={`text-2xl ${i < lives ? '' : 'opacity-20'}`}>
                  ❤️
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isReplay && (
              <div className="px-3 py-1 bg-yellow-900/40 border border-yellow-500/50 text-yellow-400 text-sm font-mono">
                REPLAY (50% XP)
              </div>
            )}
            {comboText && (
              <div className="px-4 py-2 bg-gradient-to-r from-red-500 to-yellow-500 text-white font-bold font-mono animate-pulse">
                {comboText}
              </div>
            )}
          </div>
        </div>

        {/* Question */}
        <div className="flex-1 flex flex-col">
          <div className="bg-black/50 border-2 border-cyan-500/50 rounded-lg p-6 mb-6">
            {question.code && (
              <pre className="bg-black p-4 rounded mb-4 text-green-400 font-mono text-sm overflow-x-auto">
                {question.code}
              </pre>
            )}
            <p className="text-xl font-mono text-white mb-2">{question.question}</p>
            {currentAttempts > 0 && (
              <p className="text-sm font-mono text-red-400 mt-2">
                ⚠️ Second attempt - choose carefully!
              </p>
            )}
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(question.options).map(([key, value]) => (
              <button
                key={key}
                onClick={() => submitAnswer(key)}
                className="p-4 bg-gray-900 border-2 border-cyan-500/30 rounded-lg hover:border-cyan-500 hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all duration-200 text-left"
              >
                <div className="flex items-start gap-3">
                  <span className="text-cyan-400 font-bold font-mono text-xl">[{key}]</span>
                  <span className="text-gray-300 font-mono flex-1">{value}</span>
                </div>
              </button>
            ))}
          </div>

          {question.hint && (
            <div className="mt-4 text-sm font-mono text-gray-500">
              💡 Hint: {question.hint}
            </div>
          )}
        </div>

        {/* Score */}
        <div className="mt-6 flex items-center justify-between text-sm font-mono">
          <div className="text-green-400">Score: {score} correct</div>
          <div className="text-purple-400">Total XP: {totalXP}</div>
          <div className="text-yellow-400">Best Combo: {bestCombo}x</div>
        </div>
        </div>
      </div>
    )
  }

  // === RENDER FEEDBACK ===
  if (gameMode === 'feedback') {
    const currentAttempts = question ? questionAttempts[question.id] || 0 : 0
    const canRetry = !isCorrect && currentAttempts === 1 && lives > 0

    return (
      <div className="h-full w-full flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-2xl w-full">
          {isCorrect ? (
            <>
              <div className="text-8xl">✓</div>
              <div className="text-5xl font-mono font-bold text-green-400 drop-shadow-[0_0_20px_rgba(0,255,0,0.8)] animate-pulse">
                CORRECT!
              </div>
              <div className="text-3xl font-mono text-cyan-400">
                +{xpEarned} XP
              </div>
              {speedBonus > 1 && (
                <div className="text-xl font-mono text-yellow-400">
                  Speed Bonus: {Math.round((speedBonus - 1) * 100)}%
                </div>
              )}
              {isReplay && (
                <div className="text-sm font-mono text-yellow-400">
                  (Replay mode: 50% XP penalty applied)
                </div>
              )}
            </>
          ) : (
            <>
              <div className="text-8xl text-red-500">✗</div>
              <div className="text-5xl font-mono font-bold text-red-500 drop-shadow-[0_0_20px_rgba(255,0,0,0.8)]">
                INCORRECT
              </div>
              {combo > 0 && (
                <div className="text-2xl font-mono text-red-400">
                  COMBO BROKEN!
                </div>
              )}
              <div className="text-xl font-mono text-cyan-400">
                Correct Answer: {correctAnswer}
              </div>
              {canRetry && (
                <div className="text-lg font-mono text-yellow-400">
                  One more try! Choose carefully...
                </div>
              )}
            </>
          )}

          <div className="bg-black/50 border-2 border-gray-700 rounded-lg p-6">
            <p className="text-gray-300 font-mono text-sm leading-relaxed">{feedback}</p>
          </div>

          {lives <= 0 && (
            <div className="text-2xl font-mono text-red-400">
              OUT OF LIVES - LEVEL FAILED
            </div>
          )}
        </div>
      </div>
    )
  }

  // === RENDER GAME OVER ===
  if (gameMode === 'gameOver') {
    // Use answeredQuestionIds length for accurate count
    const questionsAnswered = answeredQuestionIds.length
    const accuracy = questionsAnswered > 0 ? Math.round((score / questionsAnswered) * 100) : 0
    const passed = accuracy >= 80

    return (
      <div className="h-full w-full flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-2xl">
          <h1 className={`text-5xl font-mono font-bold ${passed ? 'text-green-400' : 'text-red-400'} drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]`}>
            {passed ? 'LEVEL COMPLETE!' : 'LEVEL FAILED'}
          </h1>
          <div className="space-y-4 text-2xl font-mono">
            <div className="text-cyan-400">TIER {currentTier} - LEVEL {currentLevel}</div>
            <div className="text-purple-400">Total XP Earned: {totalXP}</div>
            <div className="text-yellow-400">Best Combo: {bestCombo}x</div>
            <div className={`${accuracy >= 80 ? 'text-green-400' : 'text-red-400'} text-3xl font-bold`}>
              Accuracy: {accuracy}%
            </div>
          </div>
          {passed && (
            <div className="text-lg font-mono text-green-400">
              ⭐ Next level unlocked! ⭐
            </div>
          )}
          {!passed && (
            <div className="text-sm font-mono text-gray-400">
              You need 80% accuracy to unlock the next level. Try again!
            </div>
          )}
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => startLevel(currentTier, currentLevel)}
              className="px-6 py-3 bg-cyan-500 text-black font-bold font-mono hover:bg-cyan-400 transition-colors"
            >
              🔄 RETRY LEVEL
            </button>
            <button
              onClick={() => {
                loadLevelProgress()
                setGameMode('levelSelect')
              }}
              className="px-6 py-3 bg-purple-500 text-black font-bold font-mono hover:bg-purple-400 transition-colors"
            >
              📋 LEVEL SELECT
            </button>
            <button
              onClick={() => {
                loadLevelProgress()
                loadUserProgress()
                setGameMode('menu')
              }}
              className="px-6 py-3 bg-gray-700 text-white font-bold font-mono hover:bg-gray-600 transition-colors"
            >
              🏠 BACK TO MENU
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
