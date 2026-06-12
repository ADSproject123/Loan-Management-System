import { createHash, randomInt } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTelegramMessage, telegramEnabled } from '@/lib/telegram'

export const VERIFICATION_ACTIONS = [
  'loan_repay',
  'saving_add',
  'capital_request',
  'loan_request',
] as const

export type VerificationAction = (typeof VERIFICATION_ACTIONS)[number]

export function isVerificationAction(value: string): value is VerificationAction {
  return (VERIFICATION_ACTIONS as readonly string[]).includes(value)
}

const ACTION_LABELS: Record<VerificationAction, string> = {
  loan_repay: 'ការសងកម្ជី',
  saving_add: 'ការដាក់សន្សំ',
  capital_request: 'ការស្នើសុំដើមទុន',
  loan_request: 'ការស្នើសុំកម្ជី',
}

const CODE_TTL_MS = 5 * 60_000
const RESEND_COOLDOWN_MS = 60_000
// Once confirmed, the member may complete the action within this window
// (long enough to scan/pay a 10-minute KHQR without re-verifying).
const VERIFIED_WINDOW_MS = 15 * 60_000
const MAX_ATTEMPTS = 5

function hashCode(memberId: string, code: string) {
  return createHash('sha256').update(`${memberId}:${code}`).digest('hex')
}

export type SendCodeResult =
  | { ok: true; expiresAt: number; alreadyVerified?: boolean }
  | { ok: false; reason: 'not_linked' | 'cooldown' | 'send_failed' | 'disabled' }

export async function sendVerificationCode(
  memberId: string,
  action: VerificationAction
): Promise<SendCodeResult> {
  const admin = createAdminClient()

  // Skip straight through when the member confirmed this action recently.
  if (await hasRecentVerification(memberId, action)) {
    return { ok: true, expiresAt: Date.now(), alreadyVerified: true }
  }

  if (!telegramEnabled()) return { ok: false, reason: 'disabled' }

  const { data: member, error: memberError } = await admin
    .from('members')
    .select('telegram_chat_id')
    .eq('id', memberId)
    .maybeSingle()

  if (memberError) throw memberError
  if (!member?.telegram_chat_id) return { ok: false, reason: 'not_linked' }

  const { data: latest, error: latestError } = await admin
    .from('verification_codes')
    .select('created_at')
    .eq('member_id', memberId)
    .eq('action', action)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latestError) throw latestError
  if (latest && Date.now() - new Date(latest.created_at).getTime() < RESEND_COOLDOWN_MS) {
    return { ok: false, reason: 'cooldown' }
  }

  const code = randomInt(0, 1_000_000).toString().padStart(6, '0')
  const expiresAt = Date.now() + CODE_TTL_MS

  const { error: insertError } = await admin.from('verification_codes').insert({
    member_id: memberId,
    action,
    code_hash: hashCode(memberId, code),
    expires_at: new Date(expiresAt).toISOString(),
  })

  if (insertError) throw insertError

  const sent = await sendTelegramMessage(
    member.telegram_chat_id,
    [
      '🔐 <b>លេខកូដផ្ទៀងផ្ទាត់</b>',
      '',
      `លេខកូដសម្រាប់${ACTION_LABELS[action]}៖ <b>${code}</b>`,
      '',
      'កូដនេះមានសុពលភាព ៥ នាទី។ កុំចែករំលែកវាជាមួយនរណាម្នាក់ឡើយ។',
    ].join('\n')
  )

  if (!sent) return { ok: false, reason: 'send_failed' }

  return { ok: true, expiresAt }
}

export type VerifyCodeResult =
  | { ok: true }
  | { ok: false; reason: 'invalid' | 'expired' | 'too_many_attempts' }

export async function verifyCode(
  memberId: string,
  action: VerificationAction,
  code: string
): Promise<VerifyCodeResult> {
  const admin = createAdminClient()

  const { data: row, error } = await admin
    .from('verification_codes')
    .select('id, code_hash, expires_at, attempts, verified_at')
    .eq('member_id', memberId)
    .eq('action', action)
    .is('verified_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!row || new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, reason: 'expired' }
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    return { ok: false, reason: 'too_many_attempts' }
  }

  const matches = row.code_hash === hashCode(memberId, code.trim())

  const { error: updateError } = await admin
    .from('verification_codes')
    .update({
      attempts: row.attempts + 1,
      verified_at: matches ? new Date().toISOString() : null,
    })
    .eq('id', row.id)

  if (updateError) throw updateError

  return matches ? { ok: true } : { ok: false, reason: 'invalid' }
}

/** True when the member confirmed a code for this action within the window. */
export async function hasRecentVerification(
  memberId: string,
  action: VerificationAction
): Promise<boolean> {
  const admin = createAdminClient()
  const since = new Date(Date.now() - VERIFIED_WINDOW_MS).toISOString()

  const { data, error } = await admin
    .from('verification_codes')
    .select('id')
    .eq('member_id', memberId)
    .eq('action', action)
    .gte('verified_at', since)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return Boolean(data)
}
