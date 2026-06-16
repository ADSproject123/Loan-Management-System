'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'

export type SelectOption = { value: string; label: string; hint?: string }

type SelectProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  className?: string
  triggerClassName?: string
  menuClassName?: string
  'aria-label'?: string
}

type MenuPosition = {
  top: number
  left: number
  width: number
}

const defaultTriggerClassName =
  'flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground shadow-xs outline-none ring-0 transition hover:bg-surface-muted focus:border-border focus:shadow-xs focus:outline-none focus:ring-0 focus-visible:border-border focus-visible:shadow-xs focus-visible:outline-none focus-visible:ring-0'

export function Select({
  id,
  value,
  onChange,
  options,
  className = '',
  triggerClassName = defaultTriggerClassName,
  menuClassName = '',
  'aria-label': ariaLabel,
}: SelectProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null)
  const selected = options.find((opt) => opt.value === value) ?? options[0]

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  useEffect(() => {
    if (!open) {
      setMenuPosition(null)
      return
    }

    function updatePosition() {
      const trigger = triggerRef.current
      if (!trigger) return

      const rect = trigger.getBoundingClientRect()
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  return (
    <div className={className}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel ?? selected?.label}
        className={triggerClassName}
      >
        <span className="flex min-w-0 items-center gap-1 truncate">
          <span className="truncate">{selected?.label}</span>
          {selected?.hint && <span className="shrink-0 text-muted">({selected.hint})</span>}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open &&
        menuPosition &&
        createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 cursor-default"
              aria-label="បិទ"
              onClick={() => setOpen(false)}
            />
            <ul
              role="listbox"
              aria-labelledby={id}
              style={{
                top: menuPosition.top,
                left: menuPosition.left,
                width: menuPosition.width,
              }}
              className={`fixed z-50 max-h-60 overflow-y-auto rounded-xl border border-border bg-surface py-1 shadow-lg ${menuClassName}`}
            >
              {options.map((option) => {
                const isSelected = option.value === value
                return (
                  <li key={option.value || 'all'} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(option.value)
                        setOpen(false)
                      }}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition ${
                        isSelected
                          ? 'bg-brand-50 font-medium text-brand-900'
                          : 'text-foreground hover:bg-surface-muted'
                      }`}
                    >
                      <span className="truncate">{option.label}</span>
                      {option.hint ? (
                        <span className={isSelected ? 'text-brand-400' : 'text-muted'}>{option.hint}</span>
                      ) : (
                        isSelected && <Check className="h-4 w-4 shrink-0 text-brand-600" />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </>,
          document.body
        )}
    </div>
  )
}
