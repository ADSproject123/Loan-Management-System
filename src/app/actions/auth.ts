'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getMemberHomePath } from '@/lib/auth/member'
import { phonesMatch, normalizePhoneDigits } from '@/lib/phone'
import type { ActionResult } from '@/app/actions/member'

const INVALID_CREDENTIALS_ERROR = 'អ៊ីមែល/លេខទូរស័ព្ទ ឬ ពាក្យសម្ងាត់មិនត្រឹមត្រូវ។'

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
