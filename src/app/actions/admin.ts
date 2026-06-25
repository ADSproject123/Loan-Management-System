'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/member'
import type { ActionResult } from '@/app/actions/member'
import { formatMoney, MIN_SAVING_AMOUNT, normalizeCurrency } from '@/lib/currency'
import { fetchMemberLoanInterestRate, getInterestSettings } from '@/lib/interest'
import { fetchMemberLoanEligibility, validateLoanRequestAmount } from '@/lib/loanEligibility'
import { sendTelegramMessage } from '@/lib/telegram'
import { uploadPrivateFile } from '@/lib/uploads'
import type { LoanDuePaymentStatus, SavingInterestPaymentStatus, SavingStatus } from '@/types/database'

const REPAYMENT_STATUSES: SavingStatus[] = ['pending', 'verified', 'completed', 'refunded']
const LOAN_REPAYMENT_ADMIN_STATUSES = ['pending', 'completed'] as const
const SAVING_INTEREST_STATUSES = ['completed', 'rejected'] as const
const LOAN_DUE_STATUSES = ['pending', 'completed'] as const
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
  comember: 'Core member',
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

type EmergencyContact = { full_name: string; phone: string }

function parseEmergencyContacts(raw: string): EmergencyContact[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (item): item is EmergencyContact =>
          Boolean(item) &&
          typeof item === 'object' &&
          typeof (item as EmergencyContact).full_name === 'string' &&
          typeof (item as EmergencyContact).phone === 'string'
      )
      .map((item) => ({
        full_name: item.full_name.trim(),
        phone: item.phone.trim(),
      }))
      .filter((item) => item.full_name && item.phone)
  } catch {
    return []
  }
}

function revalidateMemberPaths(id: string) {
  revalidatePath('/admin/members')
  revalidatePath(`/admin/members/${id}`)
}

export async function updateMemberProfile(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin()
    const id = idFrom(formData)
    const admin = createAdminClient()

    const email = (formData.get('email') as string ?? '').trim().toLowerCase()
    const fullNameKh = (formData.get('full_name_kh') as string ?? '').trim()
    const fullNameEn = (formData.get('full_name_en') as string ?? '').trim()
    const phone = (formData.get('phone') as string ?? '').trim()
    const dateOfBirth = (formData.get('date_of_birth') as string ?? '').trim()
    const address = (formData.get('address') as string ?? '').trim()
    const idNumber = (formData.get('id_number') as string ?? '').trim()
    const residentBookNumber = (formData.get('resident_book_number') as string ?? '').trim()
    const workplace = (formData.get('workplace') as string ?? '').trim() || null
    const role = roleFrom(formData)
    const emergencyContacts = parseEmergencyContacts(
      (formData.get('emergency_contacts') as string ?? '').trim()
    )

    if (!email || !fullNameKh || !fullNameEn || !phone) {
      return {
        success: false,
        error: 'អ៊ីមែល ឈ្មោះ (ខ្មែរ + អង់គ្លេស) និង ទូរស័ព្ទ ត្រូវការ។',
      }
    }

    if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      return { success: false, error: 'សូមបញ្ចូលថ្ងៃខែឆ្នាំកំណើតត្រឹមត្រូវ។' }
    }

    if (dateOfBirth && dateOfBirth > new Date().toISOString().slice(0, 10)) {
      return { success: false, error: 'ថ្ងៃខែឆ្នាំកំណើតមិនអាចនៅពេលអនាគតបានទេ។' }
    }

    const { data: member, error: memberError } = await admin
      .from('members')
      .select('id, email, auth_user_id, role')
      .eq('id', id)
      .maybeSingle()

    if (memberError) throw memberError
    if (!member) return { success: false, error: 'រកមិនឃើញសមាជិក។' }

    if (email !== member.email) {
      const { data: duplicate } = await admin
        .from('members')
        .select('id')
        .eq('email', email)
        .neq('id', id)
        .maybeSingle()

      if (duplicate) {
        return { success: false, error: 'អ៊ីមែលនេះត្រូវបានប្រើរួចហើយ។' }
      }
    }

    const fullName = `${fullNameKh} | ${fullNameEn}`

    if (member.auth_user_id && email !== member.email) {
      const { error: authError } = await admin.auth.admin.updateUserById(member.auth_user_id, {
        email,
        user_metadata: { full_name: fullName, full_name_kh: fullNameKh, full_name_en: fullNameEn },
      })
      if (authError) throw authError
    } else if (member.auth_user_id) {
      const { error: authError } = await admin.auth.admin.updateUserById(member.auth_user_id, {
        user_metadata: { full_name: fullName, full_name_kh: fullNameKh, full_name_en: fullNameEn },
      })
      if (authError) throw authError
    }

    const { error } = await admin
      .from('members')
      .update({
        email,
        full_name: fullName,
        full_name_kh: fullNameKh,
        full_name_en: fullNameEn,
        phone,
        date_of_birth: dateOfBirth || null,
        address: address || null,
        id_number: idNumber || null,
        resident_book_number: residentBookNumber || null,
        workplace,
        emergency_contacts: emergencyContacts,
        role,
      })
      .eq('id', id)

    if (error) throw error

    if (role !== member.role) {
      await notify(
        id,
        'តួនាទីត្រូវបានធ្វើបច្ចុប្បន្នភាព',
        `តួនាទីរបស់អ្នកត្រូវបានកំណត់ជា ${MEMBER_ROLE_LABELS[role]}។`
      )
    } else {
      await notify(id, 'ព័ត៌មានត្រូវបានធ្វើបច្ចុប្បន្នភាព', 'ព័ត៌មានផ្ទាល់ខ្លួនរបស់អ្នកត្រូវបានអ្នកគ្រប់គ្រងធ្វើបច្ចុប្បន្នភាព។')
    }
    revalidateMemberPaths(id)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'មិនអាចរក្សាទុកព័ត៌មានសមាជិកបានទេ។',
    }
  }
}

