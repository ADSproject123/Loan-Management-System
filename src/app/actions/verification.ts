'use server'

import { requireActiveMember } from '@/lib/auth/member'
import {
  isVerificationAction,
  sendVerificationCode,
  verifyCode,
  type VerificationAction,
} from '@/lib/verification'

export type RequestCodeResult =
  | { success: true; expiresAt: number; alreadyVerified: boolean }
  | { success: false; error: string; notLinked?: boolean }

export async function requestVerificationCode(action: string): Promise<RequestCodeResult> {
  try {
    const member = await requireActiveMember()
    if (!isVerificationAction(action)) {
      return { success: false, error: 'សកម្មភាពផ្ទៀងផ្ទាត់មិនត្រឹមត្រូវ។' }
    }

    const result = await sendVerificationCode(member.id, action)
    if (result.ok) {
      return {
        success: true,
        expiresAt: result.expiresAt,
        alreadyVerified: Boolean(result.alreadyVerified),
      }
    }

    switch (result.reason) {
      case 'not_linked':
        return {
          success: false,
          notLinked: true,
          error: 'គណនី Telegram របស់អ្នកមិនទាន់បានភ្ជាប់ទេ។',
        }
      case 'cooldown':
        return { success: false, error: 'សូមរង់ចាំមួយនាទីមុនពេលស្នើកូដថ្មី។' }
      case 'disabled':
        return { success: false, error: 'ការផ្ទៀងផ្ទាត់តាម Telegram មិនទាន់ត្រូវបានកំណត់រចនាសម្ព័ន្ធទេ។' }
      default:
        return { success: false, error: 'មិនអាចផ្ញើកូដទៅ Telegram បានទេ។ សូមព្យាយាមម្តងទៀត។' }
    }
  } catch (error) {
    console.error('[verification] requestVerificationCode failed:', error)
    return { success: false, error: 'មិនអាចផ្ញើកូដផ្ទៀងផ្ទាត់បានទេ។' }
  }
}

export type ConfirmCodeResult = { success: true } | { success: false; error: string }

export async function confirmVerificationCode(
  action: string,
  code: string
): Promise<ConfirmCodeResult> {
  try {
    const member = await requireActiveMember()
    if (!isVerificationAction(action)) {
      return { success: false, error: 'សកម្មភាពផ្ទៀងផ្ទាត់មិនត្រឹមត្រូវ។' }
    }
    if (!/^\d{6}$/.test(code.trim())) {
      return { success: false, error: 'សូមបញ្ចូលលេខកូដ ៦ ខ្ទង់។' }
    }

    const result = await verifyCode(member.id, action as VerificationAction, code)
    if (result.ok) return { success: true }

    switch (result.reason) {
      case 'expired':
        return { success: false, error: 'លេខកូដបានផុតកំណត់។ សូមស្នើកូដថ្មី។' }
      case 'too_many_attempts':
        return { success: false, error: 'អ្នកបានព្យាយាមច្រើនដងពេក។ សូមស្នើកូដថ្មី។' }
      default:
        return { success: false, error: 'លេខកូដមិនត្រឹមត្រូវ។ សូមព្យាយាមម្តងទៀត។' }
    }
  } catch (error) {
    console.error('[verification] confirmVerificationCode failed:', error)
    return { success: false, error: 'មិនអាចផ្ទៀងផ្ទាត់លេខកូដបានទេ។' }
  }
}
