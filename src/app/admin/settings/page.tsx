import { getInterestSettings } from '@/lib/interest'
import { InterestSettingsForm } from '@/app/admin/settings/InterestSettingsForm'

export default async function AdminSettingsPage() {
  const settings = await getInterestSettings()

  return (
    <InterestSettingsForm
      monthlySavingInterestRate={settings.monthlySavingInterestRate}
      monthlyLoanInterestRate={settings.monthlyLoanInterestRate}
    />
  )
}
