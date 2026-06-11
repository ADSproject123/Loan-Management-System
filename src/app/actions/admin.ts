'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/member'
import type { ActionResult } from '@/app/actions/member'
import { formatMoney } from '@/lib/currency'
import { sendTelegramMessage } from '@/lib/telegram'
function idFrom(formData: FormData) {
  const id = formData.get('id')
  if (typeof id !== 'string' || !id) {
    throw new Error('បាត់លេខសម្គាល់កំណត់ត្រា។')
  }
  return id
}

async function notify(memberId: string, title: string, message: string) {
  const admin = createAdminClient()
  await admin.from('notifications').insert({
    member_id: memberId,
    title,
    message,
    type: 'info',
  })

  // Mirror the in-app notification to Telegram when the member has linked their
  // chat. Best-effort: sendTelegramMessage never throws, so a Telegram failure
  // can't roll back the admin action that triggered this.
  const { data: member } = await admin
    .from('members')
    .select('telegram_chat_id')
    .eq('id', memberId)
    .maybeSingle()

  if (member?.telegram_chat_id) {
    await sendTelegramMessage(member.telegram_chat_id, `<b>${title}</b>\n${message}`)
  }
}

const MEMBER_ROLES = ['founder', 'comember', 'member'] as const
type MemberRoleValue = (typeof MEMBER_ROLES)[number]

const MEMBER_ROLE_LABELS: Record<MemberRoleValue, string> = {
  founder: 'Founder',
  comember: 'Co-member',
  member: 'Member',
}

function roleFrom(formData: FormData): MemberRoleValue {
  const role = formData.get('role')
  return MEMBER_ROLES.includes(role as MemberRoleValue) ? (role as MemberRoleValue) : 'member'
}

export async function approveMember(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin()
    const id = idFrom(formData)
    const role = roleFrom(formData)
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('members')
      .update({
        status: 'active',
        role,
        suspension_reason: null,
        suspended_at: null,
        rejection_reason: null,
        rejected_at: null,
      })
      .eq('id', id)
      .select('id')
      .single()

    if (error) throw error
    await notify(data.id, 'គណនីត្រូវបានទទួលយក', 'គណនីសន្សំរបស់អ្នកឥឡូវនេះកំពុងដំណើរការ។')
    revalidatePath('/admin')
    revalidatePath('/admin/members')
    revalidatePath('/admin/members/requests')
    revalidatePath(`/admin/members/${id}`)
    revalidatePath('/pending-approval')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'មិនអាចទទួលយកសមាជិកបានទេ។' }
  }
}

