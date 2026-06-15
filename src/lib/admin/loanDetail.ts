import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Loan } from '@/types/database'

type LoanMemberSummary = {
  id: string
  full_name: string
  full_name_kh?: string | null
  full_name_en?: string | null
  email: string
  phone?: string | null
}

export type AdminLoanDetailRecord = Loan & {
  members?: LoanMemberSummary | LoanMemberSummary[] | null
  referee?: Pick<LoanMemberSummary, 'id' | 'full_name' | 'full_name_kh' | 'full_name_en' | 'email' | 'phone'> | Pick<LoanMemberSummary, 'id' | 'full_name' | 'full_name_kh' | 'full_name_en' | 'email' | 'phone'>[] | null
  approver?: { id: string; full_name: string } | { id: string; full_name: string }[] | null
}

const LOAN_DETAIL_JOINS = `members:members!loans_member_id_fkey(id, full_name, full_name_kh, email, phone),
      referee:referee_id(id, full_name, full_name_kh, full_name_en, email, phone),
      approver:approved_by(id, full_name)`

const LOAN_DETAIL_BASE = `id, member_id, amount, currency, purpose, term_months, monthly_interest_rate, start_date, status,
      referee_id, referee_verified, support_document_url, hard_copy_submitted, thumbprint_submitted,
      approved_at, disbursed_at, due_date, created_at, updated_at`

const LOAN_DETAIL_SELECT_TIERS = [
  `${LOAN_DETAIL_BASE},
      referee_name, referee_name_kh, referee_name_en, referee_phone, referee_email, rejection_reason, rejected_at,
      ${LOAN_DETAIL_JOINS}`,
  `${LOAN_DETAIL_BASE},
      referee_name, referee_name_kh, referee_name_en, referee_phone, referee_email,
      ${LOAN_DETAIL_JOINS}`,
  `${LOAN_DETAIL_BASE},
      referee_name, referee_phone, referee_email,
      ${LOAN_DETAIL_JOINS}`,
  `${LOAN_DETAIL_BASE},
      ${LOAN_DETAIL_JOINS}`,
  `${LOAN_DETAIL_BASE},
      members:members!loans_member_id_fkey(id, full_name, full_name_kh, email, phone)`,
]

export async function fetchAdminLoanDetail(
  admin: SupabaseClient,
  id: string
): Promise<AdminLoanDetailRecord | null> {
  for (const select of LOAN_DETAIL_SELECT_TIERS) {
    const { data, error } = await admin.from('loans').select(select).eq('id', id).maybeSingle()
    if (!error && data) return data as unknown as AdminLoanDetailRecord
  }

  return null
}
