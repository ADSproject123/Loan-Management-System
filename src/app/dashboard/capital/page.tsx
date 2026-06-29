import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { requireMember } from '@/lib/auth/member'
import { createAdminClient } from '@/lib/supabase/admin'
import { predominantCurrency } from '@/lib/currency'
import { getInterestSettings, monthlySavingInterest } from '@/lib/interest'
import { CapitalRequestForm } from './CapitalRequestForm'
import { toNumber } from '@/lib/utils'

export default async function CapitalRequestPage() {
  const member = await requireMember()
  const admin = createAdminClient()

  const { data } = await admin
    .from('savings')
    .select('amount, currency, status')
    .eq('member_id', member.id)

  const savings = data ?? []
  const verifiedSavings = savings.filter(
    (saving) => saving.status === 'verified' || saving.status === 'completed'
  )
  const interestSettings = await getInterestSettings()
  const totalBalance = verifiedSavings.reduce((sum, saving) => sum + toNumber(saving.amount), 0)
  const monthlyInterest = Math.round(
    monthlySavingInterest(totalBalance, interestSettings.monthlySavingInterestRate)
  )
  const currency = predominantCurrency(verifiedSavings)

  return (
    <div className="p-6 md:p-8 w-full">
      <div className="mb-6">
        <Link
          href="/dashboard/savings"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          ត្រឡប់ក្រោយទៅការសន្សំ
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">ការស្នើសុំដកដើមទុន</h1>
      </div>

      <CapitalRequestForm memberSavings={{ totalBalance, monthlyInterest, currency }} />
    </div>
  )
}
