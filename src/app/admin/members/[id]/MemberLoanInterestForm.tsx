'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Percent } from 'lucide-react'
import { Select, type SelectOption } from '@/components/ui/Select'
import { assignMemberLoanInterestPlan } from '@/app/actions/admin'
import { showError } from '@/lib/toast'
import { useRegisterMemberEditForm } from './MemberEditModeContext'
import type { LoanInterestPlan } from '@/lib/loanInterestPlans'

type MemberLoanInterestFormProps = {
  memberId: string
  assignedPlanId: string | null
  plans: LoanInterestPlan[]
  globalMonthlyLoanInterestRate: number
  onSaved?: () => void
}

export function MemberLoanInterestForm({
  memberId,
  assignedPlanId,
  plans,
  globalMonthlyLoanInterestRate,
  onSaved,
}: MemberLoanInterestFormProps) {
  const router = useRouter()
  const [planId, setPlanId] = useState(assignedPlanId ?? '')
  const [loading, setLoading] = useState(false)
  const formRef = useRegisterMemberEditForm(loading)

  const activePlans = plans.filter((plan) => plan.isActive)
  const selectedPlan = activePlans.find((plan) => plan.id === planId)
  const effectiveRate = selectedPlan?.monthlyRate ?? globalMonthlyLoanInterestRate

  const planOptions = useMemo<SelectOption[]>(
    () => [
      {
        value: '',
        label: 'អត្រាទូទៅ',
        hint: `${globalMonthlyLoanInterestRate}% ប្រចាំខែ`,
      },
      ...activePlans.map((plan) => ({
        value: plan.id,
        label: plan.name,
        hint: `${plan.monthlyRate}% ប្រចាំខែ`,
      })),
    ],
    [activePlans, globalMonthlyLoanInterestRate]
  )

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

    onSaved?.()
    router.refresh()
  }

  return (
    <div className="w-full rounded-xl border border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4 md:px-6">
        <Percent className="h-5 w-5 text-brand-700" />
        <h3 className="text-lg font-semibold text-foreground">អត្រាកម្ជី</h3>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 px-5 py-5 md:px-6">
        <p className="text-sm text-muted">
          ជ្រើសរើសអត្រាកម្ជីជាក្រុមសម្រាប់សមាជិកនេះ។ កម្ជីថ្មីនឹងប្រើអត្រាដែលចាត់ចែងនៅទីនេះ។
        </p>

        <div className="max-w-md">
          <label
            htmlFor="member-loan-plan"
            className="mb-1 block text-xs font-semibold text-muted"
          >
            អត្រាកម្ជីជាក្រុម
          </label>
          <Select
            id="member-loan-plan"
            value={planId}
            onChange={setPlanId}
            options={planOptions}
            aria-label="អត្រាកម្ជីជាក្រុម"
          />
        </div>
      </form>
    </div>
  )
}
