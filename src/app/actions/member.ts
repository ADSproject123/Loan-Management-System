'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireActiveMember } from '@/lib/auth/member'
import { uploadPrivateFile } from '@/lib/uploads'

export type ActionResult = {
  success: boolean
  error?: string
}

function asString(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function asNumber(formData: FormData, key: string) {
  const value = Number(asString(formData, key))
  return Number.isFinite(value) ? value : 0
}

function asFile(formData: FormData, key: string) {
  const value = formData.get(key)
  return value instanceof File ? value : null
}

function getAuthUserId(member: { auth_user_id?: string }) {
  if (!member.auth_user_id) throw new Error('Member is not linked to an auth account.')
  return member.auth_user_id
}

export async function registerMember(formData: FormData): Promise<ActionResult> {
  const admin = createAdminClient()

  try {
    const email = asString(formData, 'email').toLowerCase()
    const password = asString(formData, 'password')
    const fullName = asString(formData, 'full_name')
    const phone = asString(formData, 'phone')
    const address = asString(formData, 'address')
    const idNumber = asString(formData, 'id_number')
    const residentBookNumber = asString(formData, 'resident_book_number')
    const refereeEmail = asString(formData, 'referee_email').toLowerCase()

    if (!email || !password || !fullName || !phone || !idNumber) {
      return { success: false, error: 'Please fill in all required fields.' }
    }

    if (password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long.' }
    }

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('Failed to create account.')

    let refereeId: string | null = null
    if (refereeEmail) {
      const { data: referee } = await admin
        .from('members')
        .select('id')
        .eq('email', refereeEmail)
        .eq('status', 'active')
        .maybeSingle()

      refereeId = referee?.id ?? null
    }

    const authUserId = authData.user.id
    const idDocumentUrl = await uploadPrivateFile(
      'member-documents',
      authUserId,
      'id-documents',
      asFile(formData, 'id_document')
    )
    const residentBookUrl = await uploadPrivateFile(
      'member-documents',
      authUserId,
      'resident-books',
      asFile(formData, 'resident_book')
    )

    const { error: memberError } = await admin.from('members').insert({
      auth_user_id: authUserId,
      full_name: fullName,
      email,
      phone,
      address,
      id_number: idNumber,
      resident_book_number: residentBookNumber,
      referee_id: refereeId,
      id_document_url: idDocumentUrl,
      resident_book_url: residentBookUrl,
      status: 'pending',
    })

    if (memberError) throw memberError

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed. Please try again.'
    return { success: false, error: message }
  }
}

export async function addSaving(formData: FormData): Promise<ActionResult> {
  try {
    const member = await requireActiveMember()
    const amount = asNumber(formData, 'amount')
    const notes = asString(formData, 'notes')

    if (amount <= 0) {
      return { success: false, error: 'Please enter a valid saving amount.' }
    }

    const evidenceUrl = await uploadPrivateFile(
      'payment-evidence',
      getAuthUserId(member),
      'savings',
      asFile(formData, 'evidence')
    )

    if (!evidenceUrl) {
      return { success: false, error: 'Please upload payment evidence.' }
    }

    const admin = createAdminClient()
    const { error } = await admin.from('savings').insert({
      member_id: member.id,
      amount,
      notes,
      evidence_url: evidenceUrl,
      qr_code_ref: `SAV-${Date.now()}`,
      status: 'pending',
    })

    if (error) throw error

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/savings')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to submit saving.'
    return { success: false, error: message }
  }
}

export async function requestLoan(formData: FormData): Promise<ActionResult> {
  try {
    const member = await requireActiveMember()
    const amount = asNumber(formData, 'amount')
    const purpose = asString(formData, 'purpose')
    const termMonths = asNumber(formData, 'term_months') || 12
    const refereeEmail = asString(formData, 'referee_email').toLowerCase()

    if (amount <= 0 || !purpose) {
      return { success: false, error: 'Please enter a valid loan amount and purpose.' }
    }

    const admin = createAdminClient()
    let refereeId: string | null = null
    if (refereeEmail) {
      const { data: referee } = await admin
        .from('members')
        .select('id')
        .eq('email', refereeEmail)
        .eq('status', 'active')
        .maybeSingle()

      refereeId = referee?.id ?? null
    }

    const supportDocumentUrl = await uploadPrivateFile(
      'loan-documents',
      getAuthUserId(member),
      'support',
      asFile(formData, 'support_document')
    )

    const { error } = await admin.from('loans').insert({
      member_id: member.id,
      amount,
      purpose,
      term_months: termMonths,
      interest_rate: 2,
      referee_id: refereeId,
      support_document_url: supportDocumentUrl,
      status: 'under_review',
    })

    if (error) throw error

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/loans')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to submit loan request.'
    return { success: false, error: message }
  }
}

export async function repayLoan(formData: FormData): Promise<ActionResult> {
  try {
    const member = await requireActiveMember()
    const amount = asNumber(formData, 'amount')

    if (amount <= 0) {
      return { success: false, error: 'Please enter a valid repayment amount.' }
    }

    const admin = createAdminClient()
    const { data: activeLoan, error: loanError } = await admin
      .from('loans')
      .select('id')
      .eq('member_id', member.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (loanError) throw loanError
    if (!activeLoan) {
      return { success: false, error: 'No active loan found for repayment.' }
    }

    const evidenceUrl = await uploadPrivateFile(
      'payment-evidence',
      getAuthUserId(member),
      'repayments',
      asFile(formData, 'evidence')
    )

    if (!evidenceUrl) {
      return { success: false, error: 'Please upload payment evidence.' }
    }

    const { error } = await admin.from('loan_repayments').insert({
      loan_id: activeLoan.id,
      member_id: member.id,
      amount,
      evidence_url: evidenceUrl,
      qr_code_ref: `REP-${Date.now()}`,
      status: 'pending',
    })

    if (error) throw error

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/loans')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to submit repayment.'
    return { success: false, error: message }
  }
}

export async function requestReport(formData: FormData): Promise<ActionResult> {
  try {
    const member = await requireActiveMember()
    const reportType = asString(formData, 'report_type')
    const periodFrom = asString(formData, 'period_from')
    const periodTo = asString(formData, 'period_to')

    if ((reportType !== 'saving' && reportType !== 'loan') || !periodFrom || !periodTo) {
      return { success: false, error: 'Please select a valid report period.' }
    }

    const admin = createAdminClient()
    const { error } = await admin.from('report_requests').insert({
      member_id: member.id,
      report_type: reportType,
      period_from: periodFrom,
      period_to: periodTo,
      sent_to_telegram: false,
      status: 'pending',
    })

    if (error) throw error

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to request report.'
    return { success: false, error: message }
  }
}

export async function requestCapitalWithdrawal(formData: FormData): Promise<ActionResult> {
  try {
    const member = await requireActiveMember()
    const amount = asNumber(formData, 'amount')
    const reason = asString(formData, 'reason')
    const afterDecision = asString(formData, 'after_decision')

    if (amount <= 0 || !reason || (afterDecision !== 'continue' && afterDecision !== 'withdraw')) {
      return { success: false, error: 'Please complete the capital request form.' }
    }

    const admin = createAdminClient()
    const { error } = await admin.from('capital_requests').insert({
      member_id: member.id,
      amount,
      reason,
      continue_saving: afterDecision === 'continue',
      remove_membership: afterDecision === 'withdraw',
      status: 'pending',
    })

    if (error) throw error

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to submit capital request.'
    return { success: false, error: message }
  }
}
