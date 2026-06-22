'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PiggyBank, Plus } from 'lucide-react'
import { addSavingByAdmin } from '@/app/actions/admin'
import { AdminModal } from '@/components/admin/AdminModal'
import { adminFieldClassName } from '@/components/admin/AdminListToolbar'
import { Button } from '@/components/ui/Button'
import { MIN_SAVING_AMOUNT, type CurrencyCode } from '@/lib/currency'
import { showError, showSuccess } from '@/lib/toast'

type MemberAddSavingFormProps = {
  memberId: string
  currency: CurrencyCode
  disabled?: boolean
}

const inputClass = `${adminFieldClassName} px-3 py-2.5`
const labelClass = 'mb-1.5 block text-xs font-semibold text-muted'

function defaultSavingDate() {
  return new Date().toISOString().slice(0, 10)
}

export function MemberAddSavingForm({ memberId, currency, disabled }: MemberAddSavingFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState('')
  const [savingDate, setSavingDate] = useState(defaultSavingDate)
  const [notes, setNotes] = useState('')
  const [evidence, setEvidence] = useState<File | null>(null)

  function resetForm() {
    setAmount('')
    setNotes('')
    setEvidence(null)
    setSavingDate(defaultSavingDate())
  }

  function handleClose() {
    if (loading) return
    setOpen(false)
    resetForm()
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsedAmount = parseFloat(amount)
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount < MIN_SAVING_AMOUNT) {
      showError(`ចំនួនទឹកប្រាក់សន្សំអប្បបរមាគឺ $${MIN_SAVING_AMOUNT}។`)
      return
    }

    setLoading(true)
    const payload = new FormData()
    payload.append('member_id', memberId)
    payload.append('amount', amount)
    payload.append('currency', currency)
    payload.append('saving_date', savingDate)
    payload.append('notes', notes)
    if (evidence) payload.append('evidence', evidence)

    const result = await addSavingByAdmin(payload)
    setLoading(false)

    if (!result.success) {
      showError(result.error ?? 'មិនអាចបន្ថែមការសន្សំបានទេ។')
      return
    }

    showSuccess('បានបន្ថែមការសន្សំដោយជោគជ័យ។')
    setOpen(false)
    resetForm()
    router.refresh()
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        <Plus className="h-4 w-4" />
        បន្ថែមការសន្សំ
      </Button>

      <AdminModal
        open={open}
        onClose={handleClose}
        title="បន្ថែមការសន្សំ"
        description="ការសន្សំដែលបន្ថែមដោយអ្នកគ្រប់គ្រងនឹងត្រូវបានទទួលយកភ្លាមៗ។"
        icon={PiggyBank}
        iconTone="emerald"
        size="lg"
        pending={loading}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="admin-saving-amount" className={labelClass}>
                ចំនួនទឹកប្រាក់ ({currency}) <span className="text-red-500">*</span>
              </label>
              <input
                id="admin-saving-amount"
                type="number"
                min={MIN_SAVING_AMOUNT}
                step="0.01"
                required
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className={inputClass}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="admin-saving-date" className={labelClass}>
                ថ្ងៃសន្សំ <span className="text-red-500">*</span>
              </label>
              <input
                id="admin-saving-date"
                type="date"
                required
                value={savingDate}
                onChange={(event) => setSavingDate(event.target.value)}
                className={inputClass}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="admin-saving-notes" className={labelClass}>
              កំណត់ចំណាំ
            </label>
            <textarea
              id="admin-saving-notes"
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className={`${inputClass} resize-none`}
              placeholder="ឧ. បង់ប្រាក់សន្សំខែមេសា"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="admin-saving-evidence" className={labelClass}>
              ភស្តុតាង (មិនដាក់ក៏បាន)
            </label>
            <input
              id="admin-saving-evidence"
              type="file"
              accept="image/*,application/pdf"
              onChange={(event) => setEvidence(event.target.files?.[0] ?? null)}
              className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-800`}
              disabled={loading}
            />
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={loading}>
              បោះបង់
            </Button>
            <Button type="submit" size="sm" loading={loading}>
              <Plus className="h-4 w-4" />
              បន្ថែមការសន្សំ
            </Button>
          </div>
        </form>
      </AdminModal>
    </>
  )
}
