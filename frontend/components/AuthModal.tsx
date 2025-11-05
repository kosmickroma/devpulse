'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleGitHubSignIn = async () => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) {
        setError(error.message)
      } else {
        setError('Check your email to confirm your account!')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        setError(error.message)
      } else {
        onClose()
      }
    }
    setLoading(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-dark-bg/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md neon-border rounded-lg bg-dark-card p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-neon-magenta transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-neon-cyan neon-text-cyan font-mono mb-2">
            {mode === 'signin' ? 'SIGN IN' : 'SIGN UP'}
          </h2>
          <p className="text-gray-400 text-sm font-mono">
            &gt; {mode === 'signin' ? 'Welcome back to DevPulse' : 'Join the DevPulse community'}
          </p>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3 mb-6">
          <button
            onClick={handleGitHubSignIn}
            disabled={loading}
            className="
              w-full py-3 px-4
              border-2 border-neon-cyan rounded
              text-neon-cyan font-mono text-sm font-bold
              hover:bg-neon-cyan/10
              transition-all
              flex items-center justify-center gap-3
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            CONTINUE WITH GITHUB
          </button>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="
              w-full py-3 px-4
              border-2 border-neon-magenta rounded
              text-neon-magenta font-mono text-sm font-bold
              hover:bg-neon-magenta/10
              transition-all
              flex items-center justify-center gap-3
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            CONTINUE WITH GOOGLE
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 border-t border-neon-cyan/30" />
          <span className="text-gray-400 text-xs font-mono">OR</span>
          <div className="flex-1 border-t border-neon-cyan/30" />
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label className="block text-neon-green font-mono text-xs mb-2">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="
                w-full px-4 py-3
                bg-dark-hover border-2 border-neon-green/30 rounded
                text-gray-200 font-mono text-sm
                focus:border-neon-green focus:outline-none
                transition-colors
              "
            />
          </div>

          <div>
            <label className="block text-neon-green font-mono text-xs mb-2">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="
                w-full px-4 py-3
                bg-dark-hover border-2 border-neon-green/30 rounded
                text-gray-200 font-mono text-sm
                focus:border-neon-green focus:outline-none
                transition-colors
              "
            />
          </div>

          {error && (
            <div className={`p-3 rounded border-2 ${error.includes('Check your email') ? 'border-neon-green bg-neon-green/10 text-neon-green' : 'border-neon-magenta bg-neon-magenta/10 text-neon-magenta'}`}>
              <p className="text-xs font-mono">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="
              w-full py-3 px-4
              border-2 border-neon-green rounded
              text-neon-green font-mono text-sm font-bold
              hover:bg-neon-green/10
              transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {loading ? 'PROCESSING...' : mode === 'signin' ? 'SIGN IN' : 'SIGN UP'}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin')
              setError(null)
            }}
            className="text-gray-400 hover:text-neon-cyan text-sm font-mono transition-colors"
          >
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <span className="text-neon-cyan font-bold">
              {mode === 'signin' ? 'SIGN UP' : 'SIGN IN'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
