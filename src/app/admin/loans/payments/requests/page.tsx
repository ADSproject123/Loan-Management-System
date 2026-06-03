import { redirect } from 'next/navigation'

export default function AdminLoansPaymentsRequestsRedirectPage() {
  redirect('/admin/loans/payments?status=pending')
}
