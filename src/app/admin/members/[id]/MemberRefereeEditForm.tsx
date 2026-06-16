'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Search, User, X } from 'lucide-react'
import { adminFieldClassName } from '@/components/admin'
import { updateMemberReferee } from '@/app/actions/admin'
import { searchActiveMembers, type MemberSearchResult } from '@/app/actions/member'
import { showError, showSuccess } from '@/lib/toast'
import { useRegisterMemberEditForm } from './MemberEditModeContext'

type MemberRefereeEditFormProps = {
  memberId: string
  refereeId: string | null
  refereeDisplayName: string
  refereeVerified: boolean
  onSaved?: () => void
}

const inputClass = `${adminFieldClassName} px-3 py-2.5`

function memberSearchSubtitle(member: MemberSearchResult) {
  return [member.phone, member.email].filter(Boolean).join(' · ')
}

function RefereeSearch({
  memberId,
  selectedId,
  selectedName,
  onSelect,
  onClear,
  disabled,
}: {
  memberId: string
  selectedId: string
  selectedName: string
  onSelect: (member: MemberSearchResult) => void
  onClear: () => void
  disabled?: boolean
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MemberSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setShowResults(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const members = await searchActiveMembers(query)
        setResults(members.filter((member) => member.id !== memberId))
        setShowResults(true)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, memberId])

  if (selectedId) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface text-emerald-700 ring-1 ring-emerald-100">
          <Check className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{selectedName}</p>
          <p className="text-xs text-muted">សមាជិកដែលបានជ្រើស</p>
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-red-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={() => setTimeout(() => setShowResults(false), 150)}
        className={`${inputClass} pl-9`}
        placeholder="ស្វែងរកតាមឈ្មោះ ទូរស័ព្ទ ឬអ៊ីមែល..."
        disabled={disabled}
      />
      {isSearching && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
          កំពុងស្វែងរក...
        </span>
      )}
      {showResults && results.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-border bg-surface py-1 shadow-lg">
          {results.map((member) => (
            <li key={member.id}>
              <button
                type="button"
                onMouseDown={() => onSelect(member)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-surface-muted"
              >
                <User className="h-4 w-4 shrink-0 text-muted" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {member.full_name_kh ?? member.full_name_en}
                    {member.full_name_kh && member.full_name_en ? (
                      <span className="ml-1.5 text-xs text-muted">{member.full_name_en}</span>
                    ) : null}
                  </p>
                  {memberSearchSubtitle(member) && (
                    <p className="truncate text-xs text-muted">{memberSearchSubtitle(member)}</p>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
      {showResults && results.length === 0 && !isSearching && query.trim() && (
        <p className="absolute z-10 mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted shadow-lg">
          រកមិនឃើញសមាជិក
        </p>
      )}
    </div>
  )
}

export function MemberRefereeEditForm({
  memberId,
  refereeId,
  refereeDisplayName,
  refereeVerified,
  onSaved,
}: MemberRefereeEditFormProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const formRef = useRegisterMemberEditForm(pending)
  const [selectedRefereeId, setSelectedRefereeId] = useState(refereeId ?? '')
  const [selectedRefereeName, setSelectedRefereeName] = useState(refereeDisplayName)
  const [verified, setVerified] = useState(refereeVerified)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const payload = new FormData()
    payload.set('id', memberId)
    payload.set('referee_id', selectedRefereeId)
    payload.set('referee_verified', verified ? 'true' : 'false')

    startTransition(async () => {
      const result = await updateMemberReferee(payload)
      if (!result.success) {
        showError(result.error ?? 'មិនអាចរក្សាទុកបានទេ។')
        return
      }
      showSuccess('បានរក្សាទុកព័ត៌មានអ្នកធានា។')
      onSaved?.()
      router.refresh()
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="mb-6 space-y-4 rounded-xl border border-border bg-surface-muted/30 p-5">
      <div>
        <h4 className="text-sm font-semibold text-foreground">កែប្រែអ្នកធានា</h4>
        <p className="mt-1 text-sm text-muted">
          ស្វែងរកសមាជិកសកម្មតាមឈ្មោះ ទូរស័ព្ទ ឬអ៊ីមែលដើម្បីដាក់ជាអ្នកធានា។
        </p>
      </div>

      <RefereeSearch
        memberId={memberId}
        selectedId={selectedRefereeId}
        selectedName={selectedRefereeName}
        onSelect={(member) => {
          setSelectedRefereeId(member.id)
          setSelectedRefereeName(member.full_name_kh ?? member.full_name_en ?? '')
        }}
        onClear={() => {
          setSelectedRefereeId('')
          setSelectedRefereeName('')
          setVerified(false)
        }}
        disabled={pending}
      />

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={verified}
          onChange={(e) => setVerified(e.target.checked)}
          disabled={pending || !selectedRefereeId}
          className="h-4 w-4 rounded border-border text-brand-700 focus:ring-brand-500"
        />
        បានបញ្ជាក់ដោយអ្នកគ្រប់គ្រង
      </label>
    </form>
  )
}
