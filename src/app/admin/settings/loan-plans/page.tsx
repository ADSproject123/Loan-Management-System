import { getInterestSettings, getLoanInterestPlans } from '@/lib/interest'
import { LoanInterestPlansManager } from '@/app/admin/settings/LoanInterestPlansManager'

export default async function AdminLoanInterestPlansPage() {
  const [settings, loanInterestPlans] = await Promise.all([
    getInterestSettings(),
    getLoanInterestPlans(),
  ])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <p className="text-sm text-muted">
        សមាជិកដែលមិនត្រូវបានចាត់ចែងនឹងប្រើអត្រាទូទៅ {settings.monthlyLoanInterestRate}% ប្រចាំខែ។
      </p>
      <LoanInterestPlansManager
        plans={loanInterestPlans}
        globalMonthlyLoanInterestRate={settings.monthlyLoanInterestRate}
      />
    </div>
  )
}
