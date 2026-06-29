import React from 'react'

interface PageHeaderProps {
  title: string
  subtitle: string
  children?: React.ReactNode
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
      </div>
      {children && <div className="flex gap-3">{children}</div>}
    </div>
  )
}
