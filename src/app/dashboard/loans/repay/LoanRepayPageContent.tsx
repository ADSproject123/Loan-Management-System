'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { LoanPaymentSchedule } from '@/components/loans/LoanPaymentSchedule'
import { LoanRepayModal } from '@/components/loans/LoanRepayModal'
import type { RepayContext } from '@/app/dashboard/loans/repay/getRepayContext'
import type { LoanScheduleRow } from '@/lib/interestCalculations'

function getDueForMonth(row: LoanScheduleRow) {
  return Math.max(row.amount - row.paidAmount - row.pendingAmount, 0)
}

function canPayMonth(row: LoanScheduleRow) {
  return row.status !== 'paid' && row.pendingAmount <= 0 && getDueForMonth(row) > 0
}

export function LoanRepayPageContent({ context }: { context: RepayContext }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [payMonth, setPayMonth] = useState<number | null>(null)

  useEffect(() => {
    const monthParam = searchParams.get('month')
    if (!monthParam) return

    const monthNumber = Number(monthParam)
    if (!Number.isInteger(monthNumber) || monthNumber < 1) return

    const row = context.paymentSchedule.find((scheduleRow) => scheduleRow.month === monthNumber)
    if (!row || !canPayMonth(row)) return

    setPayMonth(monthNumber)
    router.replace('/dashboard/loans/repay', { scroll: false })
  }, [context.paymentSchedule, router, searchParams])

  const selectedRow = useMemo(
    () => (payMonth ? context.paymentSchedule.find((row) => row.month === payMonth) : null),
    [context.paymentSchedule, payMonth]
  )

  const dueForMonth = selectedRow ? getDueForMonth(selectedRow) : 0

  const handlePayMonth = (month: number) => {
    const row = context.paymentSchedule.find((scheduleRow) => scheduleRow.month === month)
    if (!row || !canPayMonth(row)) return
    setPayMonth(month)
  }

  const handleCloseModal = () => {
    setPayMonth(null)
    router.refresh()
  }

  return (
    <>
      <Card>
        <LoanPaymentSchedule
          schedule={context.paymentSchedule}
          currency={context.loan.currency}
          showRowPayButton
          onPayMonth={handlePayMonth}
        />
      </Card>

      {payMonth && selectedRow && dueForMonth > 0 ? (
        <LoanRepayModal
          open
          onClose={handleCloseModal}
          scheduleMonth={payMonth}
          dueDate={selectedRow.dueDate}
          dueAmount={dueForMonth}
          activeLoan={{
            id: context.loan.id,
            amount: context.loan.amount,
            remaining: context.remaining,
            monthly_payment: dueForMonth,
            currency: context.loan.currency,
            purpose: context.loan.purpose,
            due_date: context.loan.due_date,
          }}
        />
      ) : null}
    </>
  )
}
