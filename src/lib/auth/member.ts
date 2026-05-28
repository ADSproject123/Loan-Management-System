import 'server-only'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Member } from '@/types/database'

export async function getCurrentMember(): Promise<Member | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from('members')
    .select('*')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  return data as Member | null
}

export async function requireMember(): Promise<Member> {
  const member = await getCurrentMember()

  if (!member) {
    redirect('/login')
  }

  return member
}

export async function requireActiveMember(): Promise<Member> {
  const member = await requireMember()

  if (member.status !== 'active') {
    redirect('/dashboard')
  }

  return member
}

export async function requireAdmin(): Promise<Member> {
  const member = await requireMember()

  if (!member.is_admin || member.status !== 'active') {
    redirect('/dashboard')
  }

  return member
}
