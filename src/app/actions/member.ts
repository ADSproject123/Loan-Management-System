'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireActiveMember } from '@/lib/auth/member'
import { uploadPrivateFile } from '@/lib/uploads'
import { MIN_SAVING_AMOUNT, normalizeCurrency } from '@/lib/currency'
import { fetchMemberLoanInterestRate, getInterestSettings } from '@/lib/interest'
import { fetchMemberLoanEligibility, validateLoanRequestAmount } from '@/lib/loanEligibility'

export type ActionResult = {
  success: boolean
  error?: string
  redirectTo?: string
}

export type MemberSearchResult = {
  id: string
  full_name_kh: string | null
  full_name_en: string | null
  phone: string | null
  email: string | null
}

function escapeIlikePattern(value: string) {
  return value.replace(/[%_,]/g, (char) => `\\${char}`)
}

export async function searchActiveMembers(query: string): Promise<MemberSearchResult[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  const pattern = `%${escapeIlikePattern(trimmed)}%`
  const admin = createAdminClient()
  const { data } = await admin
    .from('members')
    .select('id, full_name, full_name_kh, full_name_en, phone, email')
    .eq('status', 'active')
    .eq('is_admin', false)
    .or(
      `full_name_kh.ilike.${pattern},full_name_en.ilike.${pattern},full_name.ilike.${pattern},phone.ilike.${pattern},email.ilike.${pattern}`
    )
    .limit(8)

  return (data ?? []).map((member) => ({
    id: member.id,
    full_name_kh: member.full_name_kh ?? member.full_name,
    full_name_en: member.full_name_en ?? member.full_name,
    phone: member.phone ?? null,
    email: member.email ?? null,
  }))
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
  if (!member.auth_user_id) throw new Error('សមាជិកមិនត្រូវបានភ្ជាប់ជាមួយគណនីចូល។')
  return member.auth_user_id
}

function actionErrorMessage(error: unknown, fallback: string) {
  const raw =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message: unknown }).message)
      : error instanceof Error
        ? error.message
        : ''

  if (!raw) return fallback

  if (
    raw.includes('referee_name') ||
    raw.includes('referee_name_kh') ||
    raw.includes('referee_name_en') ||
    raw.includes('referee_phone') ||
    raw.includes('referee_email')
  ) {
    return 'មូលដ្ឋានទិន្នន័យមិនទាន់ធ្វើបច្ចុប្បន្នភាពសម្រាប់ព័ត៌មានអ្នកធានា។ សូមដំណើរការ migrations អ្នកធានាក្នុង Supabase។'
  }

  if (raw.includes('start_date') || raw.includes('end_date')) {
    return 'មូលដ្ឋានទិន្នន័យមិនទាន់ធ្វើបច្ចុប្បន្នភាពសម្រាប់កាលបរិច្ឆេទកម្ជី។ សូមដំណើរការ migration 014_loan_term_dates.sql ក្នុង Supabase។'
  }

  if (raw.includes('loan_interest_plan') || raw.includes('loan_interest_plan_id')) {
    return 'មូលដ្ឋានទិន្នន័យមិនទាន់ធ្វើបច្ចុប្បន្នភាពសម្រាប់អត្រាកម្ជីជាក្រុម។ សូមដំណើរការ migration 018_loan_interest_plans.sql ក្នុង Supabase។'
  }

  if (raw.includes('monthly_interest_rate') || raw.includes('interest_settings')) {
    return 'មូលដ្ឋានទិន្នន័យមិនទាន់ធ្វើបច្ចុប្បន្នភាពសម្រាប់អត្រាការប្រាក់។ សូមដំណើរការ migration 015_interest_settings.sql ក្នុង Supabase។'
  }

  return raw
}

/** Whole months between two YYYY-MM-DD dates, floored, minimum 1. */
function monthsBetween(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  let months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth())
  if (e.getDate() < s.getDate()) months -= 1
  return Math.max(1, months)
}

export type RegisterResult = ActionResult & { connectToken?: string }

