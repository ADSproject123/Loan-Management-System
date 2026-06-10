'use client'

import { useEffect, useState } from 'react'
import { Eye, PiggyBank, CreditCard, Users } from 'lucide-react'

const sections = [
  { id: 'vision', label: 'ចក្ខុវិស័យ និង បេសកកម្ម', icon: Eye },
  { id: 'saving-benefits', label: 'អត្ថប្រយោជន៍សន្សំ', icon: PiggyBank },
  { id: 'member-loans', label: 'កម្ជីសមាជិក', icon: CreditCard },
  { id: 'membership', label: 'ចូលជាសមាជិក', icon: Users },
] as const

export function AboutSectionNav() {
  const [activeId, setActiveId] = useState<string>(sections[0].id)

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash && sections.some((s) => s.id === hash)) {
      requestAnimationFrame(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setActiveId(hash)
      })
    }
  }, [])

  useEffect(() => {
    const elements = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null)

    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return

    setActiveId(id)
    window.history.replaceState(null, '', `#${id}`)
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav
      aria-label="About page sections"
      className="sticky top-16 z-30 border-b border-gray-200 bg-white/95 backdrop-blur-md"
    >
      <div className="flex w-full overflow-x-auto scrollbar-hide">
        {sections.map((section) => {
          const Icon = section.icon
          const active = activeId === section.id
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => scrollTo(section.id)}
              aria-current={active ? 'true' : undefined}
              className={`relative flex min-w-max flex-1 items-center justify-center gap-2 px-4 py-4 text-sm transition-colors sm:px-6 ${
                active
                  ? 'font-bold text-gray-950'
                  : 'font-normal text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="hidden h-4 w-4 sm:block" />
              {section.label}
              {active && (
                <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-gray-950 sm:inset-x-6" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