export async function updateMemberDocuments(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin()
    const id = idFrom(formData)
    const admin = createAdminClient()

    const idDocumentFile = formData.get('id_document')
    const residentBookFile = formData.get('resident_book')
    const hasIdDoc = idDocumentFile instanceof File && idDocumentFile.size > 0
    const hasResidentBook = residentBookFile instanceof File && residentBookFile.size > 0

    if (!hasIdDoc && !hasResidentBook) {
      return { success: false, error: 'សូមជ្រើសរើសឯកសារយ៉ាងហោចណាស់មួយដើម្បីផ្ទុក។' }
    }

    const { data: member, error: memberError } = await admin
      .from('members')
      .select('id, auth_user_id, id_document_url, resident_book_url')
      .eq('id', id)
      .maybeSingle()

    if (memberError) throw memberError
    if (!member?.auth_user_id) {
      return { success: false, error: 'សមាជិកនេះមិនមានគណនីចូលភ្ជាប់ទេ។' }
    }

    const updates: { id_document_url?: string; resident_book_url?: string } = {}

    if (hasIdDoc) {
      const idDocumentUrl = await uploadPrivateFile(
        'member-documents',
        member.auth_user_id,
        'id-documents',
        idDocumentFile
      )
      if (idDocumentUrl) updates.id_document_url = idDocumentUrl
    }

    if (hasResidentBook) {
      const residentBookUrl = await uploadPrivateFile(
        'member-documents',
        member.auth_user_id,
        'resident-books',
        residentBookFile
      )
      if (residentBookUrl) updates.resident_book_url = residentBookUrl
    }

    const { error } = await admin.from('members').update(updates).eq('id', id)
    if (error) throw error

    await notify(id, 'ឯកសារត្រូវបានធ្វើបច្ចុប្បន្នភាព', 'ឯកសារផ្ទៀងផ្ទាត់របស់អ្នកត្រូវបានអ្នកគ្រប់គ្រងធ្វើបច្ចុប្បន្នភាព។')
    revalidateMemberPaths(id)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'មិនអាចផ្ទុកឯកសារបានទេ។',
    }
  }
}

export async function updateMemberReferee(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin()
    const id = idFrom(formData)
    const admin = createAdminClient()

    const rawRefereeId = (formData.get('referee_id') as string ?? '').trim()
    const refereeId = rawRefereeId || null

    if (refereeId === id) {
      return { success: false, error: 'សមាជិកមិនអាចជាអ្នកធានារបស់ខ្លួនឯងបានទេ។' }
    }

    if (refereeId) {
      const { data: referee, error: refereeError } = await admin
        .from('members')
        .select('id')
        .eq('id', refereeId)
        .eq('status', 'active')
        .eq('is_admin', false)
        .maybeSingle()

      if (refereeError) throw refereeError
      if (!referee) {
        return { success: false, error: 'អ្នកធានាដែលជ្រើសរើសមិនមាន ឬ មិនសកម្មទេ។' }
      }
    }

    const { error } = await admin
      .from('members')
      .update({
        referee_id: refereeId,
        referee_verified: Boolean(refereeId),
      })
      .eq('id', id)

    if (error) throw error

    await notify(id, 'អ្នកធានាត្រូវបានធ្វើបច្ចុប្បន្នភាព', 'ព័ត៌មានអ្នកធានារបស់អ្នកត្រូវបានអ្នកគ្រប់គ្រងធ្វើបច្ចុប្បន្នភាព។')
    revalidateMemberPaths(id)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'មិនអាចរក្សាទុកអ្នកធានាបានទេ។',
    }
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

