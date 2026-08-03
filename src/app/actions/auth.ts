'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getMemberHomePath } from '@/lib/auth/member'
import { phonesMatch, normalizePhoneDigits } from '@/lib/phone'
import { sendVerificationCode, verifyCode } from '@/lib/verification'
import type { ActionResult } from '@/app/actions/member'

const INVALID_CREDENTIALS_ERROR = 'អ៊ីមែល/លេខទូរស័ព្ទ ឬ ពាក្យសម្ងាត់មិនត្រឹមត្រូវ។'
const RESET_ACCOUNT_UNAVAILABLE_ERROR =
  'រកមិនឃើញគណនី ឬគណនីនេះមិនទាន់ភ្ជាប់ជាមួយ Telegram ដើម្បីទទួលលេខកូដទេ។ សូមទាក់ទងអ្នកគ្រប់គ្រង។'

/**
 * Registration never sets a phone number on the Supabase Auth user itself
 * (only on the `members` table — see registerMember) — Supabase has no
 * native phone/password sign-in path here. So a non-email identifier is
 * resolved to the member's actual Auth email (real or the synthesized
 * `<digits>@member.local` address from registration) via a service-role
 * lookup, then signed in normally through the same email/password call.
 */
async function resolveAuthEmail(identifier: string): Promise<string | null> {
  const normalized = normalizePhoneDigits(identifier)
  if (!normalized) return null

  const admin = createAdminClient()
  const { data: candidates } = await admin
    .from('members')
    .select('auth_user_id, phone')
    .not('phone', 'is', null)

  const matches = (candidates ?? []).filter((m) => phonesMatch(m.phone, identifier))
  // Require exactly one match — members.phone has no uniqueness constraint,
  // so treat zero or multiple matches the same as "not found" rather than
  // guessing, and never reveal which case it was.
  if (matches.length !== 1 || !matches[0].auth_user_id) return null

  const { data: userData, error } = await admin.auth.admin.getUserById(matches[0].auth_user_id)
  if (error || !userData.user?.email) return null

  return userData.user.email
}

export async function signInMember(identifier: string, password: string): Promise<ActionResult> {
  try {
    const trimmed = identifier.trim()
    if (!trimmed || !password) {
      return { success: false, error: INVALID_CREDENTIALS_ERROR }
    }

    const email = trimmed.includes('@') ? trimmed : await resolveAuthEmail(trimmed)
    if (!email) {
      return { success: false, error: INVALID_CREDENTIALS_ERROR }
    }

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, error: INVALID_CREDENTIALS_ERROR }
    }

    if (!data.user) {
      return { success: false, error: 'មិនអាចចូលគណនីបានទេនៅពេលនេះ។ សូមព្យាយាមម្តងទៀត។' }
    }

    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, status, is_admin')
      .eq('auth_user_id', data.user.id)
      .maybeSingle()

    if (memberError) {
      await supabase.auth.signOut()
      return { success: false, error: 'មានបញ្ហាក្នុងការទាញយកព័ត៌មានសមាជិក។' }
    }

    if (!member) {
      await supabase.auth.signOut()
      return {
        success: false,
        error: 'គណនីចូលរបស់អ្នកមាន ប៉ុន្តែរកមិនឃើញប្រវត្តិរូបសមាជិក។ សូមចុះឈ្មោះម្តងទៀត ឬ ស្នើសុំឱ្យអ្នកគ្រប់គ្រងភ្ជាប់គណនីរបស់អ្នក។',
      }
    }

    return { success: true, redirectTo: getMemberHomePath(member) }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'មិនអាចចូលគណនីបានទេនៅពេលនេះ។ សូមព្យាយាមម្តងទៀត។'
    return { success: false, error: message }
  }
}

/**
 * Resolves a login identifier (email or phone) to a member row, the same way
 * resolveAuthEmail does for sign-in - requiring exactly one phone match,
 * since members.phone has no uniqueness constraint. Used pre-auth (no
 * session yet), so this always goes through the service-role client.
 */
