'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isStaleAuthSessionError } from '@/lib/auth/session'


export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [authResolved, setAuthResolved] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const updateScrolled = () => setScrolled(window.scrollY > 12)
    updateScrolled()
    window.addEventListener('scroll', updateScrolled, { passive: true })

    return () => window.removeEventListener('scroll', updateScrolled)
  }, [])

  useEffect(() => {
    const supabase = createClient()

    const loadUser = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (error && isStaleAuthSessionError(error)) {
        await supabase.auth.signOut()
        setIsAuthenticated(false)
        setAuthResolved(true)
        return
      }
      setIsAuthenticated(Boolean(data.user))
      setAuthResolved(true)
    }

    void loadUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session?.user))
      setAuthResolved(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  const solidNav = scrolled || mobileOpen
  const showAuthLinks = authResolved ? !isAuthenticated : false

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 text-white transition-all duration-300 ${
        solidNav
          ? 'bg-brand-950 shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl hover:text-brand-200 transition-colors">
            <Building2 className="w-7 h-7" />
            <span>សន្សំ</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {showAuthLinks && (
              <>
                <Link
                  href="/register"
                  className={`text-sm font-medium transition-colors py-2 ${
                    pathname === '/register'
                      ? 'text-brand-200 border-b-2 border-brand-200'
                      : solidNav ? 'hover:text-brand-200' : 'text-white hover:text-brand-100'
                  }`}
                >
                  ចូលជាសមាជិក
                </Link>
                <Link
                  href="/login"
                  className={`text-sm font-medium transition-colors py-2 ${
                    pathname === '/login'
                      ? 'text-brand-200 border-b-2 border-brand-200'
                      : solidNav ? 'hover:text-brand-200' : 'text-white hover:text-brand-100'
                  }`}
                >
                  ចូលគណនី
                </Link>
              </>
            )}
            <Link
              href="/dashboard"
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                solidNav
                  ? 'bg-white text-brand-900 hover:bg-brand-50'
                  : 'bg-white/15 text-white ring-1 ring-white/30 hover:bg-white/25 backdrop-blur'
              }`}
            >
              គណនីរបស់ខ្ញុំ
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className={`rounded-md p-2 transition-colors md:hidden ${
              solidNav ? 'bg-brand-800/40 hover:bg-brand-800' : 'bg-white/10 hover:bg-white/20'
            }`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="បើក/បិទម៉ឺនុយ"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-brand-700 bg-brand-800">
          <div className="px-4 py-3 space-y-1">
            {showAuthLinks && (
              <>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-md px-2 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
                >
                  ចូលជាសមាជិក
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-md px-2 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
                >
                  ចូលគណនី
                </Link>
              </>
            )}
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="mt-2 block rounded-lg bg-white px-4 py-2 text-center text-sm font-semibold text-brand-900 transition-colors hover:bg-brand-50"
            >
              គណនីរបស់ខ្ញុំ
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
