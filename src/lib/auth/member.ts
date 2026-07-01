import 'server-only'

import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isStaleAuthSessionError } from '@/lib/auth/session'
import type { Member } from '@/types/database'

export const getCurrentMember = cache(async (): Promise<Member | null> => {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error && isStaleAuthSessionError(error)) {
    await supabase.auth.signOut()
    return null
  }

  if (!user) return null

  const { data } = await supabase
    .from('members')
    .select('*')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  return data as Member | null
})

export function getMemberHomePath(member: Pick<Member, 'status' | 'is_admin'>): string {
  if (member.is_admin && member.status === 'active') {
    return '/admin'
  }

  if (member.status === 'active') {
    return '/dashboard'
  }

  return '/pending-approval'
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

  if (member.is_admin) {
    redirect('/admin')
  }

  if (member.status !== 'active') {
    redirect('/pending-approval')
  }

  return member
}

export async function requireAdmin(): Promise<Member> {
  const member = await requireMember()

  if (!member.is_admin || member.status !== 'active') {
    if (member.status === 'active') {
      redirect('/dashboard')
    }

    redirect('/pending-approval')
  }

  return member
}
