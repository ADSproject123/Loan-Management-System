'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { changeMemberPassword } from '@/app/actions/member'
import { showError, showSuccess } from '@/lib/toast'
import { Lock, Eye, EyeOff } from 'lucide-react'

const inputBase = 'app-input shadow-xs'

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-foreground">
        {label}
      </label>
      {children}
    </div>
  )
}

function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  autoComplete: string
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground">
        <Lock className="h-4.5 w-4.5" />
      </span>
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputBase} app-input--with-icon app-input--with-trailing`}
      />
      <button
        type="button"
        aria-label={visible ? 'លាក់ពាក្យសម្ងាត់' : 'បង្ហាញពាក្យសម្ងាត់'}
        onClick={() => setVisible(!visible)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-foreground transition hover:bg-slate-100 hover:text-foreground"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showError('សូមបំពេញគ្រប់វាលទាំងអស់ដែលត្រូវការ។')
      return
    }
    if (newPassword.length < 8) {
      showError('ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច ៨ តួអក្សរ។')
      return
    }
    if (newPassword !== confirmPassword) {
      showError('ការបញ្ជាក់ពាក្យសម្ងាត់ថ្មីមិនត្រូវគ្នាទេ។')
      return
    }

    setLoading(true)
    const payload = new FormData()
    payload.append('current_password', currentPassword)
    payload.append('new_password', newPassword)
    payload.append('confirm_password', confirmPassword)

    const result = await changeMemberPassword(payload)
    setLoading(false)

    if (!result.success) {
      showError(result.error ?? 'មិនអាចប្តូរពាក្យសម្ងាត់បានទេ។')
      return
    }

    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    showSuccess('ពាក្យសម្ងាត់របស់អ្នកត្រូវបានប្តូរដោយជោគជ័យ។')
  }

  return (
    <Card>
      <h2 className="mb-5 font-semibold text-gray-900">ប្តូរពាក្យសម្ងាត់</h2>
      <div className="space-y-5">
        <Field label="ពាក្យសម្ងាត់បច្ចុប្បន្ន" htmlFor="current_password">
          <PasswordInput
            id="current_password"
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder="បញ្ចូលពាក្យសម្ងាត់បច្ចុប្បន្ន"
            autoComplete="current-password"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="ពាក្យសម្ងាត់ថ្មី" htmlFor="new_password">
            <PasswordInput
              id="new_password"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="យ៉ាងតិច ៨ តួអក្សរ"
              autoComplete="new-password"
            />
          </Field>
          <Field label="បញ្ជាក់ពាក្យសម្ងាត់ថ្មី" htmlFor="confirm_password">
            <PasswordInput
              id="confirm_password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="បញ្ចូលពាក្យសម្ងាត់ថ្មីម្តងទៀត"
              autoComplete="new-password"
            />
          </Field>
        </div>

        <Button onClick={handleSubmit} loading={loading} className="w-full" size="lg">
          ប្តូរពាក្យសម្ងាត់
        </Button>
      </div>
    </Card>
  )
}