export async function updateMemberRole(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin()
    const id = idFrom(formData)
    const role = roleFrom(formData)
    const admin = createAdminClient()
    const { error } = await admin.from('members').update({ role }).eq('id', id)

    if (error) throw error
    await notify(
      id,
      'តួនាទីត្រូវបានធ្វើបច្ចុប្បន្នភាព',
      `តួនាទីរបស់អ្នកត្រូវបានកំណត់ជា ${MEMBER_ROLE_LABELS[role]}។`
    )
    revalidatePath('/admin/members')
    revalidatePath(`/admin/members/${id}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'មិនអាចប្តូរតួនាទីបានទេ។' }
  }
}

export async function suspendMember(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin()
    const id = idFrom(formData)
    const reason = formData.get('reason')
    if (typeof reason !== 'string' || reason.trim().length < 5) {
      return { success: false, error: 'សូមបញ្ចូលមូលហេតុផ្អាកយ៉ាងតិច ៥ តួអក្សរ។' }
    }
    const trimmedReason = reason.trim()
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('members')
      .update({
        status: 'suspended',
        suspension_reason: trimmedReason,
        suspended_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id')
      .single()

    if (error) throw error

    await notify(
      data.id,
      'គណនីត្រូវបានផ្អាក',
      `គណនីរបស់អ្នកត្រូវបានផ្អាក។ មូលហេតុ៖ ${trimmedReason}`
    )

    revalidatePath('/admin')
    revalidatePath('/admin/members')
    revalidatePath('/admin/members/requests')
    revalidatePath(`/admin/members/${id}`)
    revalidatePath('/pending-approval')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'មិនអាចផ្អាកសមាជិកបានទេ។' }
  }
}

export async function denyMember(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin()
    const id = idFrom(formData)
    const reason = formData.get('reason')
    if (typeof reason !== 'string' || reason.trim().length < 5) {
      return { success: false, error: 'សូមបញ្ចូលមូលហេតុបដិសេធយ៉ាងតិច ៥ តួអក្សរ។' }
    }
    const trimmedReason = reason.trim()
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('members')
      .update({
        status: 'rejected',
        rejection_reason: trimmedReason,
        rejected_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id')
      .single()

    if (error) throw error

    await notify(
      data.id,
      'ការចុះឈ្មោះត្រូវបានបដិសេធ',
      `ការចុះឈ្មោះរបស់អ្នកមិនត្រូវបានទទួលយកទេ។ មូលហេតុ៖ ${trimmedReason}`
    )

    revalidatePath('/admin')
    revalidatePath('/admin/members')
    revalidatePath('/admin/members/requests')
    revalidatePath(`/admin/members/${id}`)
    revalidatePath('/pending-approval')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'មិនអាចបដិសេធសមាជិកបានទេ។' }
  }
}

export async function approveSaving(formData: FormData): Promise<ActionResult> {
  try {
    const approver = await requireAdmin()
    const id = idFrom(formData)
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('savings')
      .update({
        status: 'completed',
        verified_by: approver.id,
        verified_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'pending')
      .select('member_id, amount, currency')
      .maybeSingle()

    if (error) throw error
    if (!data) {
      return { success: false, error: 'សំណើនេះមិនអាចទទួលបានទេ ឬត្រូវបានដំណើរការរួចហើយ។' }
    }
    await notify(
      data.member_id,
      'ការសន្សំត្រូវបានទទួល',
      `ការសន្សំរបស់អ្នកចំនួន ${formatMoney(data.amount, data.currency ?? 'USD')} ត្រូវបានទទួលដោយជោគជ័យ។`
    )
    revalidatePath('/admin')
    revalidatePath('/admin/savings')
    revalidatePath('/admin/savings/requests')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/savings')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'មិនអាចទទួលការសន្សំបានទេ។' }
  }
}

/** @deprecated Use approveSaving */
export async function verifySaving(formData: FormData): Promise<ActionResult> {
  return approveSaving(formData)
}

/** @deprecated Use approveSaving */
export async function acceptSaving(formData: FormData): Promise<ActionResult> {
  return approveSaving(formData)
}

export async function refundSaving(formData: FormData): Promise<ActionResult> {
  try {
    const approver = await requireAdmin()
    const id = idFrom(formData)
    const reason = formData.get('reason')
    if (typeof reason !== 'string' || reason.trim().length < 5) {
      return { success: false, error: 'សូមបញ្ចូលមូលហេតុសងប្រាក់វិញយ៉ាងតិច ៥ តួអក្សរ។' }
    }
    const trimmedReason = reason.trim()
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('savings')
      .update({
        status: 'refunded',
        refund_reason: trimmedReason,
        refunded_at: new Date().toISOString(),
        refunded_by: approver.id,
      })
      .eq('id', id)
      .eq('status', 'pending')
      .select('member_id, amount, currency')
      .maybeSingle()

    if (error) throw error
    if (!data) {
      return { success: false, error: 'សំណើនេះមិនអាចសងប្រាក់វិញបានទេ ឬត្រូវបានដំណើរការរួចហើយ។' }
    }
    await notify(
      data.member_id,
      'ការសន្សំត្រូវបានសងប្រាក់វិញ',
      `ការសន្សំចំនួន ${formatMoney(data.amount, data.currency ?? 'USD')} ត្រូវបានសងប្រាក់វិញ។ មូលហេតុ៖ ${trimmedReason}`
    )
    revalidatePath('/admin')
    revalidatePath('/admin/savings')
    revalidatePath('/admin/savings/requests')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/savings')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'មិនអាចសងប្រាក់វិញបានទេ។',
    }
  }
}

export async function verifyRepayment(formData: FormData): Promise<ActionResult> {
  try {
    const approver = await requireAdmin()
    const id = idFrom(formData)
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('loan_repayments')
      .update({ status: 'completed', verified_by: approver.id, verified_at: new Date().toISOString() })
      .eq('id', id)
      .select('member_id, amount, currency')
      .single()

    if (error) throw error
    await notify(data.member_id, 'ការសងត្រូវបានទទួល', `ការសងរបស់អ្នកចំនួន ${formatMoney(data.amount, data.currency ?? 'USD')} ត្រូវបានទទួល។`)
    revalidatePath('/admin')
    revalidatePath('/admin/loans/payments')
    revalidatePath('/admin/loans/payments/requests')
    revalidatePath('/admin/payments')
    revalidatePath('/admin/payments/requests')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/loans')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'មិនអាចទទួលការសងបានទេ។' }
  }
}

export async function approveLoan(formData: FormData): Promise<ActionResult> {
  try {
    const approver = await requireAdmin()
    const id = idFrom(formData)
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('loans')
      .update({ status: 'approved', approved_by: approver.id, approved_at: new Date().toISOString() })
      .eq('id', id)
      .select('member_id, amount, currency')
      .single()

    if (error) throw error
    await notify(data.member_id, 'កម្ជីត្រូវបានទទួលយក', `ការស្នើសុំកម្ជីរបស់អ្នកចំនួន ${formatMoney(data.amount, data.currency ?? 'USD')} ត្រូវបានទទួលយក។ សូមដាក់ស្នើឯកសារច្បាប់ដើមមុនការបើកប្រាក់។`)
    revalidatePath('/admin')
    revalidatePath('/admin/loans')
    revalidatePath('/admin/loans/requests')
    revalidatePath('/admin/loans/active')
    revalidatePath(`/admin/loans/${id}`)
    revalidatePath('/dashboard/loans')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'មិនអាចទទួលយកកម្ជីបានទេ។' }
  }
}

export async function activateLoan(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin()
    const id = idFrom(formData)
    const admin = createAdminClient()

    // Honor the member's chosen end date as the due date; fall back to the term
    // length (or 12 months) for older loans that predate the date range.
    const { data: loan } = await admin
      .from('loans')
      .select('end_date, term_months')
      .eq('id', id)
      .maybeSingle()

    let dueDate: string
    if (loan?.end_date) {
      dueDate = loan.end_date
    } else {
      const d = new Date()
      d.setMonth(d.getMonth() + (loan?.term_months ?? 12))
      dueDate = d.toISOString().slice(0, 10)
    }

    const { data, error } = await admin
      .from('loans')
      .update({
        status: 'active',
        hard_copy_submitted: true,
        thumbprint_submitted: true,
        disbursed_at: new Date().toISOString(),
        due_date: dueDate,
      })
      .eq('id', id)
      .select('member_id, amount, currency')
      .single()

    if (error) throw error
    await notify(data.member_id, 'កម្ជីត្រូវបានបើក', `កម្ជីរបស់អ្នកចំនួន ${formatMoney(data.amount, data.currency ?? 'USD')} ត្រូវបានសម្គាល់ថាសកម្ម។`)
    revalidatePath('/admin')
    revalidatePath('/admin/loans')
    revalidatePath('/admin/loans/requests')
    revalidatePath('/admin/loans/active')
    revalidatePath(`/admin/loans/${id}`)
    revalidatePath('/dashboard/loans')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'មិនអាចដំណើរការកម្ជីបានទេ។' }
  }
}

export async function rejectLoan(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin()
    const id = idFrom(formData)
    const reason = formData.get('reason')
    if (typeof reason !== 'string' || reason.trim().length < 5) {
      return { success: false, error: 'សូមបញ្ចូលមូលហេតុបដិសេធយ៉ាងតិច ៥ តួអក្សរ។' }
    }
    const trimmedReason = reason.trim()
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('loans')
      .update({
        status: 'rejected',
        rejection_reason: trimmedReason,
        rejected_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('member_id')
      .single()

    if (error) throw error
    await notify(
      data.member_id,
      'កម្ជីត្រូវបានបដិសេធ',
      `ការស្នើសុំកម្ជីរបស់អ្នកមិនត្រូវបានទទួលយកទេ។ មូលហេតុ៖ ${trimmedReason}`
    )
    revalidatePath('/admin')
    revalidatePath('/admin/loans')
    revalidatePath('/admin/loans/requests')
    revalidatePath('/admin/loans/active')
    revalidatePath(`/admin/loans/${id}`)
    revalidatePath('/dashboard/loans')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'មិនអាចបដិសេធកម្ជីបានទេ។' }
  }
}

export async function decideCapitalRequest(formData: FormData): Promise<ActionResult> {
  try {
    const approver = await requireAdmin()
    const id = idFrom(formData)
    const decision = formData.get('decision') === 'approved' ? 'approved' : 'rejected'
    let trimmedReason: string | null = null

    if (decision === 'rejected') {
      const reason = formData.get('reason')
      if (typeof reason !== 'string' || reason.trim().length < 5) {
        return { success: false, error: 'សូមបញ្ចូលមូលហេតុបដិសេធយ៉ាងតិច ៥ តួអក្សរ។' }
      }
      trimmedReason = reason.trim()
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('capital_requests')
      .update({
        status: decision,
        approved_by: approver.id,
        approved_at: new Date().toISOString(),
        rejection_reason: decision === 'rejected' ? trimmedReason : null,
      })
      .eq('id', id)
      .select('member_id, amount, currency')
      .single()

    if (error) throw error
    const decisionLabel = decision === 'approved' ? 'បានទទួលយក' : 'បានបដិសេធ'
    const message =
      decision === 'rejected' && trimmedReason
        ? `ការស្នើសុំដើមទុនរបស់អ្នកចំនួន ${formatMoney(data.amount, data.currency ?? 'USD')} ${decisionLabel}។ មូលហេតុ៖ ${trimmedReason}`
        : `ការស្នើសុំដើមទុនរបស់អ្នកចំនួន ${formatMoney(data.amount, data.currency ?? 'USD')} ${decisionLabel}។`
    await notify(data.member_id, 'ការស្នើសុំដើមទុនត្រូវបានធ្វើបច្ចុប្បន្នភាព', message)
    revalidatePath('/admin')
    revalidatePath('/admin/savings/capital')
    revalidatePath('/admin/capital')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'មិនអាចធ្វើបច្ចុប្បន្នភាពការស្នើសុំដើមទុនបានទេ។' }
  }
}

function parseInterestRate(formData: FormData, field: string) {
  const raw = formData.get(field)
  const value = typeof raw === 'string' ? Number(raw) : NaN
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error('សូមបញ្ចូលអត្រាការប្រាក់ពី ០ ដល់ ១០០ ភាគរយ។')
  }
  return Math.round(value * 100) / 100
}

export async function updateInterestSettings(formData: FormData): Promise<ActionResult> {
  try {
    const adminMember = await requireAdmin()
    const monthlySavingInterestRate = parseInterestRate(formData, 'monthly_saving_interest_rate')
    const monthlyLoanInterestRate = parseInterestRate(formData, 'monthly_loan_interest_rate')

    const admin = createAdminClient()
    const { error } = await admin
      .from('interest_settings')
      .update({
        monthly_saving_interest_rate: monthlySavingInterestRate,
        monthly_loan_interest_rate: monthlyLoanInterestRate,
        updated_at: new Date().toISOString(),
        updated_by: adminMember.id,
      })
      .eq('id', 1)

    if (error) throw error

    revalidatePath('/admin/settings')
    revalidatePath('/admin/settings/loan-plans')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/savings')
    revalidatePath('/dashboard/savings/add')
    revalidatePath('/dashboard/loans')
    revalidatePath('/dashboard/loans/request')
    revalidatePath('/dashboard/loans/repay')
    revalidatePath('/dashboard/capital')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'មិនអាចរក្សាទុកការកំណត់បានទេ។',
    }
  }
}

function optionalText(formData: FormData, field: string) {
  const raw = formData.get(field)
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  return trimmed.length > 0 ? trimmed : null
}

export async function saveLoanInterestPlan(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin()
    const admin = createAdminClient()
    const planId = optionalText(formData, 'plan_id')
    const name = optionalText(formData, 'name')
    const monthlyRate = parseInterestRate(formData, 'monthly_rate')
    const description = optionalText(formData, 'description')
    const isActive = formData.get('is_active') === 'true'
    const rawRole = optionalText(formData, 'applies_to_role')
    const appliesToRole = MEMBER_ROLES.includes(rawRole as MemberRoleValue)
      ? (rawRole as MemberRoleValue)
      : null

    if (!name) {
      throw new Error('សូមបញ្ចូលឈ្មោះអត្រាកម្ជី។')
    }

    const payload = {
      name,
      monthly_rate: monthlyRate,
      description,
      is_active: isActive,
      applies_to_role: appliesToRole,
      updated_at: new Date().toISOString(),
    }

    const { error } = planId
      ? await admin.from('loan_interest_plans').update(payload).eq('id', planId)
      : await admin.from('loan_interest_plans').insert(payload)

    if (error) throw error

    revalidatePath('/admin/settings')
    revalidatePath('/admin/settings/loan-plans')
    revalidatePath('/dashboard/loans/request')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'មិនអាចរក្សាទុកអត្រាកម្ជីបានទេ។',
    }
  }
}

export async function deleteLoanInterestPlan(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin()
    const planId = idFrom(formData)
    const admin = createAdminClient()
    const { error } = await admin.from('loan_interest_plans').delete().eq('id', planId)

    if (error) throw error

    revalidatePath('/admin/settings')
    revalidatePath('/admin/settings/loan-plans')
    revalidatePath('/dashboard/loans/request')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'មិនអាចលុបអត្រាកម្ជីបានទេ។',
    }
  }
}

export async function assignMemberLoanInterestPlan(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin()
    const memberId = idFrom(formData)
    const rawPlanId = formData.get('loan_interest_plan_id')
    const planId =
      typeof rawPlanId === 'string' && rawPlanId.trim().length > 0 ? rawPlanId.trim() : null

    const admin = createAdminClient()
    const { error } = await admin
      .from('members')
      .update({ loan_interest_plan_id: planId })
      .eq('id', memberId)

    if (error) throw error

    await notify(
      memberId,
      'អត្រាការប្រាក់កម្ជីត្រូវបានធ្វើបច្ចុប្បន្នភាព',
      planId
        ? 'អត្រាការប្រាក់កម្ជីរបស់អ្នកត្រូវបានធ្វើបច្ចុប្បន្នភាពដោយអ្នកគ្រប់គ្រង។'
        : 'អត្រាការប្រាក់កម្ជីរបស់អ្នកត្រូវបានកំណត់ឡើងវិញទៅអត្រាទូទៅ។'
    )
    revalidatePath(`/admin/members/${memberId}`)
    revalidatePath('/dashboard/loans/request')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'មិនអាចកំណត់អត្រាកម្ជីសម្រាប់សមាជិកបានទេ។',
    }
  }
}

export async function markReportSent(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin()
    const id = idFrom(formData)
    const admin = createAdminClient()
    const { error } = await admin
      .from('report_requests')
      .update({ status: 'sent', sent_to_telegram: true, telegram_sent_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    revalidatePath('/admin')
    revalidatePath('/admin/reports')
    revalidatePath('/admin/reports/loans')
    revalidatePath('/admin/reports/savings')
    revalidatePath('/admin/savings')
    revalidatePath('/admin/savings/requests')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'មិនអាចសម្គាល់ថារបាយការណ៍បានផ្ញើទេ។' }
  }
}
