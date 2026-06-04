import Link from 'next/link'
import { ArrowLeft, CreditCard } from 'lucide-react'
import { requireMember } from '@/lib/auth/member'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeCurrency } from '@/lib/currency'
import { LoanRepayForm } from './LoanRepayForm'

function toNumber(value: unknown) {
  const numberValue = Number(value ?? 0)
  return Number.isFinite(numberValue) ? numberValue : 0
}

export default async function LoanRepayPage() {
  const member = await requireMember()
  const admin = createAdminClient()

  const [loanResult, repaymentsResult] = await Promise.all([
    admin
      .from('loans')
      .select('id, amount, currency, purpose, term_months, due_date, status, created_at')
      .eq('member_id', member.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('loan_repayments')
      .select('loan_id, amount, status')
      .eq('member_id', member.id),
  ])

  const loan = loanResult.data
  const repayments = repaymentsResult.data ?? []

  const paid = loan
    ? repayments
        .filter(
          (repayment) =>
            repayment.loan_id === loan.id &&
            (repayment.status === 'verified' || repayment.status === 'completed')
        )
        .reduce((sum, repayment) => sum + toNumber(repayment.amount), 0)
    : 0

  const amount = loan ? toNumber(loan.amount) : 0
  const remaining = Math.max(amount - paid, 0)
  const termMonths = loan ? toNumber(loan.term_months) || 12 : 12
  const monthlyPayment = loan ? Math.round(amount / termMonths) : 0

  return (
    <div className="p-6 md:p-8 w-full">
      <div className="mb-6">
        <Link
          href="/dashboard/loans"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          ត្រឡប់ទៅកម្ជី
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">សងកម្ជី</h1>
        <p className="text-gray-500 text-sm mt-1">បង់ប្រាក់សម្រាប់កម្ជីសកម្មរបស់អ្នក</p>
      </div>

      {loan ? (
        <LoanRepayForm
          activeLoan={{
            id: loan.id,
            amount,
            remaining,
            monthly_payment: Math.min(monthlyPayment, remaining) || remaining,
            currency: normalizeCurrency(loan.currency),
            purpose: loan.purpose ?? '',
            due_date: loan.due_date ?? null,
          }}
        />
      ) : (
        <div className="bg-brand-50 border border-brand-100 rounded-xl p-8 text-center">
          <CreditCard className="w-10 h-10 text-brand-300 mx-auto mb-3" />
          <h3 className="font-semibold text-brand-900 mb-2">មិនមានកម្ជីសកម្ម</h3>
          <p className="text-brand-700 text-sm mb-4">
            អ្នកមិនមានកម្ជីសកម្មសម្រាប់ការសងនៅពេលនេះទេ។
          </p>
          <Link
            href="/dashboard/loans"
            className="inline-flex items-center gap-2 bg-brand-950 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-800 transition-colors"
          >
            មើលកម្ជីរបស់ខ្ញុំ
          </Link>
        </div>
      )}
    </div>
  )
}
