'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Question {
  id: string
  type: string
  difficulty: number
  tier: number
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

interface GameProps {
  onGameOver?: (score: number, xp: number) => void
}

export default function CodeQuest({ onGameOver }: GameProps) {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'feedback' | 'gameOver'>('idle')
  const [question, setQuestion] = useState<Question | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [lives, setLives] = useState(3)
  const [score, setScore] = useState(0)
  const [totalXP, setTotalXP] = useState(0)
  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)
  const [questionNumber, setQuestionNumber] = useState(0)
  const [timeLeft, setTimeLeft] = useState(15)
  const [isCorrect, setIsCorrect] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [answerStartTime, setAnswerStartTime] = useState<number>(0)
  const [speedBonus, setSpeedBonus] = useState(1.0)
  const [xpEarned, setXpEarned] = useState(0)

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Start game
  const startGame = async () => {
    try {
      // Get session token
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        alert('Please sign in to play Code Quest!')
        return
      }

      // Start session on backend
      const response = await fetch(`${API_URL}/api/arcade/codequest/session/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to start session')

      const data = await response.json()
      setSessionId(data.session_id)

      // Reset game state
      setLives(3)
      setScore(0)
      setTotalXP(0)
      setCombo(0)
      setBestCombo(0)
      setQuestionNumber(0)
      setGameState('playing')

      // Load first question
      loadQuestion()
    } catch (error) {
      console.error('Error starting game:', error)
      alert('Failed to start game. Please try again.')
    }
  }

  // Load question from API
  const loadQuestion = async () => {
    // Prevent loading if not in playing state
    if (gameState !== 'playing' && gameState !== 'idle') {
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      // Use session_id to get unique questions
      const url = sessionId
        ? `${API_URL}/api/arcade/codequest/question/random?session_id=${sessionId}`
        : `${API_URL}/api/arcade/codequest/question/random`

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to load question')

      const data = await response.json()

      setQuestion(data)
      setSelectedAnswer(null)
      setAnswerStartTime(Date.now())
      setQuestionNumber(prev => prev + 1)

      // Timer disabled for now - can add time attack mode later
      // const adjustedTimeLimit = data.difficulty <= 2 ? data.time_limit + 10 : data.time_limit
      // setTimeLeft(adjustedTimeLimit)
      // startTimer(adjustedTimeLimit)
    } catch (error) {
      console.error('Error loading question:', error)
    }
  }

  // Start countdown timer
  const startTimer = (time: number) => {
    setTimeLeft(time)

    if (timerRef.current) clearInterval(timerRef.current)

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up!
          handleTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // Stop timer
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  // Handle timeout
  const handleTimeout = () => {
    stopTimer()
    // Treat as wrong answer
    submitAnswer('X') // Invalid answer to trigger wrong logic
  }

  // Submit answer
  const submitAnswer = async (answer: string) => {
    if (!question || !sessionId) return

    stopTimer()
    setSelectedAnswer(answer)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const timeTaken = (Date.now() - answerStartTime) / 1000

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
          session_id: sessionId
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
      } else {
        // Wrong answer
        setCombo(0)
        const newLives = lives - 1
        setLives(newLives)

        if (newLives <= 0) {
          // Game over - delay to show feedback first
          setTimeout(() => {
            endGame()
          }, 3000)
        }
      }

      setGameState('feedback')

      // Auto-continue after 3 seconds (only if game not over)
      setTimeout(() => {
        const newLives = result.correct ? lives : lives - 1
        if (newLives > 0) {
          nextQuestion()
        }
      }, 3000)

    } catch (error) {
      console.error('Error submitting answer:', error)
    }
  }

  // Next question
  const nextQuestion = () => {
    if (lives > 0 && gameState === 'feedback') {
      setGameState('playing')
      // Small delay to ensure state is updated before loading
      setTimeout(() => {
        loadQuestion()
      }, 100)
    }
  }

  // End game
  const endGame = async () => {
    stopTimer()
    setGameState('gameOver')

    if (sessionId) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        // Complete session on backend
        await fetch(`${API_URL}/api/arcade/codequest/session/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            session_id: sessionId,
            questions_answered: questionNumber,
            questions_correct: score,
            best_combo: bestCombo,
            avg_speed: 0 // Calculate if needed
          })
        })

        if (onGameOver) {
          onGameOver(score, totalXP)
        }
      } catch (error) {
        console.error('Error completing session:', error)
      }
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer()
    }
  }, [])

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState !== 'playing' || !question) return

      const key = e.key.toUpperCase()
      if (['A', 'B', 'C', 'D', '1', '2', '3', '4'].includes(key)) {
        const answer = key === '1' ? 'A' : key === '2' ? 'B' : key === '3' ? 'C' : key === '4' ? 'D' : key
        submitAnswer(answer)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameState, question, combo, lives, answerStartTime, sessionId])

  // Get combo display
  const getComboDisplay = () => {
    if (combo >= 10) return '🔥 UNSTOPPABLE 5x'
    if (combo >= 5) return '🔥 ON FIRE 3x'
    if (combo >= 3) return '🔥 HOT STREAK 2x'
    return null
  }

  // Render
  if (gameState === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full">
        <div className="text-center space-y-6">
          <h1 className="text-5xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500">
            ⚡ PYTHON CODE QUEST
          </h1>
          <p className="text-cyan-400 font-mono text-lg">
            Answer Python questions to earn XP and climb the leaderboard!
          </p>
          <div className="space-y-2 text-sm font-mono text-gray-400">
            <p>✓ 3 lives - lose one for each wrong answer</p>
            <p>✓ Combo streaks multiply your XP (up to 5x!)</p>
            <p>✓ Speed bonus for quick answers</p>
            <p>✓ Use keyboard: 1-4 or A-D to answer</p>
          </div>
          <button
            onClick={startGame}
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-bold font-mono text-xl hover:from-purple-500 hover:to-pink-500 transition-all duration-300 shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:shadow-[0_0_40px_rgba(168,85,247,0.8)] relative overflow-hidden"
          >
            <span className="relative z-10">▶ START QUEST</span>
            <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
          </button>
        </div>
      </div>
    )
  }

  if (gameState === 'playing' && question) {
    const comboText = getComboDisplay()

    return (
      <div className="h-full w-full flex justify-center items-start overflow-y-auto">
        <div className="flex flex-col p-6 max-w-4xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="font-mono text-cyan-400">
              Question {questionNumber}
            </div>
            <div className="flex gap-2">
              {[...Array(3)].map((_, i) => (
                <span key={i} className={`text-2xl ${i < lives ? '' : 'opacity-20'}`}>
                  ❤️
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
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

  if (gameState === 'feedback') {
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
            </>
          )}

          <div className="bg-black/50 border-2 border-gray-700 rounded-lg p-6">
            <p className="text-gray-300 font-mono text-sm leading-relaxed">{feedback}</p>
          </div>

          <button
            onClick={nextQuestion}
            className="px-6 py-3 bg-cyan-500 text-black font-bold font-mono hover:bg-cyan-400 transition-colors"
          >
            NEXT QUESTION →
          </button>
        </div>
      </div>
    )
  }

  if (gameState === 'gameOver') {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-6">
          <h1 className="text-5xl font-mono font-bold text-neon-magenta drop-shadow-[0_0_20px_rgba(255,0,255,0.8)]">
            QUEST COMPLETE
          </h1>
          <div className="space-y-4 text-2xl font-mono">
            <div className="text-green-400">Score: {score} / {questionNumber}</div>
            <div className="text-purple-400">Total XP Earned: {totalXP}</div>
            <div className="text-yellow-400">Best Combo: {bestCombo}x</div>
            <div className="text-cyan-400">Accuracy: {Math.round((score / questionNumber) * 100)}%</div>
          </div>
          <button
            onClick={startGame}
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-bold font-mono text-xl hover:from-purple-500 hover:to-pink-500 transition-all"
          >
            ▶ PLAY AGAIN
          </button>
        </div>
      </div>
    )
  }

  return null
}
