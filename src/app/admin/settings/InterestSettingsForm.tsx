'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { adminFieldClassName } from '@/components/admin'
import { updateInterestSettings } from '@/app/actions/admin'
import { showError } from '@/lib/toast'
import { Percent, PiggyBank, CreditCard } from 'lucide-react'

type InterestSettingsFormProps = {
  monthlySavingInterestRate: number
  monthlyLoanInterestRate: number
}

export function InterestSettingsForm({
  monthlySavingInterestRate,
  monthlyLoanInterestRate,
}: InterestSettingsFormProps) {
  const router = useRouter()
  const [savingRate, setSavingRate] = useState(String(monthlySavingInterestRate))
  const [loanRate, setLoanRate] = useState(String(monthlyLoanInterestRate))
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    const payload = new FormData()
    payload.append('monthly_saving_interest_rate', savingRate)
    payload.append('monthly_loan_interest_rate', loanRate)

    const result = await updateInterestSettings(payload)
    setLoading(false)

    if (!result.success) {
      showError(result.error ?? 'មិនអាចរក្សាទុកការកំណត់បានទេ។')
      return
    }

    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <div className="mb-6 flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
            <PiggyBank className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-900">ការប្រាក់សន្សំ</h2>
            <p className="mt-1 text-sm text-slate-500">
              អត្រាការប្រាក់ប្រចាំខែលើសមតុល្យសន្សំដែលបានផ្ទៀងផ្ទាត់។
            </p>
          </div>
        </div>

        <label className="block text-sm font-medium text-slate-700" htmlFor="saving-rate">
          អត្រាការប្រាក់សន្សំ (% ប្រចាំខែ)
        </label>
        <div className="relative mt-2 max-w-xs">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Percent className="h-4 w-4" />
          </span>
          <input
            id="saving-rate"
            type="number"
            min="0"
            max="100"
            step="0.01"
            required
            value={savingRate}
            onChange={(event) => setSavingRate(event.target.value)}
            onWheel={(event) => event.currentTarget.blur()}
            className={`${adminFieldClassName} w-full py-2.5 pl-10 pr-4`}
          />
        </div>
      </Card>

      <Card>
        <div className="mb-6 flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-700">
            <CreditCard className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-900">ការប្រាក់កម្ជី</h2>
            <p className="mt-1 text-sm text-slate-500">
              អត្រាការប្រាក់ប្រចាំខែលំនាំដើមសម្រាប់សមាជិកដែលមិនត្រូវបានចាត់ចែងអត្រាជាក្រុម។
            </p>
          </div>
        </div>

        <label className="block text-sm font-medium text-slate-700" htmlFor="loan-rate">
          អត្រាការប្រាក់កម្ជី (% ប្រចាំខែ)
        </label>
        <div className="relative mt-2 max-w-xs">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Percent className="h-4 w-4" />
          </span>
          <input
            id="loan-rate"
            type="number"
            min="0"
            max="100"
            step="0.01"
            required
            value={loanRate}
            onChange={(event) => setLoanRate(event.target.value)}
            onWheel={(event) => event.currentTarget.blur()}
            className={`${adminFieldClassName} w-full py-2.5 pl-10 pr-4`}
          />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" loading={loading}>
          រក្សាទុកការកំណត់
        </Button>
      </div>
    </form>
  )
}