export async function deleteMember(formData: FormData): Promise<ActionResult> {
  try {
    const currentAdmin = await requireAdmin()
    const id = idFrom(formData)

    if (id === currentAdmin.id) {
      return { success: false, error: 'អ្នកមិនអាចលុបគណនីរបស់ខ្លួនឯងបានទេ។' }
    }

    const admin = createAdminClient()
    const { data: target, error: targetError } = await admin
      .from('members')
      .select('id, full_name, auth_user_id, is_admin, telegram_chat_id')
      .eq('id', id)
      .maybeSingle()

    if (targetError) {
      console.error('[deleteMember] fetch target failed:', targetError)
      return { success: false, error: `ទាញយកទិន្នន័យបរាជ័យ: ${targetError.message}` }
    }
    if (!target) {
      return { success: false, error: 'រកមិនឃើញសមាជិក។' }
    }
    if (target.is_admin) {
      return {
        success: false,
        error: 'មិនអាចលុបគណនីអ្នកគ្រប់គ្រងបានទេ។ សូមដកសិទ្ធិអ្នកគ្រប់គ្រងជាមុនសិន។',
      }
    }

    // These columns reference members(id) without ON DELETE CASCADE, so they
    // must be cleared first or the delete is blocked by the foreign keys.
    const referenceCleanups: Array<[string, string]> = [
      ['members', 'referee_id'],
      ['loans', 'referee_id'],
      ['loans', 'approved_by'],
      ['savings', 'verified_by'],
      ['savings', 'refunded_by'],
      ['loan_repayments', 'verified_by'],
      ['capital_requests', 'approved_by'],
    ]
    for (const [table, column] of referenceCleanups) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (admin.from(table as any) as any)
        .update({ [column]: null })
        .eq(column, id)
      if (error) {
        console.error(`[deleteMember] cleanup ${table}.${column} failed:`, error)
        return { success: false, error: `លុបបរាជ័យ (${table}.${column}): ${error.message}` }
      }
    }

    if (target.auth_user_id) {
      // Deleting the auth user cascades to the member row, which in turn
      // cascades to all member-owned records (savings, loans, repayments, …).
      const { error: authError } = await admin.auth.admin.deleteUser(target.auth_user_id)
      if (authError) {
        // If the auth user is already gone (e.g. manually purged), fall back to
        // deleting the member row directly so the record is still cleaned up.
        const isNotFound =
          authError.message?.toLowerCase().includes('not found') ||
          authError.message?.toLowerCase().includes('user not found') ||
          ('status' in authError && (authError as { status?: number }).status === 404)

        if (isNotFound) {
          console.warn('[deleteMember] auth user not found, deleting member row directly')
          const { error: deleteError } = await admin.from('members').delete().eq('id', id)
          if (deleteError) {
            console.error('[deleteMember] fallback members.delete failed:', deleteError)
            return { success: false, error: `លុបសមាជិកបរាជ័យ: ${deleteError.message}` }
          }
        } else {
          console.error('[deleteMember] auth.admin.deleteUser failed:', authError)
          return { success: false, error: `លុបគណនីចូលបរាជ័យ: ${authError.message}` }
        }
      }
    } else {
      const { error: deleteError } = await admin.from('members').delete().eq('id', id)
      if (deleteError) {
        console.error('[deleteMember] members.delete failed:', deleteError)
        return { success: false, error: `លុបសមាជិកបរាជ័យ: ${deleteError.message}` }
      }
    }

    if (target.telegram_chat_id) {
      await sendTelegramMessage(
        target.telegram_chat_id,
        '<b>គណនីត្រូវបានលុប</b>\nគណនីសមាជិករបស់អ្នកត្រូវបានលុបចេញពីប្រព័ន្ធដោយអ្នកគ្រប់គ្រង។'
      )
    }

    revalidatePath('/admin')
    revalidatePath('/admin/members')
    revalidatePath('/admin/members/requests')
    return { success: true }
  } catch (error) {
    console.error('[deleteMember] unexpected error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return { success: false, error: `លុបបរាជ័យ: ${msg}` }
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

export async function updateRepaymentStatus(formData: FormData): Promise<ActionResult> {
  try {
    const approver = await requireAdmin()
    const id = idFrom(formData)
    const status = (formData.get('status') as string | null)?.trim() ?? ''

    if (!LOAN_REPAYMENT_ADMIN_STATUSES.includes(status as (typeof LOAN_REPAYMENT_ADMIN_STATUSES)[number])) {
      return { success: false, error: 'ស្ថានភាពមិនត្រឹមត្រូវ។' }
    }

    const admin = createAdminClient()
    const nextStatus = status as 'pending' | 'completed'
    const updates =
      nextStatus === 'completed'
        ? {
            status: 'completed' as SavingStatus,
            verified_by: approver.id,
            verified_at: new Date().toISOString(),
          }
        : {
            status: 'pending' as SavingStatus,
            verified_by: null,
            verified_at: null,
          }

    const { data, error } = await admin
      .from('loan_repayments')
      .update(updates)
      .eq('id', id)
      .select('member_id, loan_id, amount, currency, status')
      .single()

    if (error) throw error

    if (nextStatus === 'completed') {
      await notify(
        data.member_id,
        'ការសងត្រូវបានទទួល',
        `ការសងរបស់អ្នកចំនួន ${formatMoney(data.amount, data.currency ?? 'USD')} ត្រូវបានទទួល។`
      )
    }

    revalidatePath('/admin')
    revalidatePath('/admin/loans/payments')
    revalidatePath('/admin/loans/payments/requests')
    revalidatePath('/admin/payments')
    revalidatePath('/admin/payments/requests')
    revalidatePath(`/admin/loans/${data.loan_id}`)
    revalidatePath(`/admin/members/${data.member_id}`)
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/loans')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'មិនអាចប្តូរស្ថានភាពការសងបានទេ។',
    }
  }
}

export async function updateLoanDueStatus(formData: FormData): Promise<ActionResult> {
  try {
    const approver = await requireAdmin()
    const loanId = (formData.get('loan_id') as string | null)?.trim() ?? ''
    const memberId = (formData.get('member_id') as string | null)?.trim() ?? ''
    const year = Number(formData.get('year'))
    const month = Number(formData.get('month'))
    const scheduleMonth = Number(formData.get('schedule_month'))
    const amount = Number(formData.get('amount'))
    const interestAmount = Number(formData.get('interest_amount'))
    const currency = normalizeCurrency((formData.get('currency') as string | null) ?? 'USD')
    const dueDate = (formData.get('due_date') as string | null)?.trim() ?? ''
    const status = (formData.get('status') as string | null)?.trim() ?? ''

    if (!loanId || !memberId) {
      return { success: false, error: 'បាត់លេខសម្គាល់កម្ជី ឬសមាជិក។' }
    }
    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
      return { success: false, error: 'ខែឬឆ្នាំមិនត្រឹមត្រូវ។' }
    }
    if (!Number.isFinite(scheduleMonth) || scheduleMonth < 1) {
      return { success: false, error: 'ខែកម្ជីមិនត្រឹមត្រូវ។' }
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, error: 'ចំនួនត្រូវបង់មិនត្រឹមត្រូវ។' }
    }
    if (!Number.isFinite(interestAmount) || interestAmount < 0) {
      return { success: false, error: 'ចំនួនការប្រាក់មិនត្រឹមត្រូវ។' }
    }
    if (!dueDate) {
      return { success: false, error: 'បាត់ថ្ងៃត្រូវបង់។' }
    }
    if (!LOAN_DUE_STATUSES.includes(status as (typeof LOAN_DUE_STATUSES)[number])) {
      return { success: false, error: 'ស្ថានភាពមិនត្រឹមត្រូវ។' }
    }

    const admin = createAdminClient()
    const nextStatus = status as LoanDuePaymentStatus
    const verifiedFields =
      nextStatus === 'completed'
        ? { verified_by: approver.id, verified_at: new Date().toISOString() }
        : { verified_by: null, verified_at: null }

    const { data, error } = await admin
      .from('loan_due_payments')
      .upsert(
        {
          loan_id: loanId,
          member_id: memberId,
          period_year: year,
          period_month: month,
          schedule_month: scheduleMonth,
          amount,
          interest_amount: interestAmount,
          currency,
          due_date: dueDate,
          status: nextStatus,
          ...verifiedFields,
        },
        { onConflict: 'loan_id,period_year,period_month' }
      )
      .select('member_id, loan_id, amount, currency, status')
      .single()

    if (error) throw error

    if (nextStatus === 'completed') {
      await notify(
        data.member_id,
        'ការសងកម្ជីត្រូវបានទទួល',
        `ការសងកម្ជីរបស់អ្នកចំនួន ${formatMoney(data.amount, data.currency ?? 'USD')} ត្រូវបានទទួល។`
      )
    }

    revalidatePath('/admin')
    revalidatePath('/admin/loans/payments')
    revalidatePath('/admin/loans/payments/requests')
    revalidatePath('/admin/payments')
    revalidatePath('/admin/payments/requests')
    revalidatePath(`/admin/loans/${data.loan_id}`)
    revalidatePath(`/admin/members/${data.member_id}`)
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/loans')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'មិនអាចប្តូរស្ថានភាពការសងបានទេ។',
    }
  }
}

