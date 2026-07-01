import type { AuthError } from '@supabase/supabase-js'

/** Session cookies exist but Supabase no longer has a valid refresh token. */
export function isStaleAuthSessionError(error: AuthError | null | undefined): boolean {
  if (!error) return false

  if (
    error.code === 'refresh_token_not_found' ||
    error.code === 'session_not_found' ||
    error.code === 'session_expired'
  ) {
    return true
  }

  const message = error.message.toLowerCase()
  return (
    message.includes('refresh token not found') ||
    message.includes('invalid refresh token')
  )
}
