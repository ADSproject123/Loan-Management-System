import { AdminPanel } from '@/components/admin'
import { formatDateTime } from '@/app/admin/adminUtils'
import { getInterestSettings } from '@/lib/interest'
import { InterestSettingsForm } from '@/app/admin/settings/InterestSettingsForm'

export default async function AdminSettingsPage() {
  const settings = await getInterestSettings()

  return (
    <main>
      <AdminPanel
        title="ការកំណត់អត្រាការប្រាក់"
        description={
          settings.updatedAt
            ? `ធ្វើបច្ចុប្បន្នភាពចុងក្រោយ៖ ${formatDateTime(settings.updatedAt) ?? 'មិនស្គាល់'}`
            : 'អត្រាលំនាំដើមកំពុងប្រើ។'
        }
      >
        <div className="px-6 py-6 md:px-8">
          <InterestSettingsForm
            monthlySavingInterestRate={settings.monthlySavingInterestRate}
            monthlyLoanInterestRate={settings.monthlyLoanInterestRate}
          />
        </div>
      </AdminPanel>
    </main>
  )
}
