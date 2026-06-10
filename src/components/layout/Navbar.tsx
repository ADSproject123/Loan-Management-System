'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown, Building2 } from 'lucide-react'

const navLinks = [
  {
    label: 'អំពីសន្សំ',
    href: '/about',
    children: [
      { label: 'ចក្ខុវិស័យ និង បេសកកម្ម', href: '/about#vision' },
      { label: 'អត្ថប្រយោជន៍នៃការសន្សំ', href: '/about#saving-benefits' },
      { label: 'កម្ជីសមាជិក', href: '/about#member-loans' },
      { label: 'ចូលជាសមាជិក', href: '/about#membership' },
    ],
  },
  { label: 'ចូលជាសមាជិក', href: '/register' },
  { label: 'ចូលគណនី', href: '/login' },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const updateScrolled = () => setScrolled(window.scrollY > 12)
    updateScrolled()
    window.addEventListener('scroll', updateScrolled, { passive: true })

    return () => window.removeEventListener('scroll', updateScrolled)
  }, [])

  const solidNav = scrolled || mobileOpen

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
            {navLinks.map((link) =>
              link.children ? (
                <div key={link.label} className="group relative">
                  <button
                    type="button"
                    className={`flex items-center gap-1 rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
                      solidNav
                        ? 'bg-brand-900/40 text-white hover:bg-brand-900/60 hover:text-brand-100'
                        : 'bg-white/10 text-white hover:bg-white/20 hover:text-brand-100'
                    }`}
                  >
                    {link.label}
                    <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
                  </button>
                  <div className="invisible opacity-0 translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150 absolute top-full left-0 pt-2 w-56 z-50">
                    <div className="bg-white rounded-lg shadow-xl py-1 ring-1 ring-black/5">
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-900 transition-colors"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors py-2 ${
                    pathname === link.href
                      ? 'text-brand-200 border-b-2 border-brand-200'
                      : solidNav ? 'hover:text-brand-200' : 'text-white hover:text-brand-100'
                  }`}
                >
                  {link.label}
                </Link>
              )
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
            {navLinks.map((link) =>
              link.children ? (
                <div key={link.label}>
                  <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-brand-300">{link.label}</p>
                  {link.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-md px-4 py-2 text-sm text-white transition-colors hover:bg-brand-700"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-md px-2 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
                >
                  {link.label}
                </Link>
              )
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
