'use client'

import { useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { UserCheck, X, type LucideIcon } from 'lucide-react'
import { approveMember, updateMemberRole } from '@/app/actions/admin'
import { adminMenuItemClass, AdminMenuItemIcon } from '@/components/admin/AdminActionsMenu'
import { MEMBER_ROLE_LABELS } from '@/components/ui/Badge'
import { showError, showSuccess } from '@/lib/toast'
import type { MemberRole } from '@/types/database'

const ROLE_OPTIONS: { value: MemberRole; description: string }[] = [
  { value: 'founder', description: 'សមាជិកស្ថាបនិកនៃសហករណ៍' },
  { value: 'comember', description: 'សហសមាជិករួមបង្កើត' },
  { value: 'member', description: 'សមាជិកធម្មតា' },
]

type AcceptMemberButtonProps = {
  memberId: string
  memberName?: string
  /** 'accept' approves a pending member; 'role' changes an existing member's role. */
  mode?: 'accept' | 'role'
  currentRole?: MemberRole
  label?: string
  className?: string
  menuItem?: boolean
  icon?: LucideIcon
}

export function AcceptMemberButton({
  memberId,
  memberName,
  mode = 'accept',
  currentRole = 'member',
  label = mode === 'role' ? 'ប្តូរតួនាទី' : 'ទទួលយកសមាជិក',
  className = '',
  menuItem = false,
  icon,
}: AcceptMemberButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<MemberRole>(currentRole)
  const [pending, startTransition] = useTransition()

  function close() {
    if (pending) return
    setOpen(false)
    setRole(currentRole)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const formData = new FormData()
    formData.set('id', memberId)
    formData.set('role', role)

    startTransition(async () => {
      const result = await (mode === 'role' ? updateMemberRole(formData) : approveMember(formData))
      if (result.success) {
        showSuccess(
          mode === 'role'
            ? 'បានប្តូរតួនាទីដោយជោគជ័យ។'
            : 'បានទទួលយកសមាជិកដោយជោគជ័យ។'
        )
        setOpen(false)
        router.refresh()
        return
      }
      showError(result.error ?? 'មិនអាចរក្សាទុកបានទេ។')
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        className={
          menuItem
            ? `${adminMenuItemClass(false)} ${className}`
            : `rounded-lg bg-brand-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-800 disabled:opacity-60 ${className}`
        }
      >
        {menuItem && icon ? <AdminMenuItemIcon icon={icon} /> : null}
        <span>{label}</span>
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="accept-dialog-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50"
            aria-label="បិទ"
            onClick={close}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-xl">
            <button
              type="button"
              onClick={close}
              disabled={pending}
              className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              aria-label="បិទ"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100">
              <UserCheck className="h-6 w-6 text-brand-700" />
            </div>

            <h2 id="accept-dialog-title" className="pr-8 text-lg font-bold text-gray-900">
              {mode === 'role' ? 'ប្តូរតួនាទីសមាជិក' : 'ទទួលយកសមាជិក'}
              {memberName ? ` — ${memberName}` : ''}
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              {mode === 'role'
                ? 'ជ្រើសរើសតួនាទីថ្មីសម្រាប់សមាជិកនេះ។'
                : 'ជ្រើសរើសតួនាទីសម្រាប់សមាជិក មុនពេលធ្វើឱ្យគណនីដំណើរការ។'}
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <fieldset className="space-y-2">
                <legend className="mb-1.5 text-sm font-semibold text-gray-800">តួនាទី</legend>
                {ROLE_OPTIONS.map((option) => {
                  const isActive = role === option.value
                  return (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition ${
                        isActive
                          ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-500/30'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={option.value}
                        checked={isActive}
                        onChange={() => setRole(option.value)}
                        disabled={pending}
                        className="mt-0.5 h-4 w-4 accent-brand-700"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-gray-900">
                          {MEMBER_ROLE_LABELS[option.value]}
                        </span>
                        <span className="block text-xs text-gray-500">{option.description}</span>
                      </span>
                    </label>
                  )
                })}
              </fieldset>

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={close}
                  disabled={pending}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-brand-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60"
                >
                  {pending
                    ? 'កំពុងរក្សាទុក...'
                    : mode === 'role'
                      ? 'រក្សាទុកតួនាទី'
                      : 'បញ្ជាក់ទទួលយក'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