export async function registerMember(formData: FormData): Promise<RegisterResult> {
  const admin = createAdminClient()

  try {
    const email = asString(formData, 'email').toLowerCase()
    const password = asString(formData, 'password')
    const fullNameKh = asString(formData, 'full_name_kh')
    const fullNameEn = asString(formData, 'full_name_en')
    const phone = asString(formData, 'phone')
    const dateOfBirth = asString(formData, 'date_of_birth')
    const address = asString(formData, 'address')
    const idNumber = asString(formData, 'id_number')
    const residentBookNumber = asString(formData, 'resident_book_number')
    const workplace = asString(formData, 'workplace') || null
    const emergencyContactsRaw = asString(formData, 'emergency_contacts')
    const emergencyContacts: { full_name: string; phone: string }[] = emergencyContactsRaw
      ? JSON.parse(emergencyContactsRaw)
      : []
    const refereeId = asString(formData, 'referee_id') || null

    if (!phone || !password || !fullNameKh || !fullNameEn || !dateOfBirth || !idNumber) {
      return { success: false, error: 'សូមបំពេញគ្រប់វាលទាំងអស់ដែលត្រូវការ។' }
    }

    // Supabase Auth requires an email; synthesize one from phone when none is provided.
    const authEmail = email || `${phone.replace(/\D/g, '')}@member.local`

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      return { success: false, error: 'សូមបញ្ចូលថ្ងៃខែឆ្នាំកំណើតត្រឹមត្រូវ។' }
    }

    if (dateOfBirth > new Date().toISOString().slice(0, 10)) {
      return { success: false, error: 'ថ្ងៃខែឆ្នាំកំណើតមិនអាចនៅពេលអនាគតបានទេ។' }
    }

    const fullName = `${fullNameKh} | ${fullNameEn}`

    if (password.length < 8) {
      return { success: false, error: 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៨ តួអក្សរ។' }
    }

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: authEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, full_name_kh: fullNameKh, full_name_en: fullNameEn },
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('បង្កើតគណនីបរាជ័យ។')

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

    // One-time token the member uses to link their Telegram chat. The bot's
    // /start deep link carries this token; the webhook maps it back to this row.
    const connectToken = crypto.randomUUID()

    const { error: memberError } = await admin.from('members').insert({
      auth_user_id: authUserId,
      full_name: fullName,
      full_name_kh: fullNameKh,
      full_name_en: fullNameEn,
      email: email || null,
      phone,
      date_of_birth: dateOfBirth,
      address,
      id_number: idNumber,
      resident_book_number: residentBookNumber,
      workplace,
      referee_id: refereeId,
      referee_verified: Boolean(refereeId),
      id_document_url: idDocumentUrl,
      resident_book_url: residentBookUrl,
      emergency_contacts: emergencyContacts,
      telegram_connect_token: connectToken,
      status: 'pending',
    })

    if (memberError) throw memberError

    return { success: true, connectToken }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ការចុះឈ្មោះបរាជ័យ។ សូមព្យាយាមម្តងទៀត។'
    return { success: false, error: message }
  }
}

/**
 * Polled by the registration screen (user not yet logged in) to detect when the
 * Telegram webhook has linked their chat. The webhook keeps the token in place
 * (linking is idempotent), so we look the row up by token and report whether a
 * chat id has been captured yet.
 */
export async function checkTelegramConnected(connectToken: string): Promise<boolean> {
  if (!connectToken) return false
  const admin = createAdminClient()
  const { data } = await admin
    .from('members')
    .select('telegram_chat_id')
    .eq('telegram_connect_token', connectToken)
    .maybeSingle()

  return Boolean(data?.telegram_chat_id)
}

export async function addSaving(formData: FormData): Promise<ActionResult> {
  try {
    const member = await requireActiveMember()

    const amount = asNumber(formData, 'amount')
    const notes = asString(formData, 'notes')
    const currency = normalizeCurrency(asString(formData, 'currency'))

    if (amount < MIN_SAVING_AMOUNT) {
      return {
        success: false,
        error: `ចំនួនទឹកប្រាក់សន្សំអប្បបរមាគឺ $${MIN_SAVING_AMOUNT}។`,
      }
    }

    const evidenceUrl = await uploadPrivateFile(
      'payment-evidence',
      getAuthUserId(member),
      'savings',
      asFile(formData, 'evidence')
    )

    if (!evidenceUrl) {
      return { success: false, error: 'សូមផ្ទុកភស្តុតាងបង់ប្រាក់។' }
    }

    const admin = createAdminClient()
    const { error } = await admin.from('savings').insert({
      member_id: member.id,
      amount,
      notes,
      currency,
      evidence_url: evidenceUrl,
      qr_code_ref: `SAV-${Date.now()}`,
      status: 'pending',
    })

    if (error) throw error

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/savings')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'មិនអាចដាក់ស្នើការសន្សំបានទេ។'
    return { success: false, error: message }
  }
}

