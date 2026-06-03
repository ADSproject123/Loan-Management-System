export type MemberStatus = 'pending' | 'active' | 'suspended' | 'withdrawn' | 'rejected'
export type LoanStatus = 'pending' | 'under_review' | 'approved' | 'active' | 'completed' | 'rejected'
export type CapitalRequestStatus = 'pending' | 'approved' | 'rejected'
export type SavingStatus = 'pending' | 'verified' | 'completed' | 'refunded'
export type CurrencyCode = 'KHR' | 'USD'

export interface Member {
  id: string
  full_name: string
  full_name_kh?: string
  full_name_en?: string
  email: string
  phone?: string
  date_of_birth?: string
  id_number?: string
  resident_book_number?: string
  address?: string
  status: MemberStatus
  auth_user_id?: string
  referee_id?: string
  referee_verified: boolean
  id_document_url?: string
  resident_book_url?: string
  is_admin: boolean
  telegram_chat_id?: string
  suspension_reason?: string | null
  suspended_at?: string | null
  rejection_reason?: string | null
  rejected_at?: string | null
  joined_at: string
  created_at: string
  updated_at: string
}

export interface Saving {
  id: string
  member_id: string
  amount: number
  saving_date: string
  qr_code_ref?: string
  evidence_url?: string
  status: SavingStatus
  notes?: string
  currency?: CurrencyCode
  verified_by?: string
  verified_at?: string
  refund_reason?: string | null
  refunded_at?: string | null
  refunded_by?: string | null
  created_at: string
  updated_at: string
}

export interface Loan {
  id: string
  member_id: string
  amount: number
  purpose?: string
  term_months?: number
  interest_rate?: number
  currency?: CurrencyCode
  status: LoanStatus
  referee_id?: string
  referee_verified: boolean
  support_document_url?: string
  hard_copy_submitted: boolean
  thumbprint_submitted: boolean
  approved_by?: string
  approved_at?: string
  disbursed_at?: string
  due_date?: string
  rejection_reason?: string | null
  rejected_at?: string | null
  created_at: string
  updated_at: string
}

export interface LoanRepayment {
  id: string
  loan_id: string
  member_id: string
  amount: number
  payment_date: string
  qr_code_ref?: string
  evidence_url?: string
  currency?: CurrencyCode
  status: SavingStatus
  verified_by?: string
  verified_at?: string
  created_at: string
  updated_at: string
}

export interface CapitalRequest {
  id: string
  member_id: string
  amount: number
  reason?: string
  currency?: CurrencyCode
  action_after?: CapitalRequestStatus
  continue_saving?: boolean
  remove_membership: boolean
  status: CapitalRequestStatus
  notification_date?: string
  approved_by?: string
  approved_at?: string
  rejection_reason?: string | null
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  member_id: string
  title: string
  message: string
  type: string
  read: boolean
  created_at: string
}

export interface ReportRequest {
  id: string
  member_id: string
  report_type: 'saving' | 'loan'
  period_from: string
  period_to: string
  sent_to_telegram: boolean
  status: 'pending' | 'sent' | 'failed'
  telegram_sent_at?: string
  created_at: string
}
