import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { formatKhmerDate } from '@/lib/dates'
import { LoanPaymentSchedule } from '@/components/loans/LoanPaymentSchedule'
import { LoanRepayForm } from '../LoanRepayForm'
import { getRepayContext } from '../getRepayContext'

interface PageProps {
  params: Promise<{ month: string }>
}

export default async function LoanRepayMonthPage({ params }: PageProps) {
  const { month } = await params
  const monthNumber = Number(month)

  if (!Number.isInteger(monthNumber) || monthNumber < 1) notFound()

  const context = await getRepayContext()
  if (!context) redirect('/dashboard/loans/repay')

  const scheduleRow = context.paymentSchedule.find((row) => row.month === monthNumber)
  if (!scheduleRow) notFound()

  const dueForMonth = Math.max(
    scheduleRow.amount - scheduleRow.paidAmount - scheduleRow.pendingAmount,
    0
  )
  if (dueForMonth <= 0 || scheduleRow.pendingAmount > 0) redirect('/dashboard/loans/repay')

  return (
    <div className="w-full p-6 md:p-8">
      <div className="mb-6">
        <Link
          href="/dashboard/loans/repay"
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          ត្រឡប់ក្រោយ
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">បង់ប្រាក់ខែ {monthNumber}</h1>
        <p className="mt-1 text-sm text-gray-500">
          កាលបរិច្ឆេទត្រូវបង់{' '}
          {scheduleRow.dueDate ? formatKhmerDate(scheduleRow.dueDate) : 'មិនកំណត់'}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        {/* Schedule table */}
        <Card>
          <LoanPaymentSchedule
            schedule={context.paymentSchedule}
            currency={context.loan.currency}
            showRowPayButton
          />
        </Card>

        {/* Repay form */}
        <div>
          <LoanRepayForm
            activeLoan={{
              id: context.loan.id,
              amount: context.loan.amount,
              remaining: context.remaining,
              monthly_payment: dueForMonth,
              currency: context.loan.currency,
              purpose: context.loan.purpose,
              due_date: context.loan.due_date,
            }}
            scheduleMonth={monthNumber}
            defaultAmount={dueForMonth}
          />
        </div>
      </div>
    </div>
  )
}
