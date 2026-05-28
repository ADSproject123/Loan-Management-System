'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/member'
import type { ActionResult } from '@/app/actions/member'

function idFrom(formData: FormData) {
  const id = formData.get('id')
  if (typeof id !== 'string' || !id) {
    throw new Error('Missing record id.')
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
}

export async function approveMember(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin()
    const id = idFrom(formData)
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('members')
      .update({ status: 'active' })
      .eq('id', id)
      .select('id')
      .single()

    if (error) throw error
    await notify(data.id, 'Account Approved', 'Your SanSam account is now active.')
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unable to approve member.' }
  }
}

export async function suspendMember(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin()
    const id = idFrom(formData)
    const admin = createAdminClient()
    const { error } = await admin.from('members').update({ status: 'suspended' }).eq('id', id)
    if (error) throw error
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unable to suspend member.' }
  }
}

export async function verifySaving(formData: FormData): Promise<ActionResult> {
  try {
    const approver = await requireAdmin()
    const id = idFrom(formData)
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('savings')
      .update({ status: 'completed', verified_by: approver.id, verified_at: new Date().toISOString() })
      .eq('id', id)
      .select('member_id, amount')
      .single()

    if (error) throw error
    await notify(data.member_id, 'Saving Verified', `Your saving of ฿${Number(data.amount).toLocaleString()} has been verified.`)
    revalidatePath('/admin')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/savings')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unable to verify saving.' }
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
      .select('member_id, amount')
      .single()

    if (error) throw error
    await notify(data.member_id, 'Repayment Verified', `Your repayment of ฿${Number(data.amount).toLocaleString()} has been verified.`)
    revalidatePath('/admin')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/loans')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unable to verify repayment.' }
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
      .select('member_id, amount')
      .single()

    if (error) throw error
    await notify(data.member_id, 'Loan Approved', `Your loan request for ฿${Number(data.amount).toLocaleString()} has been approved. Submit hard copy documents before disbursement.`)
    revalidatePath('/admin')
    revalidatePath('/dashboard/loans')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unable to approve loan.' }
  }
}

export async function activateLoan(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin()
    const id = idFrom(formData)
    const admin = createAdminClient()
    const dueDate = new Date()
    dueDate.setMonth(dueDate.getMonth() + 12)

    const { data, error } = await admin
      .from('loans')
      .update({
        status: 'active',
        hard_copy_submitted: true,
        thumbprint_submitted: true,
        disbursed_at: new Date().toISOString(),
        due_date: dueDate.toISOString().slice(0, 10),
      })
      .eq('id', id)
      .select('member_id, amount')
      .single()

    if (error) throw error
    await notify(data.member_id, 'Loan Disbursed', `Your loan of ฿${Number(data.amount).toLocaleString()} has been marked active.`)
    revalidatePath('/admin')
    revalidatePath('/dashboard/loans')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unable to activate loan.' }
  }
}

export async function rejectLoan(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin()
    const id = idFrom(formData)
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('loans')
      .update({ status: 'rejected' })
      .eq('id', id)
      .select('member_id')
      .single()

    if (error) throw error
    await notify(data.member_id, 'Loan Rejected', 'Your loan request was not approved.')
    revalidatePath('/admin')
    revalidatePath('/dashboard/loans')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unable to reject loan.' }
  }
}

export async function decideCapitalRequest(formData: FormData): Promise<ActionResult> {
  try {
    const approver = await requireAdmin()
    const id = idFrom(formData)
    const decision = formData.get('decision') === 'approved' ? 'approved' : 'rejected'
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('capital_requests')
      .update({ status: decision, approved_by: approver.id, approved_at: new Date().toISOString() })
      .eq('id', id)
      .select('member_id, amount')
      .single()

    if (error) throw error
    await notify(data.member_id, 'Capital Request Updated', `Your capital request for ฿${Number(data.amount).toLocaleString()} was ${decision}.`)
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unable to update capital request.' }
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
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unable to mark report sent.' }
  }
}