async function resolveMemberByIdentifier(identifier: string) {
  const trimmed = identifier.trim()
  if (!trimmed) return null

  const admin = createAdminClient()

  if (trimmed.includes('@')) {
    const { data } = await admin
      .from('members')
      .select('id, auth_user_id, telegram_chat_id')
      .eq('email', trimmed.toLowerCase())
      .maybeSingle()
    return data?.auth_user_id ? data : null
  }

  const normalized = normalizePhoneDigits(trimmed)
  if (!normalized) return null

  const { data: candidates } = await admin
    .from('members')
    .select('id, auth_user_id, telegram_chat_id, phone')
    .not('phone', 'is', null)

  const matches = (candidates ?? []).filter((m) => phonesMatch(m.phone, trimmed))
  if (matches.length !== 1 || !matches[0].auth_user_id) return null

  return matches[0]
}

/**
 * Step 1 of forgot-password: resolve the identifier and, if the account has
 * Telegram linked, send a one-time code there (never email - most members
 * only have a synthesized/placeholder auth email, not a real inbox). Always
 * returns the same generic message on any kind of failure (not found, no
 * phone/email match, not linked) to avoid revealing account existence.
 */
export async function requestPasswordReset(identifier: string): Promise<ActionResult> {
  try {
    const member = await resolveMemberByIdentifier(identifier)
    if (!member?.telegram_chat_id) {
      return { success: false, error: RESET_ACCOUNT_UNAVAILABLE_ERROR }
    }

    const result = await sendVerificationCode(member.id, 'password_reset')
    if (!result.ok && result.reason !== 'cooldown') {
      return { success: false, error: RESET_ACCOUNT_UNAVAILABLE_ERROR }
    }

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'មិនអាចផ្ញើលេខកូដបានទេ។ សូមព្យាយាមម្តងទៀត។'
    return { success: false, error: message }
  }
}

/** Step 2: verify the code and, on success, set the new password directly (never Supabase's email-link reset flow). */
export async function confirmPasswordReset(params: {
  identifier: string
  code: string
  newPassword: string
  confirmPassword: string
}): Promise<ActionResult> {
  try {
    const { identifier, code, newPassword, confirmPassword } = params

    if (!code || !newPassword || !confirmPassword) {
      return { success: false, error: 'សូមបំពេញគ្រប់វាលទាំងអស់ដែលត្រូវការ។' }
    }
    if (newPassword.length < 8) {
      return { success: false, error: 'ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច ៨ តួអក្សរ។' }
    }
    if (newPassword !== confirmPassword) {
      return { success: false, error: 'ការបញ្ជាក់ពាក្យសម្ងាត់ថ្មីមិនត្រូវគ្នាទេ។' }
    }

    const member = await resolveMemberByIdentifier(identifier)
    if (!member?.auth_user_id) {
      return { success: false, error: RESET_ACCOUNT_UNAVAILABLE_ERROR }
    }

    const verifyResult = await verifyCode(member.id, 'password_reset', code)
    if (!verifyResult.ok) {
      const message =
        verifyResult.reason === 'invalid'
          ? 'លេខកូដមិនត្រឹមត្រូវទេ។'
          : verifyResult.reason === 'too_many_attempts'
            ? 'អ្នកបានព្យាយាមច្រើនដងពេក។ សូមស្នើសុំលេខកូដថ្មី។'
            : 'លេខកូដនេះផុតកំណត់ ឬមិនត្រឹមត្រូវទេ។ សូមស្នើសុំលេខកូដថ្មី។'
      return { success: false, error: message }
    }

    const admin = createAdminClient()
    const { error: updateError } = await admin.auth.admin.updateUserById(member.auth_user_id, {
      password: newPassword,
    })
    if (updateError) throw updateError

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'មិនអាចប្តូរពាក្យសម្ងាត់បានទេ។'
    return { success: false, error: message }
  }
}
