'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown, Building2 } from 'lucide-react'

const navLinks = [
  {
    label: 'About SanSam',
    href: '/about',
    children: [
      { label: 'Vision & Mission', href: '/about#vision' },
      { label: 'Saving Benefits', href: '/about#saving-benefits' },
      { label: 'Loan Rates', href: '/about#loan-rates' },
    ],
  },
  { label: 'Membership', href: '/register' },
  { label: 'Login', href: '/login' },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const pathname = usePathname()

  return (
    <nav className="bg-blue-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl hover:text-blue-200 transition-colors">
            <Building2 className="w-7 h-7" />
            <span>SanSam</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) =>
              link.children ? (
                <div key={link.label} className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-1 hover:text-blue-200 transition-colors py-2 text-sm font-medium"
                  >
                    {link.label}
                    <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-lg shadow-xl py-1 z-50">
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setDropdownOpen(false)}
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-900 transition-colors"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors py-2 ${
                    pathname === link.href ? 'text-blue-200 border-b-2 border-blue-200' : 'hover:text-blue-200'
                  }`}
                >
                  {link.label}
                </Link>
              )
            )}
            <Link
              href="/dashboard"
              className="bg-white text-blue-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors"
            >
              My Account
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-blue-800 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-blue-800 border-t border-blue-700">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) =>
              link.children ? (
                <div key={link.label}>
                  <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider px-2 py-1">{link.label}</p>
                  {link.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-2 text-sm text-white hover:bg-blue-700 rounded-md transition-colors"
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
                  className="block px-2 py-2 text-sm font-medium text-white hover:bg-blue-700 rounded-md transition-colors"
                >
                  {link.label}
                </Link>
              )
            )}
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="block mt-2 bg-white text-blue-900 px-4 py-2 rounded-lg text-sm font-semibold text-center hover:bg-blue-50 transition-colors"
            >
              My Account
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
