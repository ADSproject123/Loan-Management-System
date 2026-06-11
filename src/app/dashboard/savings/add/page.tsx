import { getInterestSettings } from '@/lib/interest'
import { AddSavingForm } from '@/app/dashboard/savings/add/AddSavingForm'

export default async function AddSavingPage() {
  const settings = await getInterestSettings()

  return <AddSavingForm monthlySavingInterestRate={settings.monthlySavingInterestRate} />
}
