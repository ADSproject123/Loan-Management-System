import { redirect } from 'next/navigation'

export default function AdminPaymentsRequestsRedirectPage() {
  redirect('/admin/loans/payments?status=pending')
}
