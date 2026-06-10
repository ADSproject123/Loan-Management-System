'use server'

import { createClient } from '@/lib/supabase/server'
import { getMemberHomePath } from '@/lib/auth/member'
import type { ActionResult } from '@/app/actions/member'

export async function signInMember(email: string, password: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, error: 'អ៊ីមែល ឬ ពាក្យសម្ងាត់មិនត្រឹមត្រូវ។' }
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
