import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchExpiredAwaitingRefereeLoans, expireAwaitingRefereeLoan } from '@/lib/loanReferee'

export const dynamic = 'force-dynamic'

function isAuthorized(request: NextRequest) {
  const expected = process.env.CRON_SECRET
  if (!expected) return false
  return request.headers.get('authorization') === `Bearer ${expected}`
}

/**
 * Daily sweep for loan requests stuck in awaiting_referee past
 * REFEREE_RESPONSE_TIMEOUT_DAYS — rejects them and notifies everyone involved.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const expired = await fetchExpiredAwaitingRefereeLoans(admin)

  let expiredCount = 0
  for (const loan of expired) {
    const didExpire = await expireAwaitingRefereeLoan(admin, loan.id)
    if (didExpire) expiredCount += 1
  }

  return NextResponse.json({ ok: true, checked: expired.length, expired: expiredCount })
}
