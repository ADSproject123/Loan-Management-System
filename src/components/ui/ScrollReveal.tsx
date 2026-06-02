'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

type Animation = 'fade-up' | 'fade-in' | 'fade-left' | 'fade-right' | 'scale'

type ScrollRevealProps = {
  children: ReactNode
  className?: string
  animation?: Animation
  /** Stagger delay in ms */
  delay?: number
  duration?: number
  threshold?: number
}

export function ScrollReveal({
  children,
  className = '',
  animation = 'fade-up',
  delay = 0,
  duration = 700,
  threshold = 0.12,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [motionEnabled, setMotionEnabled] = useState(false)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setVisible(true)
      return
    }

    setMotionEnabled(true)
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold, rootMargin: '0px 0px -6% 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  const hidden = motionEnabled && !visible

  return (
    <div
      ref={ref}
      className={[
        'scroll-reveal',
        `scroll-reveal-${animation}`,
        hidden ? '' : 'scroll-reveal-visible',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        {
          '--scroll-reveal-delay': `${delay}ms`,
          '--scroll-reveal-duration': `${duration}ms`,
        } as CSSProperties
      }
    >
      {children}
    </div>
  )
}