export async function updateSavingInterestStatus(formData: FormData): Promise<ActionResult> {
  try {
    const approver = await requireAdmin()
    const memberId = (formData.get('member_id') as string | null)?.trim() ?? ''
    const year = Number(formData.get('year'))
    const month = Number(formData.get('month'))
    const amount = Number(formData.get('amount'))
    const currency = normalizeCurrency((formData.get('currency') as string | null) ?? 'USD')
    const interestDate = (formData.get('interest_date') as string | null)?.trim() ?? ''
    const status = (formData.get('status') as string | null)?.trim() ?? ''

    if (!memberId) {
      return { success: false, error: 'បាត់លេខសម្គាល់សមាជិក។' }
    }
    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
      return { success: false, error: 'ខែឬឆ្នាំមិនត្រឹមត្រូវ។' }
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, error: 'ចំនួនការប្រាក់មិនត្រឹមត្រូវ។' }
    }
    if (!interestDate) {
      return { success: false, error: 'បាត់ថ្ងៃទទួលការប្រាក់។' }
    }
    if (!SAVING_INTEREST_STATUSES.includes(status as (typeof SAVING_INTEREST_STATUSES)[number])) {
      return { success: false, error: 'ស្ថានភាពមិនត្រឹមត្រូវ។' }
    }

    const admin = createAdminClient()
    const nextStatus = status as SavingInterestPaymentStatus
    const verifiedFields =
      nextStatus === 'completed'
        ? { verified_by: approver.id, verified_at: new Date().toISOString() }
        : { verified_by: null, verified_at: null }

    const { data, error } = await admin
      .from('saving_interest_payments')
      .upsert(
        {
          member_id: memberId,
          period_year: year,
          period_month: month,
          amount,
          currency,
          interest_date: interestDate,
          status: nextStatus,
          ...verifiedFields,
        },
        { onConflict: 'member_id,period_year,period_month' }
      )
      .select('member_id, amount, currency, status')
      .single()

    if (error) throw error

    if (nextStatus === 'completed') {
      await notify(
        data.member_id,
        'ការប្រាក់សន្សំត្រូវបានបង់',
        `ការប្រាក់សន្សំរបស់អ្នកចំនួន ${formatMoney(data.amount, data.currency ?? 'USD')} ត្រូវបានបង់។`
      )
    } else if (nextStatus === 'rejected') {
      await notify(
        data.member_id,
        'ការប្រាក់សន្សំត្រូវបានបដិសេធ',
        `ការប្រាក់សន្សំចំនួន ${formatMoney(data.amount, data.currency ?? 'USD')} ត្រូវបានបដិសេធ។`
      )
    }

    revalidatePath('/admin')
    revalidatePath('/admin/savings/interest')
    revalidatePath(`/admin/members/${data.member_id}`)
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/savings')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'មិនអាចប្តូរស្ថានភាពការប្រាក់សន្សំបានទេ។',
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

