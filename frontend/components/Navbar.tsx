'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AuthModal from './AuthModal'

export default function Navbar() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setShowUserMenu(false)
  }

  return (
    <>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <nav className="sticky top-0 z-50 border-b-2 border-neon-cyan/30 bg-dark-bg/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3 max-w-7xl">
          <div className="flex items-center justify-between">
            {/* Logo Icon + Text */}
            <div className="flex items-center gap-3">
              <img
                src="/devpulse_icon.svg"
                alt="DevPulse Icon"
                className="w-10 h-10"
                style={{
                  filter: 'drop-shadow(0 0 10px rgba(255, 0, 255, 0.6))',
                }}
              />
              <span className="font-mono font-bold text-lg">
                <span className="text-neon-magenta">Dev</span>
                <span className="text-neon-cyan">Pulse</span>
              </span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-6 font-mono text-sm">
              <a
                href="/"
                className="text-neon-cyan hover:text-white transition-colors"
              >
                TRENDS
              </a>
              <a
                href="/jobs"
                className="text-neon-magenta hover:text-white transition-colors"
              >
                JOBS
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-neon-green transition-colors"
              >
                API
              </a>

              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-neon-cyan text-neon-cyan rounded hover:bg-neon-cyan/10 transition-all"
                  >
                    <div className="w-6 h-6 rounded-full bg-neon-cyan/20 border border-neon-cyan flex items-center justify-center">
                      <span className="text-xs font-bold">
                        {user.email?.[0].toUpperCase()}
                      </span>
                    </div>
                    <span>{user.email?.split('@')[0]}</span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 neon-border rounded-lg bg-dark-card p-2">
                      <a
                        href="/settings"
                        className="block w-full text-left px-4 py-2 text-neon-cyan hover:bg-neon-cyan/10 rounded transition-colors"
                      >
                        ⚙️ SETTINGS
                      </a>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-neon-magenta hover:bg-neon-magenta/10 rounded transition-colors"
                      >
                        SIGN OUT
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 border-2 border-neon-cyan text-neon-cyan rounded hover:bg-neon-cyan/10 transition-all"
                >
                  SIGN IN
                </button>
              )}
            </div>

            {/* Mobile Menu Icon */}
            <button className="md:hidden text-neon-cyan">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </nav>
    </>
  )
}