export async function requestLoan(formData: FormData): Promise<ActionResult> {
  try {
    const member = await requireActiveMember()

    const amount = asNumber(formData, 'amount')
    const purpose = asString(formData, 'purpose')
    const startDate = asString(formData, 'start_date')
    const endDate = asString(formData, 'end_date')
    const refereeNameKh = asString(formData, 'referee_name_kh')
    const refereeNameEn = asString(formData, 'referee_name_en')
    const refereePhone = asString(formData, 'referee_phone')
    const refereeEmail = asString(formData, 'referee_email').toLowerCase()
    const currency = normalizeCurrency(asString(formData, 'currency'))

    if (amount <= 0 || !purpose) {
      return { success: false, error: 'សូមបញ្ចូលចំនួនទឹកប្រាក់កម្ជី និង គោលបំណងត្រឹមត្រូវ។' }
    }

    if (!refereeNameKh || !refereeNameEn || !refereePhone) {
      return {
        success: false,
        error: 'សូមបញ្ចូលឈ្មោះអ្នកធានា (ខ្មែរ និង អង់គ្លេស) និង លេខទូរស័ព្ទត្រឹមត្រូវ។',
      }
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(endDate) ||
      endDate <= startDate
    ) {
      return { success: false, error: 'សូមជ្រើសរើសកាលបរិច្ឆេទចាប់ផ្តើម និង បញ្ចប់នៃកម្ជីត្រឹមត្រូវ។' }
    }

    const termMonths = monthsBetween(startDate, endDate)

    const admin = createAdminClient()
    const eligibility = await fetchMemberLoanEligibility(admin, member.id)
    const amountCheck = validateLoanRequestAmount(amount, eligibility)
    if (!amountCheck.valid) {
      return { success: false, error: amountCheck.error }
    }

    let refereeId: string | null = null
    if (refereeEmail) {
      const { data: referee } = await admin
        .from('members')
        .select('id')
        .eq('email', refereeEmail)
        .eq('status', 'active')
        .eq('is_admin', false)
        .maybeSingle()

      refereeId = referee?.id ?? null
    }

    const interestSettings = await getInterestSettings()
    const loanInterestRate = await fetchMemberLoanInterestRate(
      member.id,
      interestSettings.monthlyLoanInterestRate
    )

    const { error } = await admin.from('loans').insert({
      member_id: member.id,
      amount,
      currency,
      purpose,
      term_months: termMonths,
      monthly_interest_rate: loanInterestRate,
      start_date: startDate,
      end_date: endDate,
      referee_id: refereeId,
      referee_name: refereeNameEn,
      referee_name_kh: refereeNameKh,
      referee_name_en: refereeNameEn,
      referee_phone: refereePhone,
      referee_email: refereeEmail || null,
      status: 'under_review',
    })

    if (error) {
      return {
        success: false,
        error: actionErrorMessage(error, 'មិនអាចដាក់ស្នើពាក្យសុំកម្ជីបានទេ។'),
      }
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/loans')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: actionErrorMessage(error, 'មិនអាចដាក់ស្នើពាក្យសុំកម្ជីបានទេ។'),
    }
  }
}

export async function repayLoan(formData: FormData): Promise<ActionResult> {
  try {
    const member = await requireActiveMember()

    const amount = asNumber(formData, 'amount')
    const currency = normalizeCurrency(asString(formData, 'currency'))

    if (amount <= 0) {
      return { success: false, error: 'សូមបញ្ចូលចំនួនទឹកប្រាក់សងត្រឹមត្រូវ។' }
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
      return { success: false, error: 'រកមិនឃើញកម្ជីសកម្មសម្រាប់ការសង។' }
    }

    const evidenceUrl = await uploadPrivateFile(
      'payment-evidence',
      getAuthUserId(member),
      'repayments',
      asFile(formData, 'evidence')
    )

    if (!evidenceUrl) {
      return { success: false, error: 'សូមផ្ទុកភស្តុតាងបង់ប្រាក់។' }
    }

    const { error } = await admin.from('loan_repayments').insert({
      loan_id: activeLoan.id,
      member_id: member.id,
      amount,
      currency,
      evidence_url: evidenceUrl,
      qr_code_ref: `REP-${Date.now()}`,
      status: 'pending',
    })

    if (error) throw error

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/loans')
    revalidatePath('/dashboard/loans/repay')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'មិនអាចដាក់ស្នើការសងបានទេ។'
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
      return { success: false, error: 'សូមជ្រើសរើសរយៈពេលរបាយការណ៍ត្រឹមត្រូវ។' }
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
    const message = error instanceof Error ? error.message : 'មិនអាចស្នើសុំរបាយការណ៍បានទេ។'
    return { success: false, error: message }
  }
}

export async function requestCapitalWithdrawal(formData: FormData): Promise<ActionResult> {
  try {
    const member = await requireActiveMember()

    const amount = asNumber(formData, 'amount')
    const reason = asString(formData, 'reason')
    const afterDecision = asString(formData, 'after_decision')
    const currency = normalizeCurrency(asString(formData, 'currency'))

    if (amount <= 0 || !reason || (afterDecision !== 'continue' && afterDecision !== 'withdraw')) {
      return { success: false, error: 'សូមបំពេញបែបបទស្នើសុំដើមទុនឱ្យបានពេញលេញ។' }
    }

    const admin = createAdminClient()
    const { error } = await admin.from('capital_requests').insert({
      member_id: member.id,
      amount,
      currency,
      reason,
      continue_saving: afterDecision === 'continue',
      remove_membership: afterDecision === 'withdraw',
      status: 'pending',
    })

    if (error) throw error

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'មិនអាចដាក់ស្នើពាក្យសុំដើមទុនបានទេ។'
    return { success: false, error: message }
  }
}
