'use client'

import React from 'react'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/ui/Loading'

const baseClasses =
  'inline-flex cursor-pointer items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed'

const variantClasses = {
  primary: 'bg-brand-950 text-white hover:bg-brand-900 focus:ring-brand-500 active:bg-brand-950',
  secondary: 'bg-brand-100 text-brand-900 hover:bg-brand-200 focus:ring-brand-500',
  outline: 'bg-surface border-2 border-brand-950 text-brand-900 hover:bg-brand-50 focus:ring-brand-500',
  ghost: 'bg-surface-muted text-brand-900 hover:bg-brand-50 focus:ring-brand-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
}

const sizeClasses = {
  sm: 'text-sm px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2.5 gap-2',
  lg: 'text-base px-6 py-3 gap-2',
}

interface ButtonBaseProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  className?: string
}

interface ButtonAsButton extends ButtonBaseProps, Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> {
  href?: never
  loading?: boolean
}

interface ButtonAsLink extends ButtonBaseProps {
  href: string
  loading?: never
  disabled?: never
}

type ButtonProps = ButtonAsButton | ButtonAsLink

export function Button(props: ButtonProps) {
  const { variant = 'primary', size = 'md', children, className = '' } = props
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`

  if (props.href) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    )
  }

  const { loading = false, disabled, ...rest } = props as ButtonAsButton
  delete (rest as Record<string, unknown>).href
  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <LoadingSpinner size="sm" color="current" /> : null}
      {children}
    </button>
  )
}