export async function adminCreateCapitalRequest(formData: FormData): Promise<ActionResult> {
  try {
    const approver = await requireAdmin()
    const memberId = idFrom(formData)
    const amount = Number((formData.get('amount') as string ?? '').trim())
    const reason = (formData.get('reason') as string ?? '').trim()
    const afterDecision = (formData.get('after_decision') as string ?? '').trim()
    const currency = normalizeCurrency((formData.get('currency') as string ?? '').trim())

    if (!memberId || amount <= 0 || !reason) {
      return { success: false, error: 'សូមបំពេញចំនួនទឹកប្រាក់ និង មូលហេតុ។' }
    }
    if (afterDecision !== 'continue' && afterDecision !== 'withdraw') {
      return { success: false, error: 'សូមជ្រើសរើសសកម្មភាពបន្ទាប់ពីការដក។' }
    }

    const admin = createAdminClient()
    const { error } = await admin.from('capital_requests').insert({
      member_id: memberId,
      amount,
      currency,
      reason,
      continue_saving: afterDecision === 'continue',
      remove_membership: afterDecision === 'withdraw',
      status: 'approved',
      approved_by: approver.id,
      approved_at: new Date().toISOString(),
    })

    if (error) throw error

    const label = `${formatMoney(amount, currency)}`
    await notify(memberId, 'ការដកដើមទុន', `អ្នកគ្រប់គ្រងបានដំណើរការការដកដើមទុនចំនួន ${label} ។`)

    revalidatePath('/admin')
    revalidatePath(`/admin/members/${memberId}`)
    revalidatePath('/admin/capital')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'មិនអាចដំណើរការការដកដើមទុនបានទេ។' }
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

export async function createMemberByAdmin(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin()
    const admin = createAdminClient()

    const email = (formData.get('email') as string ?? '').trim().toLowerCase()
    const password = (formData.get('password') as string ?? '').trim()
    const fullNameKh = (formData.get('full_name_kh') as string ?? '').trim()
    const fullNameEn = (formData.get('full_name_en') as string ?? '').trim()
    const phone = (formData.get('phone') as string ?? '').trim()
    const dateOfBirth = (formData.get('date_of_birth') as string ?? '').trim()
    const address = (formData.get('address') as string ?? '').trim()
    const idNumber = (formData.get('id_number') as string ?? '').trim()
    const residentBookNumber = (formData.get('resident_book_number') as string ?? '').trim()
    const workplace = (formData.get('workplace') as string ?? '').trim() || null
    const role = (formData.get('role') as string ?? 'member').trim()
    const emergencyContactsRaw = (formData.get('emergency_contacts') as string ?? '').trim()
    const emergencyContacts = emergencyContactsRaw ? JSON.parse(emergencyContactsRaw) : []
    const idDocumentFile = formData.get('id_document')
    const residentBookFile = formData.get('resident_book')

    if (!phone || !password || !fullNameKh || !fullNameEn) {
      return { success: false, error: 'លេខទូរស័ព្ទ ពាក្យសម្ងាត់ និងឈ្មោះពេញ (ខ្មែរ + អង់គ្លេស) ត្រូវការ។' }
    }
    if (password.length < 8) {
      return { success: false, error: 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៨ តួអក្សរ។' }
    }

    const fullName = `${fullNameKh} | ${fullNameEn}`

    // Supabase Auth requires an email; synthesize one from phone when none is provided.
    const authEmail = email || `${phone.replace(/\D/g, '')}@member.local`

    const refereeId = (formData.get('referee_id') as string ?? '').trim() || null

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
      'member-documents', authUserId, 'id-documents',
      idDocumentFile instanceof File ? idDocumentFile : null
    )
    const residentBookUrl = await uploadPrivateFile(
      'member-documents', authUserId, 'resident-books',
      residentBookFile instanceof File ? residentBookFile : null
    )

    const connectToken = crypto.randomUUID()

    const { error: memberError } = await admin.from('members').insert({
      auth_user_id: authUserId,
      full_name: fullName,
      full_name_kh: fullNameKh,
      full_name_en: fullNameEn,
      email: email || null,
      phone: phone || null,
      date_of_birth: dateOfBirth || null,
      address: address || null,
      id_number: idNumber || null,
      resident_book_number: residentBookNumber || null,
      workplace,
      emergency_contacts: emergencyContacts,
      referee_id: refereeId,
      referee_verified: Boolean(refereeId),
      id_document_url: idDocumentUrl,
      resident_book_url: residentBookUrl,
      role: ['founder', 'comember', 'member'].includes(role) ? role : 'member',
      status: 'active',
      telegram_connect_token: connectToken,
    })
    if (memberError) throw memberError

    revalidatePath('/admin')
    revalidatePath('/admin/members')
    return { success: true, connectToken }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'មិនអាចបង្កើតសមាជិកបានទេ។' }
  }
}

