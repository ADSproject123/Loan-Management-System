'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/member'
import type { ActionResult } from '@/app/actions/member'

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
    await notify(data.id, 'គណនីត្រូវបានអនុម័ត', 'គណនីសន្សំរបស់អ្នកឥឡូវនេះកំពុងដំណើរការ។')
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'មិនអាចអនុម័តសមាជិកបានទេ។' }
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
    return { success: false, error: error instanceof Error ? error.message : 'មិនអាចផ្អាកសមាជិកបានទេ។' }
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
    await notify(data.member_id, 'ការសន្សំបានផ្ទៀងផ្ទាត់', `ការសន្សំរបស់អ្នកចំនួន ฿${Number(data.amount).toLocaleString()} ត្រូវបានផ្ទៀងផ្ទាត់។`)
    revalidatePath('/admin')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/savings')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'មិនអាចផ្ទៀងផ្ទាត់ការសន្សំបានទេ។' }
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
    await notify(data.member_id, 'ការសងបានផ្ទៀងផ្ទាត់', `ការសងរបស់អ្នកចំនួន ฿${Number(data.amount).toLocaleString()} ត្រូវបានផ្ទៀងផ្ទាត់។`)
    revalidatePath('/admin')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/loans')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'មិនអាចផ្ទៀងផ្ទាត់ការសងបានទេ។' }
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
    await notify(data.member_id, 'ឥណទានត្រូវបានអនុម័ត', `ការស្នើសុំឥណទានរបស់អ្នកចំនួន ฿${Number(data.amount).toLocaleString()} ត្រូវបានអនុម័ត។ សូមដាក់ស្នើឯកសារច្បាប់ដើមមុនការបើកប្រាក់។`)
    revalidatePath('/admin')
    revalidatePath('/dashboard/loans')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'មិនអាចអនុម័តឥណទានបានទេ។' }
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
    await notify(data.member_id, 'ឥណទានត្រូវបានបើក', `ឥណទានរបស់អ្នកចំនួន ฿${Number(data.amount).toLocaleString()} ត្រូវបានសម្គាល់ថាសកម្ម។`)
    revalidatePath('/admin')
    revalidatePath('/dashboard/loans')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'មិនអាចដំណើរការឥណទានបានទេ។' }
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
    await notify(data.member_id, 'ឥណទានត្រូវបានបដិសេធ', 'ការស្នើសុំឥណទានរបស់អ្នកមិនត្រូវបានអនុម័តទេ។')
    revalidatePath('/admin')
    revalidatePath('/dashboard/loans')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'មិនអាចបដិសេធឥណទានបានទេ។' }
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
    const decisionLabel = decision === 'approved' ? 'បានអនុម័ត' : 'បានបដិសេធ'
    await notify(data.member_id, 'ការស្នើសុំដើមទុនត្រូវបានធ្វើបច្ចុប្បន្នភាព', `ការស្នើសុំដើមទុនរបស់អ្នកចំនួន ฿${Number(data.amount).toLocaleString()} ${decisionLabel} ។`)
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'មិនអាចធ្វើបច្ចុប្បន្នភាពការស្នើសុំដើមទុនបានទេ។' }
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
    return { success: false, error: error instanceof Error ? error.message : 'មិនអាចសម្គាល់ថារបាយការណ៍បានផ្ញើទេ។' }
  }
}
