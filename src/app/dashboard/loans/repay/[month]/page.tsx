import { notFound, redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ month: string }>
}

export default async function LoanRepayMonthPage({ params }: PageProps) {
  const { month } = await params
  const monthNumber = Number(month)

  if (!Number.isInteger(monthNumber) || monthNumber < 1) notFound()

  redirect(`/dashboard/loans/repay?month=${monthNumber}`)
}