export async function ensureMemberTelegramConnectToken(
  memberId: string
): Promise<{ linked: boolean; connectToken: string | null }> {
  await requireAdmin()
  const admin = createAdminClient()

  const { data: member, error } = await admin
    .from('members')
    .select('id, telegram_chat_id, telegram_connect_token')
    .eq('id', memberId)
    .maybeSingle()

  if (error || !member) {
    return { linked: false, connectToken: null }
  }

  if (member.telegram_chat_id) {
    return { linked: true, connectToken: null }
  }

  let token = member.telegram_connect_token
  if (!token) {
    token = crypto.randomUUID()
    await admin.from('members').update({ telegram_connect_token: token }).eq('id', memberId)
  }

  return { linked: false, connectToken: token }
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

function memberIdFrom(formData: FormData) {
  const value = formData.get('member_id')
  if (typeof value !== 'string' || !value) {
    throw new Error('បាត់លេខសម្គាល់សមាជិក។')
  }
  return value
}

function adminAsString(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function adminAsNumber(formData: FormData, key: string) {
  const value = Number(adminAsString(formData, key))
  return Number.isFinite(value) ? value : 0
}

function adminAsFile(formData: FormData, key: string) {
  const value = formData.get(key)
  return value instanceof File && value.size > 0 ? value : null
}

function monthsBetween(start: string, end: string) {
  const startDate = new Date(start)
  const endDate = new Date(end)
  let months =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth())
  if (endDate.getDate() < startDate.getDate()) months -= 1
  return Math.max(1, months)
}

async function requireActiveMemberForAdmin(
  admin: ReturnType<typeof createAdminClient>,
  memberId: string
) {
  const { data: member, error } = await admin
    .from('members')
    .select('id, status, auth_user_id, referee_id')
    .eq('id', memberId)
    .eq('is_admin', false)
    .maybeSingle()

  if (error) throw error
  if (!member) throw new Error('រកមិនឃើញសមាជិកទេ។')
  if (member.status !== 'active') {
    throw new Error('អ្នកអាចបន្ថែមការសន្សំ ឬកម្ជីបានតែសម្រាប់សមាជិកសកម្មប៉ុណ្ណោះ។')
  }

  return member
}

function revalidateMemberFinancialPaths(memberId: string) {
  revalidatePath('/admin')
  revalidatePath('/admin/members')
  revalidatePath(`/admin/members/${memberId}`)
  revalidatePath('/admin/savings')
  revalidatePath('/admin/savings/requests')
  revalidatePath('/admin/loans')
  revalidatePath('/admin/loans/requests')
  revalidatePath('/admin/loans/active')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/savings')
  revalidatePath('/dashboard/loans')
}

export async function addSavingByAdmin(formData: FormData): Promise<ActionResult> {
  try {
    const approver = await requireAdmin()
    const memberId = memberIdFrom(formData)
    const amount = adminAsNumber(formData, 'amount')
    const notes = adminAsString(formData, 'notes')
    const currency = normalizeCurrency(adminAsString(formData, 'currency') || 'USD')
    const savingDate = adminAsString(formData, 'saving_date') || new Date().toISOString().slice(0, 10)

    if (amount < MIN_SAVING_AMOUNT) {
      return {
        success: false,
        error: `ចំនួនទឹកប្រាក់សន្សំអប្បបរមាគឺ $${MIN_SAVING_AMOUNT}។`,
      }
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(savingDate)) {
      return { success: false, error: 'សូមបញ្ចូលថ្ងៃសន្សំត្រឹមត្រូវ។' }
    }

    const admin = createAdminClient()
    const member = await requireActiveMemberForAdmin(admin, memberId)
    const evidenceFile = adminAsFile(formData, 'evidence')
    const uploadUserId = member.auth_user_id ?? approver.auth_user_id

    if (!uploadUserId) {
      return { success: false, error: 'មិនអាចផ្ទុកភស្តុតាងបានទេ។' }
    }

    const evidenceUrl = evidenceFile
      ? await uploadPrivateFile('payment-evidence', uploadUserId, 'savings', evidenceFile)
      : null

    const { error } = await admin.from('savings').insert({
      member_id: memberId,
      amount,
      currency,
      notes: notes || null,
      saving_date: savingDate,
      evidence_url: evidenceUrl,
      qr_code_ref: `ADM-SAV-${Date.now()}`,
      status: 'completed',
      verified_by: approver.id,
      verified_at: new Date().toISOString(),
    })

    if (error) throw error

    await notify(
      memberId,
      'ការសន្សំត្រូវបានបន្ថែម',
      `ការសន្សំចំនួន ${formatMoney(amount, currency)} ត្រូវបានបន្ថែមដោយអ្នកគ្រប់គ្រង។`
    )
    revalidateMemberFinancialPaths(memberId)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'មិនអាចបន្ថែមការសន្សំបានទេ។',
    }
  }
}

