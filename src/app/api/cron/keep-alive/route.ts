import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

function isAuthorized(request: NextRequest) {
  const expected = process.env.CRON_SECRET
  if (!expected) return false
  return request.headers.get('authorization') === `Bearer ${expected}`
}

/**
 * Hit every few hours by the GitHub Actions "keep Supabase alive" workflow.
 * Supabase free-tier projects auto-pause after a few days with no API
 * activity - this does a trivial read purely to keep the project warm, no
 * business logic. See referee-invite-expiry / loan-payment-reminders for the
 * cron endpoints that do actual work.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from('members').select('id', { count: 'exact', head: true }).limit(1)

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 502 })
  }

  return NextResponse.json({ ok: true, pingedAt: new Date().toISOString() })
}
