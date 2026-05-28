'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/app/actions/member'

export async function signInMember(email: string, password: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data.user) {
      return { success: false, error: 'Unable to sign in right now. Please try again.' }
    }

    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id')
      .eq('auth_user_id', data.user.id)
      .maybeSingle()

    if (memberError) {
      await supabase.auth.signOut()
      return { success: false, error: memberError.message }
    }

    if (!member) {
      await supabase.auth.signOut()
      return {
        success: false,
        error: 'Your login exists, but no member profile was found. Please register again or ask an admin to link your account.',
      }
    }

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to sign in right now. Please try again.'
    return { success: false, error: message }
  }
}