export async function addLoanByAdmin(formData: FormData): Promise<ActionResult> {
  try {
    const approver = await requireAdmin()
    const memberId = memberIdFrom(formData)
    const amount = adminAsNumber(formData, 'amount')
    const purpose = adminAsString(formData, 'purpose')
    const startDate = adminAsString(formData, 'start_date')
    const endDate = adminAsString(formData, 'end_date')
    const currency = normalizeCurrency(adminAsString(formData, 'currency') || 'USD')
    const autoApprove = adminAsString(formData, 'auto_approve') === 'true'

    let refereeId = adminAsString(formData, 'referee_id') || null
    let refereeNameKh = adminAsString(formData, 'referee_name_kh')
    let refereeNameEn = adminAsString(formData, 'referee_name_en')
    let refereePhone = adminAsString(formData, 'referee_phone')
    let refereeEmail = adminAsString(formData, 'referee_email').toLowerCase()

    if (amount <= 0 || !purpose) {
      return { success: false, error: 'សូមបញ្ចូលចំនួនទឹកប្រាក់កម្ជី និង គោលបំណងត្រឹមត្រូវ។' }
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(endDate) ||
      endDate <= startDate
    ) {
      return { success: false, error: 'សូមជ្រើសរើសកាលបរិច្ឆេទចាប់ផ្តើម និង បញ្ចប់នៃកម្ជីត្រឹមត្រូវ។' }
    }

    const admin = createAdminClient()
    const member = await requireActiveMemberForAdmin(admin, memberId)

    if (!refereeId && member.referee_id) {
      refereeId = member.referee_id
    }

    if (refereeId && (!refereeNameKh || !refereeNameEn || !refereePhone)) {
      const { data: linkedReferee } = await admin
        .from('members')
        .select('full_name, full_name_kh, full_name_en, phone, email')
        .eq('id', refereeId)
        .maybeSingle()

      if (linkedReferee) {
        refereeNameKh =
          refereeNameKh || linkedReferee.full_name_kh || linkedReferee.full_name || ''
        refereeNameEn =
          refereeNameEn || linkedReferee.full_name_en || linkedReferee.full_name || ''
        refereePhone = refereePhone || linkedReferee.phone || ''
        refereeEmail = refereeEmail || linkedReferee.email?.toLowerCase() || ''
      }
    }

    if (!refereeNameKh || !refereeNameEn || !refereePhone) {
      return {
        success: false,
        error: 'សូមបញ្ចូលព័ត៌មានអ្នកធានា (ខ្មែរ អង់គ្លេស និង ទូរស័ព្ទ) ឬដាក់អ្នកធានាឲ្យសមាជិកជាមុនសិន។',
      }
    }

    const eligibility = await fetchMemberLoanEligibility(admin, memberId)
    const amountCheck = validateLoanRequestAmount(amount, eligibility)
    if (!amountCheck.valid) {
      return { success: false, error: amountCheck.error }
    }

    const interestSettings = await getInterestSettings()
    const loanInterestRate = await fetchMemberLoanInterestRate(
      memberId,
      interestSettings.monthlyLoanInterestRate
    )
    const termMonths = monthsBetween(startDate, endDate)

    const insertPayload: Record<string, unknown> = {
      member_id: memberId,
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
      status: autoApprove ? 'approved' : 'under_review',
    }

    if (autoApprove) {
      insertPayload.approved_by = approver.id
      insertPayload.approved_at = new Date().toISOString()
    }

    const { error } = await admin.from('loans').insert(insertPayload)
    if (error) throw error

    await notify(
      memberId,
      autoApprove ? 'កម្ជីត្រូវបានបន្ថែម និងទទួលយក' : 'កម្ជីត្រូវបានបន្ថែម',
      autoApprove
        ? `កម្ជីចំនួន ${formatMoney(amount, currency)} ត្រូវបានបន្ថែម និងទទួលយកដោយអ្នកគ្រប់គ្រង។`
        : `កម្ជីចំនួន ${formatMoney(amount, currency)} ត្រូវបានបន្ថែមដោយអ្នកគ្រប់គ្រង។`
    )
    revalidateMemberFinancialPaths(memberId)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'មិនអាចបន្ថែមកម្ជីបានទេ។',
    }
  }
}
