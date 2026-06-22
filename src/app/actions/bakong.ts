'use server'

import { revalidatePath } from 'next/cache'
import QRCode from 'qrcode'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireActiveMember } from '@/lib/auth/member'
import { MIN_SAVING_AMOUNT, normalizeCurrency } from '@/lib/currency'
import { checkPaymentByMd5, createKhqrIntent } from '@/lib/bakong'

export type KhqrIntentResult =
  | {
      success: true
      qrImage: string
      md5: string
      expiresAt: number
      merchantName: string
      currency: 'USD' | 'KHR'
      amount: number
    }
  | { success: false; error: string }

export async function createRepayKhqr(amount: number): Promise<KhqrIntentResult> {
  try {
    const member = await requireActiveMember()


    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, error: 'សូមបញ្ចូលចំនួនទឹកប្រាក់បង់ត្រឹមត្រូវ។' }
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

    const billNumber = `LR${Date.now().toString(36).toUpperCase()}`
    const intent = createKhqrIntent(amount, billNumber)
    const qrImage = await QRCode.toDataURL(intent.qr, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 512,
    })

    return {
      success: true,
      qrImage,
      md5: intent.md5,
      expiresAt: intent.expiresAt,
      merchantName: intent.merchantName,
      currency: intent.currency,
      amount,
    }
  } catch (error) {
    console.error('[bakong] createRepayKhqr failed:', error)
    return { success: false, error: 'មិនអាចបង្កើត KHQR បានទេ។ សូមព្យាយាមម្តងទៀត។' }
  }
}

export type KhqrStatusResult =
  | { success: true; paid: boolean }
  | { success: false; error: string }

/**
 * Poll Bakong for the payment of a previously generated KHQR. When the
 * transaction settles, the repayment is recorded once (idempotent on the
 * Bakong transaction hash) and left pending for admin verification.
 */
export async function checkRepayKhqr(md5: string): Promise<KhqrStatusResult> {
  try {
    const member = await requireActiveMember()

    if (!/^[a-f0-9]{32}$/i.test(md5)) {
      return { success: false, error: 'សំណើពិនិត្យការបង់ប្រាក់មិនត្រឹមត្រូវ។' }
    }

    const transaction = await checkPaymentByMd5(md5)
    if (!transaction) return { success: true, paid: false }

    const admin = createAdminClient()
    const qrCodeRef = `KHQR-${transaction.hash}`

    const { data: existing, error: existingError } = await admin
      .from('loan_repayments')
      .select('id')
      .eq('qr_code_ref', qrCodeRef)
      .maybeSingle()

    if (existingError) throw existingError

    if (!existing) {
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

      const { error: insertError } = await admin.from('loan_repayments').insert({
        loan_id: activeLoan.id,
        member_id: member.id,
        amount: transaction.amount,
        currency: normalizeCurrency(transaction.currency),
        qr_code_ref: qrCodeRef,
        status: 'pending',
      })

      if (insertError) throw insertError

      revalidatePath('/dashboard')
      revalidatePath('/dashboard/loans')
      revalidatePath('/dashboard/loans/repay')
    }

    return { success: true, paid: true }
  } catch (error) {
    console.error('[bakong] checkRepayKhqr failed:', error)
    return { success: false, error: 'មិនអាចពិនិត្យស្ថានភាពការបង់ប្រាក់បានទេ។' }
  }
}

export async function createSavingKhqr(amount: number): Promise<KhqrIntentResult> {
  try {
    const member = await requireActiveMember()


    if (!Number.isFinite(amount) || amount < MIN_SAVING_AMOUNT) {
      return { success: false, error: `ចំនួនទឹកប្រាក់សន្សំអប្បបរមាគឺ $${MIN_SAVING_AMOUNT}។` }
    }

    const billNumber = `SV${Date.now().toString(36).toUpperCase()}`
    const intent = createKhqrIntent(amount, billNumber)
    const qrImage = await QRCode.toDataURL(intent.qr, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 512,
    })

    return {
      success: true,
      qrImage,
      md5: intent.md5,
      expiresAt: intent.expiresAt,
      merchantName: intent.merchantName,
      currency: intent.currency,
      amount,
    }
  } catch (error) {
    console.error('[bakong] createSavingKhqr failed:', error)
    return { success: false, error: 'មិនអាចបង្កើត KHQR បានទេ។ សូមព្យាយាមម្តងទៀត។' }
  }
}

/**
 * Poll Bakong for a savings deposit KHQR. Once settled, the saving is
 * recorded once (idempotent on the Bakong transaction hash) and left
 * pending for admin verification.
 */
export async function checkSavingKhqr(md5: string, notes?: string): Promise<KhqrStatusResult> {
  try {
    const member = await requireActiveMember()

    if (!/^[a-f0-9]{32}$/i.test(md5)) {
      return { success: false, error: 'សំណើពិនិត្យការបង់ប្រាក់មិនត្រឹមត្រូវ។' }
    }

    const transaction = await checkPaymentByMd5(md5)
    if (!transaction) return { success: true, paid: false }

    const admin = createAdminClient()
    const qrCodeRef = `KHQR-${transaction.hash}`

    const { data: existing, error: existingError } = await admin
      .from('savings')
      .select('id')
      .eq('qr_code_ref', qrCodeRef)
      .maybeSingle()

    if (existingError) throw existingError

    if (!existing) {
      const { error: insertError } = await admin.from('savings').insert({
        member_id: member.id,
        amount: transaction.amount,
        currency: normalizeCurrency(transaction.currency),
        notes: notes?.trim() || null,
        qr_code_ref: qrCodeRef,
        status: 'pending',
      })

      if (insertError) throw insertError

      revalidatePath('/dashboard')
      revalidatePath('/dashboard/savings')
    }

    return { success: true, paid: true }
  } catch (error) {
    console.error('[bakong] checkSavingKhqr failed:', error)
    return { success: false, error: 'មិនអាចពិនិត្យស្ថានភាពការបង់ប្រាក់បានទេ។' }
  }
}
