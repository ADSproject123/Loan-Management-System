import Link from 'next/link'
import { ArrowLeft, CreditCard } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { LoanPaymentSchedule } from '@/components/loans/LoanPaymentSchedule'
import { getRepayContext } from './getRepayContext'

export default async function LoanRepayPage() {
  const context = await getRepayContext()

  return (
    <div className="w-full p-6 md:p-8">
      <div className="mb-6">
        <Link
          href="/dashboard/loans"
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          ត្រឡប់ទៅកម្ជី
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">សងកម្ជី</h1>
        <p className="mt-1 text-sm text-gray-500">ជ្រើសរើសខែដើម្បីបង់ប្រាក់សម្រាប់កម្ជីសកម្មរបស់អ្នក</p>
      </div>

      {context ? (
        <Card>
          <LoanPaymentSchedule
            schedule={context.paymentSchedule}
            currency={context.loan.currency}
            showRowPayButton
          />
        </Card>
      ) : (
        <div className="rounded-xl border border-brand-100 bg-brand-50 p-8 text-center">
          <CreditCard className="mx-auto mb-3 h-10 w-10 text-brand-300" />
          <h3 className="mb-2 font-semibold text-brand-900">មិនមានកម្ជីសកម្ម</h3>
          <p className="mb-4 text-sm text-brand-700">
            អ្នកមិនមានកម្ជីសកម្មសម្រាប់ការសងនៅពេលនេះទេ។
          </p>
          <Link
            href="/dashboard/loans"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-950 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
          >
            មើលកម្ជីរបស់ខ្ញុំ
          </Link>
        </div>
      )}
    </div>
  )
}
