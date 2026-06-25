'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, Plus } from 'lucide-react'
import { addLoanByAdmin } from '@/app/actions/admin'
import { AdminModal } from '@/components/admin/AdminModal'
import { adminFieldClassName } from '@/components/admin/AdminListToolbar'
import { Button } from '@/components/ui/Button'
import { currencySymbol, formatMoney, type CurrencyCode } from '@/lib/currency'
import {
  LOAN_TO_SAVINGS_MULTIPLIER,
  type LoanEligibility,
} from '@/lib/loanEligibility'
import { showError, showSuccess } from '@/lib/toast'

type RefereePrefill = {
  id: string
  nameKh: string
  nameEn: string
  phone: string
  email: string
}

type MemberAddLoanFormProps = {
  memberId: string
  currency: CurrencyCode
  monthlyLoanInterestRate: number
  eligibility: LoanEligibility
  referee: RefereePrefill | null
  disabled?: boolean
}

const inputClass = `${adminFieldClassName} px-3 py-2.5`
const labelClass = 'mb-1.5 block text-xs font-semibold text-muted'

function dateFromToday(monthsAhead: number) {
  const date = new Date()
  date.setMonth(date.getMonth() + monthsAhead)
  return date.toISOString().slice(0, 10)
}

export function MemberAddLoanForm({
  memberId,
  currency,
  monthlyLoanInterestRate,
  eligibility,
  referee,
  disabled,
}: MemberAddLoanFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState('')
  const [purpose, setPurpose] = useState('')
  const [startDate, setStartDate] = useState(dateFromToday(0))
  const [endDate, setEndDate] = useState(dateFromToday(12))

  const [refereeNameKh, setRefereeNameKh] = useState(referee?.nameKh ?? '')
  const [refereeNameEn, setRefereeNameEn] = useState(referee?.nameEn ?? '')
  const [refereePhone, setRefereePhone] = useState(referee?.phone ?? '')
  const [refereeEmail, setRefereeEmail] = useState(referee?.email ?? '')

  const hasLinkedReferee = Boolean(referee?.id)
  const showRefereeFields = !hasLinkedReferee

  const eligibilityHint = useMemo(() => {
    if (eligibility.totalSavings <= 0) {
      return 'សមាជិកមិនទាន់មានសន្សំដែលបានទទួលយក — ត្រូវបន្ថែមសន្សំមុនពេលបង្កើតកម្ជី។'
    }
    return `អាចបន្ថែមបានរហូតដល់ ${formatMoney(eligibility.availableLoanAmount, currency)} (${LOAN_TO_SAVINGS_MULTIPLIER}x សន្សំ) · អត្រា ${monthlyLoanInterestRate}%/ខែ`
  }, [currency, eligibility, monthlyLoanInterestRate])

  function resetForm() {
    setAmount('')
    setPurpose('')
    setStartDate(dateFromToday(0))
    setEndDate(dateFromToday(12))
    setRefereeNameKh(referee?.nameKh ?? '')
    setRefereeNameEn(referee?.nameEn ?? '')
    setRefereePhone(referee?.phone ?? '')
    setRefereeEmail(referee?.email ?? '')
  }

  function handleClose() {
    if (loading) return
    setOpen(false)
    resetForm()
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsedAmount = parseFloat(amount)
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      showError('សូមបញ្ចូលចំនួនទឹកប្រាក់កម្ជីត្រឹមត្រូវ។')
      return
    }

    if (!purpose.trim()) {
      showError('សូមបញ្ចូលគោលបំណងកម្ជី។')
      return
    }

    setLoading(true)
    const payload = new FormData()
    payload.append('member_id', memberId)
    payload.append('amount', amount)
    payload.append('currency', currency)
    payload.append('purpose', purpose.trim())
    payload.append('start_date', startDate)
    payload.append('end_date', endDate)
    payload.append('auto_approve', 'true')

    if (referee?.id) payload.append('referee_id', referee.id)
    if (showRefereeFields || refereeNameKh) payload.append('referee_name_kh', refereeNameKh)
    if (showRefereeFields || refereeNameEn) payload.append('referee_name_en', refereeNameEn)
    if (showRefereeFields || refereePhone) payload.append('referee_phone', refereePhone)
    if (showRefereeFields || refereeEmail) payload.append('referee_email', refereeEmail)

    const result = await addLoanByAdmin(payload)
    setLoading(false)

    if (!result.success) {
      showError(result.error ?? 'មិនអាចបន្ថែមកម្ជីបានទេ។')
      return
    }

    showSuccess('បានបន្ថែមកម្ជីដោយជោគជ័យ។')
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
        បន្ថែមកម្ជី
      </Button>

      <AdminModal
        open={open}
        onClose={handleClose}
        title="បន្ថែមកម្ជី"
        description={eligibilityHint}
        icon={CreditCard}
        iconTone="brand"
        size="xl"
        pending={loading}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="admin-loan-amount" className={labelClass}>
                ចំនួនទឹកប្រាក់ ({currency}) <span className="text-red-500">*</span>
              </label>
              <input
                id="admin-loan-amount"
                type="number"
                min="1"
                step="0.01"
                required
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className={inputClass}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="admin-loan-purpose" className={labelClass}>
                គោលបំណង <span className="text-red-500">*</span>
              </label>
              <input
                id="admin-loan-purpose"
                type="text"
                required
                value={purpose}
                onChange={(event) => setPurpose(event.target.value)}
                className={inputClass}
                placeholder="ឧ. ការបង្កើនទុនអាជីវកម្ម"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="admin-loan-start" className={labelClass}>
                កាលបរិច្ឆេទចាប់ផ្តើម <span className="text-red-500">*</span>
              </label>
              <input
                id="admin-loan-start"
                type="date"
                required
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className={inputClass}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="admin-loan-end" className={labelClass}>
                កាលបរិច្ឆេទបញ្ចប់ <span className="text-red-500">*</span>
              </label>
              <input
                id="admin-loan-end"
                type="date"
                required
                min={startDate}
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className={inputClass}
                disabled={loading}
              />
            </div>
          </div>

          {hasLinkedReferee ? (
            <div className="rounded-lg border border-border bg-surface-muted/50 px-4 py-3 text-sm text-muted">
              អ្នកធានា៖{' '}
              <span className="font-medium text-foreground">{referee?.nameKh || referee?.nameEn}</span>
              {referee?.phone ? ` · ${referee.phone}` : ''}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="admin-loan-referee-kh" className={labelClass}>
                  ឈ្មោះអ្នកធានា (ខ្មែរ) <span className="text-red-500">*</span>
                </label>
                <input
                  id="admin-loan-referee-kh"
                  type="text"
                  required
                  value={refereeNameKh}
                  onChange={(event) => setRefereeNameKh(event.target.value)}
                  className={inputClass}
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="admin-loan-referee-en" className={labelClass}>
                  ឈ្មោះអ្នកធានា (អង់គ្លេស) <span className="text-red-500">*</span>
                </label>
                <input
                  id="admin-loan-referee-en"
                  type="text"
                  required
                  value={refereeNameEn}
                  onChange={(event) => setRefereeNameEn(event.target.value)}
                  className={inputClass}
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="admin-loan-referee-phone" className={labelClass}>
                  ទូរស័ព្ទអ្នកធានា <span className="text-red-500">*</span>
                </label>
                <input
                  id="admin-loan-referee-phone"
                  type="tel"
                  required
                  value={refereePhone}
                  onChange={(event) => setRefereePhone(event.target.value)}
                  className={inputClass}
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="admin-loan-referee-email" className={labelClass}>
                  អ៊ីមែលអ្នកធានា
                </label>
                <input
                  id="admin-loan-referee-email"
                  type="email"
                  value={refereeEmail}
                  onChange={(event) => setRefereeEmail(event.target.value)}
                  className={inputClass}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={loading}>
              បោះបង់
            </Button>
            <Button type="submit" size="sm" loading={loading}>
              <Plus className="h-4 w-4" />
              បន្ថែមកម្ជី
            </Button>
          </div>
        </form>
      </AdminModal>
    </>
  )
}
