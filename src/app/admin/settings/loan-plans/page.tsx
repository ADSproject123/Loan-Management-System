import { AdminPanel } from '@/components/admin'
import { getInterestSettings, getLoanInterestPlans } from '@/lib/interest'
import { LoanInterestPlansManager } from '@/app/admin/settings/LoanInterestPlansManager'

export default async function AdminLoanInterestPlansPage() {
  const [settings, loanInterestPlans] = await Promise.all([
    getInterestSettings(),
    getLoanInterestPlans(),
  ])

  return (
    <main>
      <AdminPanel
        title="អត្រាកម្ជីជាក្រុម"
        description={`សមាជិកដែលមិនត្រូវបានចាត់ចែងនឹងប្រើអត្រាទូទៅ ${settings.monthlyLoanInterestRate}% ប្រចាំខែ។`}
      >
        <div className="px-6 py-6 md:px-8">
          <LoanInterestPlansManager
            plans={loanInterestPlans}
            globalMonthlyLoanInterestRate={settings.monthlyLoanInterestRate}
          />
        </div>
      </AdminPanel>
    </main>
  )
}
