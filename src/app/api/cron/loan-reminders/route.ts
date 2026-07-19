import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getInterestSettings } from '@/lib/interest'
import { sendTelegramMessage } from '@/lib/telegram'
import { formatMoney, normalizeCurrency } from '@/lib/currency'
import {
  buildLoanDueRowsForMonth,
  type ActiveLoanDueRow,
  type LoanDuePaymentRow,
  type LoanRepaymentAmountRow,
} from '@/lib/admin/loanRepaymentDue'

export const dynamic = 'force-dynamic'

function isAuthorized(request: NextRequest) {
  const expected = process.env.CRON_SECRET
  if (!expected) return false
  return request.headers.get('authorization') === `Bearer ${expected}`
}

function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function daysBetween(fromIso: string, toIso: string) {
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime()
  return Math.max(0, Math.round(ms / 86_400_000))
}

/**
 * Hit by the GitHub Actions "loan payment reminders" workflow on the 10th
 * (payment due today) and the 15th (payment overdue) of every month.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const todayIso = new Date().toISOString().slice(0, 10)
  const day = Number(todayIso.slice(8, 10))
  const mode = day === 10 ? 'due' : day === 15 ? 'overdue' : null

  if (!mode) {
    return NextResponse.json({ ok: true, skipped: true, reason: `not the 10th or 15th (day ${day})` })
  }

  const year = Number(todayIso.slice(0, 4))
  const month = Number(todayIso.slice(5, 7))

  const admin = createAdminClient()
  const interestSettings = await getInterestSettings()

  const [{ data: activeLoans }, { data: loanRepayments }, { data: loanDuePayments }] = await Promise.all([
    admin
      .from('loans')
      .select(
        'id, member_id, amount, currency, term_months, monthly_interest_rate, start_date, disbursed_at, created_at, members:members!loans_member_id_fkey(full_name, full_name_kh, full_name_en, phone)'
      )
      .eq('status', 'active'),
    admin.from('loan_repayments').select('loan_id, amount, status'),
    admin.from('loan_due_payments').select('id, loan_id, period_year, period_month, status'),
  ])

  const rows = buildLoanDueRowsForMonth(
    (activeLoans ?? []) as ActiveLoanDueRow[],
    (loanRepayments ?? []) as LoanRepaymentAmountRow[],
    interestSettings.monthlyLoanInterestRate,
    year,
    month,
    todayIso,
    (loanDuePayments ?? []) as LoanDuePaymentRow[]
  )

  const targets = rows.filter((row) =>
    mode === 'due' ? row.dueDate === todayIso && row.status === 'pending' : row.isOverdue
  )

  if (targets.length === 0) {
    return NextResponse.json({ ok: true, mode, notified: 0 })
  }

  const { data: contacts } = await admin
    .from('members')
    .select('id, telegram_chat_id')
    .in('id', [...new Set(targets.map((row) => row.memberId))])

  const chatIdByMember = new Map((contacts ?? []).map((m) => [m.id, m.telegram_chat_id as string | null]))

  let notified = 0
  let skippedNoTelegram = 0

  for (const row of targets) {
    const amount = formatMoney(row.dueAmount, normalizeCurrency(row.currency))
    const dueDate = row.dueDate ? fmtDate(row.dueDate) : ''

    const title = mode === 'due' ? 'ដល់ថ្ងៃត្រូវបង់ប្រាក់កម្ចី' : 'ប្រាក់កម្ចីហួសកំណត់បង់'
    const message =
      mode === 'due'
        ? `ថ្ងៃនេះជាកាលបរិច្ឆេទត្រូវបង់រំលស់កម្ចីរបស់អ្នក។ ចំនួនត្រូវបង់ ${amount} (កំណត់ ${dueDate})។`
        : `ការបង់រំលស់កម្ចីរបស់អ្នកសម្រាប់ខែនេះហួសកំណត់ពេលទូទាត់ហើយ (${daysBetween(row.dueDate ?? todayIso, todayIso)} ថ្ងៃ)។ ចំនួនត្រូវបង់ ${amount} (កំណត់ ${dueDate})។`

    await admin.from('notifications').insert({
      member_id: row.memberId,
      title,
      message,
      type: mode === 'due' ? 'info' : 'warning',
    })

    const chatId = chatIdByMember.get(row.memberId)
    if (!chatId) {
      skippedNoTelegram += 1
      continue
    }

    const telegramText =
      mode === 'due'
        ? `🔔 <b>រំលឹកបង់ប្រាក់កម្ចី</b>\n\nថ្ងៃនេះជាកាលបរិច្ឆេទត្រូវបង់រំលស់កម្ចីរបស់អ្នក។\n💵 <b>ចំនួនត្រូវបង់:</b> ${amount}\n📅 <b>ថ្ងៃកំណត់:</b> ${dueDate}\n\nសូមបង់ប្រាក់តាមរយៈ /payloan ក្នុងតេលេក្រាម។`
        : `⚠️ <b>រំលឹកបង់ប្រាក់កម្ចីហួសកំណត់</b>\n\nការបង់រំលស់កម្ចីរបស់អ្នកសម្រាប់ខែនេះហួសកំណត់ពេលទូទាត់ហើយ។\n💵 <b>ចំនួនត្រូវបង់:</b> ${amount}\n📅 <b>ថ្ងៃកំណត់:</b> ${dueDate} <i>(ហួសកំណត់ ${daysBetween(row.dueDate ?? todayIso, todayIso)} ថ្ងៃ)</i>\n\nសូមបង់ប្រាក់តាមរយៈ /payloan ក្នុងតេលេក្រាម ឬទាក់ទងអ្នកគ្រប់គ្រងជាបន្ទាន់។`

    await sendTelegramMessage(chatId, telegramText)
    notified += 1
  }

  return NextResponse.json({ ok: true, mode, notified, skippedNoTelegram })
}
