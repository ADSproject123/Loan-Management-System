'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Percent } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { adminFieldClassName } from '@/components/admin'
import { assignMemberLoanInterestPlan } from '@/app/actions/admin'
import { showError } from '@/lib/toast'
import type { LoanInterestPlan } from '@/lib/loanInterestPlans'

type MemberLoanInterestFormProps = {
  memberId: string
  assignedPlanId: string | null
  plans: LoanInterestPlan[]
  globalMonthlyLoanInterestRate: number
}

export function MemberLoanInterestForm({
  memberId,
  assignedPlanId,
  plans,
  globalMonthlyLoanInterestRate,
}: MemberLoanInterestFormProps) {
  const router = useRouter()
  const [planId, setPlanId] = useState(assignedPlanId ?? '')
  const [loading, setLoading] = useState(false)

  const activePlans = plans.filter((plan) => plan.isActive)
  const selectedPlan = activePlans.find((plan) => plan.id === planId)
  const effectiveRate = selectedPlan?.monthlyRate ?? globalMonthlyLoanInterestRate

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    const payload = new FormData()
    payload.append('id', memberId)
    if (planId) payload.append('loan_interest_plan_id', planId)

    const result = await assignMemberLoanInterestPlan(payload)
    setLoading(false)

    if (!result.success) {
      showError(result.error ?? 'មិនអាចរក្សាទុកបានទេ។')
      return
    }

    router.refresh()
  }

  return (
    <Card className="mb-6 w-full">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-700">
          <Percent className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">អត្រាការប្រាក់កម្ជី</h3>
          <p className="mt-1 text-sm text-gray-500">
            ជ្រើសរើសអត្រាកម្ជីជាក្រុមសម្រាប់សមាជិកនេះ។ កម្ជីថ្មីនឹងប្រើអត្រាដែលចាត់ចែងនៅទីនេះ។
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700" htmlFor="member-loan-plan">
            អត្រាកម្ជី
          </label>
          <select
            id="member-loan-plan"
            value={planId}
            onChange={(event) => setPlanId(event.target.value)}
            className={`${adminFieldClassName} mt-2 w-full`}
          >
            <option value="">
              អត្រាទូទៅ ({globalMonthlyLoanInterestRate}% ប្រចាំខែ)
            </option>
            {activePlans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} ({plan.monthlyRate}% ប្រចាំខែ)
              </option>
            ))}
          </select>
        </div>

        <p className="text-sm text-gray-600">
          អត្រាប្រើប្រាស់សម្រាប់កម្ជីថ្មី៖{' '}
          <span className="font-semibold text-gray-900">{effectiveRate}%</span> ប្រចាំខែ
        </p>

        {activePlans.length === 0 && (
          <p className="text-sm text-amber-700">
            មិនទាន់មានអត្រាកម្ជីជាក្រុមទេ។{' '}
            <a href="/admin/settings/loan-plans" className="font-medium text-brand-700 hover:text-brand-900">
              បង្កើតអត្រានៅទីនេះ
            </a>
            ។
          </p>
        )}

        <Button type="submit" loading={loading} size="sm">
          រក្សាទុកការចាត់ចែង
        </Button>
      </form>
    </Card>
  )
}
