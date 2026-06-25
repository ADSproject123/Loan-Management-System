'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PiggyBank, Plus, XCircle } from 'lucide-react'
import { adminCreateCapitalRequest } from '@/app/actions/admin'
import { AdminModal } from '@/components/admin/AdminModal'
import { adminFieldClassName } from '@/components/admin/AdminListToolbar'
import { Button } from '@/components/ui/Button'
import { formatMoney, type CurrencyCode } from '@/lib/currency'
import { showError, showSuccess } from '@/lib/toast'

type Props = {
  memberId: string
  currency: CurrencyCode
  savingsTotal: number
  disabled?: boolean
}

const inputClass = `${adminFieldClassName} px-3 py-2.5`
const labelClass = 'mb-1.5 block text-xs font-semibold text-muted'

export function MemberAddCapitalRequestForm({ memberId, currency, savingsTotal, disabled }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [afterDecision, setAfterDecision] = useState<'continue' | 'withdraw' | ''>('')

  function handleClose() {
    setOpen(false)
    setAmount('')
    setReason('')
    setAfterDecision('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!amount || isNaN(amt) || amt <= 0) {
      showError('សូមបញ្ចូលចំនួនទឹកប្រាក់ត្រឹមត្រូវ។')
      return
    }
    if (amt > savingsTotal) {
      showError('ចំនួនទឹកប្រាក់មិនអាចលើសសមតុល្យសន្សំបាន។')
      return
    }
    if (!reason.trim()) {
      showError('សូមបញ្ចូលមូលហេតុ។')
      return
    }
    if (!afterDecision) {
      showError('សូមជ្រើសរើសសកម្មភាពបន្ទាប់ពីការដក។')
      return
    }

    setLoading(true)
    const payload = new FormData()
    payload.set('id', memberId)
    payload.set('amount', amount)
    payload.set('currency', currency)
    payload.set('reason', reason)
    payload.set('after_decision', afterDecision)

    const result = await adminCreateCapitalRequest(payload)
    setLoading(false)

    if (!result.success) {
      showError(result.error ?? 'មិនអាចដំណើរការការដកដើមទុនបានទេ។')
      return
    }

    showSuccess('បានដំណើរការការដកដើមទុនដោយជោគជ័យ។')
    handleClose()
    router.refresh()
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="gap-1.5"
      >
        <Plus className="h-4 w-4" />
        ដកដើមទុន
      </Button>

      <AdminModal open={open} onClose={handleClose} title="ដកដើមទុន">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelClass}>ចំនួនទឹកប្រាក់ ({currency})</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onWheel={(e) => e.currentTarget.blur()}
              className={inputClass}
              placeholder="0.00"
              min="1"
              max={savingsTotal}
              step="0.01"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-muted">អតិបរមា: {formatMoney(savingsTotal, currency)}</p>
          </div>

          <div>
            <label className={labelClass}>មូលហេតុ</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={`${inputClass} resize-none`}
              rows={3}
              placeholder="ពិពណ៌នាមូលហេតុដែលដកដើមទុន..."
              disabled={loading}
            />
          </div>

          <div>
            <label className={labelClass}>បន្ទាប់ពីការដក</label>
            <div className="space-y-2">
              <label className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 px-4 py-3 transition-colors ${
                afterDecision === 'continue' ? 'border-brand-600 bg-brand-50' : 'border-border bg-surface hover:border-brand-200'
              }`}>
                <input
                  type="radio"
                  name="after_decision"
                  value="continue"
                  checked={afterDecision === 'continue'}
                  onChange={() => setAfterDecision('continue')}
                  className="mt-0.5 accent-brand-800"
                  disabled={loading}
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">បន្តសន្សំ</p>
                  <p className="text-xs text-muted">ដកដើមទុន ប៉ុន្តែនៅតែជាសមាជិកសកម្ម</p>
                </div>
              </label>

              <label className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 px-4 py-3 transition-colors ${
                afterDecision === 'withdraw' ? 'border-rose-500 bg-rose-50' : 'border-border bg-surface hover:border-rose-200'
              }`}>
                <input
                  type="radio"
                  name="after_decision"
                  value="withdraw"
                  checked={afterDecision === 'withdraw'}
                  onChange={() => setAfterDecision('withdraw')}
                  className="mt-0.5 accent-rose-600"
                  disabled={loading}
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">ឈប់ចូលជាសមាជិក</p>
                  <p className="text-xs text-muted">ដកដើមទុន និង បញ្ចប់ការចូលជាសមាជិក</p>
                </div>
              </label>
            </div>

            {afterDecision === 'withdraw' && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <p className="text-xs text-rose-700">
                  ការបញ្ចប់ការចូលជាសមាជិកគឺអចិន្ត្រៃយ៍ — សមតុល្យទាំងអស់នឹងត្រូវបានដោះស្រាយ។
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={loading}>
              បោះបង់
            </Button>
            <Button
              type="submit"
              size="sm"
              variant={afterDecision === 'withdraw' ? 'danger' : 'primary'}
              loading={loading}
            >
              <PiggyBank className="h-4 w-4" />
              ដំណើរការ
            </Button>
          </div>
        </form>
      </AdminModal>
    </>
  )
}
