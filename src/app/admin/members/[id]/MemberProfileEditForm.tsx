'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, Plus, Trash2, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select, type SelectOption } from '@/components/ui/Select'
import { MEMBER_ROLE_LABELS } from '@/components/ui/Badge'
import { adminFieldClassName } from '@/components/admin'
import { updateMemberProfile } from '@/app/actions/admin'
import { CambodiaAddressSelect, formatCambodiaAddress, parseCambodiaAddress } from '@/components/ui/CambodiaAddressSelect'
import { showError, showSuccess } from '@/lib/toast'
import { useRegisterMemberEditForm } from './MemberEditModeContext'
import { WORKPLACE_OPTIONS } from '@/lib/workplace'
import type { MemberRole } from '@/types/database'

type EmergencyContact = { full_name: string; phone: string }

const ROLE_OPTIONS: MemberRole[] = ['founder', 'comember', 'member']

type MemberProfileEditFormProps = {
  member: {
    id: string
    full_name_kh: string | null
    full_name_en: string | null
    email: string
    phone: string | null
    date_of_birth: string | null
    address: string | null
    id_number: string | null
    resident_book_number: string | null
    workplace: string | null
    telegram_chat_id: string | null
    role: MemberRole
    emergency_contacts: EmergencyContact[]
  }
  onSaved?: () => void
}

const inputClass = `${adminFieldClassName} px-3 py-2.5`

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-muted">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      {children}
    </div>
  )
}

export function MemberProfileEditForm({ member, onSaved }: MemberProfileEditFormProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const formRef = useRegisterMemberEditForm(pending)
  const [form, setForm] = useState({
    full_name_kh: member.full_name_kh ?? '',
    full_name_en: member.full_name_en ?? '',
    email: member.email,
    phone: member.phone ?? '',
    date_of_birth: member.date_of_birth ?? '',
    id_number: member.id_number ?? '',
    resident_book_number: member.resident_book_number ?? '',
    workplace: member.workplace ?? '',
    address: member.address ?? '',
    role: member.role,
  })
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(
    member.emergency_contacts ?? []
  )

  const roleOptions = useMemo<SelectOption[]>(
    () =>
      ROLE_OPTIONS.map((role) => ({
        value: role,
        label: MEMBER_ROLE_LABELS[role],
      })),
    []
  )

  function setField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function addContact() {
    setEmergencyContacts((prev) => [...prev, { full_name: '', phone: '' }])
  }

  function updateContact(index: number, field: keyof EmergencyContact, value: string) {
    setEmergencyContacts((prev) =>
      prev.map((contact, i) => (i === index ? { ...contact, [field]: value } : contact))
    )
  }

  function removeContact(index: number) {
    setEmergencyContacts((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const payload = new FormData()
    payload.set('id', member.id)
    Object.entries(form).forEach(([key, value]) => payload.set(key, value))
    payload.set('emergency_contacts', JSON.stringify(emergencyContacts))

    startTransition(async () => {
      const result = await updateMemberProfile(payload)
      if (!result.success) {
        showError(result.error ?? 'មិនអាចរក្សាទុកបានទេ។')
        return
      }
      showSuccess('បានរក្សាទុកព័ត៌មានសមាជិក។')
      onSaved?.()
      router.refresh()
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Field label="ឈ្មោះ (ខ្មែរ)" required>
          <input
            type="text"
            value={form.full_name_kh}
            onChange={(e) => setField('full_name_kh', e.target.value)}
            className={inputClass}
            required
            disabled={pending}
          />
        </Field>
        <Field label="ឈ្មោះ (អង់គ្លេស)" required>
          <input
            type="text"
            value={form.full_name_en}
            onChange={(e) => setField('full_name_en', e.target.value)}
            className={inputClass}
            required
            disabled={pending}
          />
        </Field>
        <Field label="តួនាទី" required>
          <Select
            id="member-role"
            value={form.role}
            onChange={(value) => setField('role', value as MemberRole)}
            options={roleOptions}
            aria-label="តួនាទី"
          />
        </Field>
        <Field label="អ៊ីមែល" required>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
            className={inputClass}
            required
            disabled={pending}
          />
        </Field>
        <Field label="ទូរស័ព្ទ" required>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setField('phone', e.target.value)}
            className={inputClass}
            required
            disabled={pending}
          />
        </Field>
        <Field label="ថ្ងៃខែឆ្នាំកំណើត">
          <input
            type="date"
            value={form.date_of_birth}
            onChange={(e) => setField('date_of_birth', e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            className={inputClass}
            disabled={pending}
          />
        </Field>
        <Field label="លេខអត្តសញ្ញាណប័ណ្ណ">
          <input
            type="text"
            value={form.id_number}
            onChange={(e) => setField('id_number', e.target.value)}
            className={inputClass}
            disabled={pending}
          />
        </Field>
        <Field label="លេខសៀវភៅគ្រួសារ">
          <input
            type="text"
            value={form.resident_book_number}
            onChange={(e) => setField('resident_book_number', e.target.value)}
            className={inputClass}
            disabled={pending}
          />
        </Field>
        <Field label="កន្លែងធ្វើការ">
          <select
            value={form.workplace}
            onChange={(e) => setField('workplace', e.target.value)}
            className={inputClass}
            disabled={pending}
          >
            <option value="">-- ជ្រើសរើស --</option>
            {WORKPLACE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Telegram">
          <input
            type="text"
            value={member.telegram_chat_id ?? 'មិនបានភ្ជាប់'}
            readOnly
            className={`${inputClass} bg-surface-muted text-muted`}
          />
        </Field>
      </div>

      <Field label="អាសយដ្ឋាន">
        <CambodiaAddressSelect
          value={parseCambodiaAddress(form.address)}
          onChange={(addr) => setField('address', formatCambodiaAddress(addr))}
          disabled={pending}
          selectClassName={inputClass}
          inputClassName={inputClass}
        />
      </Field>

      <div className="space-y-3 border-t border-border pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-sm font-semibold text-foreground">ទំនាក់ទំនងបន្ទាន់</h4>
          <button
            type="button"
            onClick={addContact}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-muted px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-brand-50 disabled:opacity-60"
          >
            <Plus className="h-3.5 w-3.5" />
            បន្ថែម
          </button>
        </div>

        {emergencyContacts.length === 0 ? (
          <p className="text-sm text-muted">មិនមានទំនាក់ទំនងបន្ទាន់ទេ។</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {emergencyContacts.map((contact, index) => (
              <div
                key={index}
                className="rounded-xl border border-border bg-surface-muted/40 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted">
                    ទំនាក់ទំនងលេខ {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeContact(index)}
                    disabled={pending}
                    className="grid h-7 w-7 place-items-center rounded-lg text-muted transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      value={contact.full_name}
                      onChange={(e) => updateContact(index, 'full_name', e.target.value)}
                      className={`${inputClass} pl-9`}
                      placeholder="ឈ្មោះពេញ"
                      disabled={pending}
                    />
                  </div>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <input
                      type="tel"
                      value={contact.phone}
                      onChange={(e) => updateContact(index, 'phone', e.target.value)}
                      className={`${inputClass} pl-9`}
                      placeholder="0812345678"
                      disabled={pending}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </form>
  )
}
