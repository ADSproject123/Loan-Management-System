import { NextResponse, type NextRequest } from 'next/server'
import { formatMoney } from '@/lib/currency'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  sendTelegramMessage,
  sendTelegramMessageRemoveKeyboard,
  sendTelegramMessageWithAppButton,
} from '@/lib/telegram'
import {
  buildLoanPaymentSchedule,
  annotateLoanPaymentSchedule,
  resolveLoanInterestRate,
  DEFAULT_LOAN_INTEREST_RATE,
} from '@/lib/interestCalculations'
import type { SavingStatus } from '@/types/database'

export const dynamic = 'force-dynamic'

interface TelegramUpdate {
  message?: {
    text?: string
    chat?: { id: number }
    from?: { first_name?: string }
  }
}

const WELCOME_NO_TOKEN =
  '👋 សួស្តី!\n\n' +
  'ដើម្បីភ្ជាប់គណនី សូមប្រើ <b>តំណភ្ជាប់ផ្ទាល់ខ្លួន</b> ពីអ្នកគ្រប់គ្រង ឬ ចូលគណនីក្នុងកម្មវិធីហើយទៅ <b>ភ្ជាប់ Telegram</b>។\n\n' +
  'To link your account, use your personal connect link from the admin, or sign in to the app and open <b>Connect Telegram</b>.'

const NOT_LINKED =
  '🔗 គណនី Telegram របស់អ្នកមិនទាន់ភ្ជាប់ទេ។ សូមប្រើតំណភ្ជាប់ផ្ទាល់ខ្លួនពីអ្នកគ្រប់គ្រង ឬ ចូលគណនីក្នុងកម្មវិធី។\n\n' +
  'Your Telegram account is not linked yet. Please use your personal connect link or sign in to the app.'

const STATUS_EMOJI: Record<SavingStatus, string> = {
  pending:   '⏳',
  verified:  '✅',
  completed: '🏁',
  refunded:  '↩️',
}

const STATUS_LABEL: Record<SavingStatus, string> = {
  pending:   'Pending',
  verified:  'Verified',
  completed: 'Completed',
  refunded:  'Refunded',
}

const LOAN_STATUS_LABEL: Record<string, string> = {
  pending:      'Pending',
  under_review: 'Under Review',
  approved:     'Approved',
  active:       'Active',
  completed:    'Completed',
  rejected:     'Rejected',
}

const SCHEDULE_STATUS_EMOJI: Record<string, string> = {
  paid:    '✅',
  partial: '🔶',
  overdue: '❗',
  pending: '⏳',
}

function fmtMoney(amount: number | null) {
  if (amount === null) return formatMoney(0)
  return formatMoney(amount)
}

function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

async function linkTelegramChat(memberId: string, chatId: string): Promise<{ ok: boolean; duplicate?: boolean }> {
  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('members')
    .select('id')
    .eq('telegram_chat_id', chatId)
    .neq('id', memberId)
    .maybeSingle()

  if (existing) {
    return { ok: false, duplicate: true }
  }

  const { error } = await admin
    .from('members')
    .update({ telegram_chat_id: chatId })
    .eq('id', memberId)

  if (error) {
    const isDuplicate =
      error.code === '23505' || error.message?.includes('members_telegram_chat_id_unique')
    return { ok: false, duplicate: isDuplicate }
  }

  return { ok: true }
}

async function handleStartWithToken(chatId: string, token: string) {
  const admin = createAdminClient()
  const { data: member } = await admin
    .from('members')
    .select('id, full_name_kh, full_name_en')
    .eq('telegram_connect_token', token)
    .maybeSingle()

  if (!member) {
    await sendTelegramMessage(
      chatId,
      '⚠️ តំណភ្ជាប់នេះមិនត្រឹមត្រូវ ឬផុតកំណត់។ សូមស្នើតំណថ្មីពីអ្នកគ្រប់គ្រង ឬ ចូលគណនីក្នុងកម្មវិធី។\n\n' +
        'This connection link is invalid or expired. Please ask the admin for a new link or sign in to the app.'
    )
    return
  }

  const result = await linkTelegramChat(member.id, chatId)

  if (!result.ok) {
    await sendTelegramMessage(
      chatId,
      result.duplicate
        ? '⛔ គណនី Telegram នេះត្រូវបានភ្ជាប់ជាមួយសមាជិកដទៃរួចហើយ។\n\nThis Telegram account is already linked to another member.'
        : '❌ មានបញ្ហាក្នុងការភ្ជាប់។ សូមព្យាយាមម្តងទៀតពេលក្រោយ។\n\nSomething went wrong linking your account. Please try again later.'
    )
    return
  }

  const name = member.full_name_kh ?? member.full_name_en ?? ''
  await sendTelegramMessageRemoveKeyboard(
    chatId,
    `✅ <b>បានភ្ជាប់ដោយជោគជ័យ!</b>\nគណនី <b>${name}</b> ត្រូវបានភ្ជាប់ហើយ។\n\n` +
      '<b>Connected!</b> You will now receive notifications here.'
  )
}

async function handleSavingCommand(chatId: string): Promise<void> {
  const admin = createAdminClient()

  const { data: member } = await admin
    .from('members')
    .select('id, full_name_kh, full_name_en')
    .eq('telegram_chat_id', chatId)
    .maybeSingle()

  if (!member) {
    await sendTelegramMessageWithAppButton(chatId, NOT_LINKED)
    return
  }

  const { data: savings } = await admin
    .from('savings')
    .select('amount, saving_date, status, currency')
    .eq('member_id', member.id)
    .neq('status', 'refunded')
    .order('saving_date', { ascending: false })
    .limit(50)

  const rows = savings ?? []

  if (rows.length === 0) {
    await sendTelegramMessageWithAppButton(
      chatId,
      '💰 <b>ការសន្សំ / Savings</b>\n\nអ្នកមិនទាន់មានការសន្សំណាមួយទេ។\nYou have no savings records yet.'
    )
    return
  }

  let totalVerified = 0
  let totalPending = 0
  for (const r of rows) {
    const amt = Number(r.amount ?? 0)
    if (r.status === 'verified' || r.status === 'completed') totalVerified += amt
    else if (r.status === 'pending') totalPending += amt
  }
  const grandTotal = totalVerified + totalPending

  const name = member.full_name_kh ?? member.full_name_en ?? ''

  const recent = rows.slice(0, 8)
  const recentLines = recent
    .map((r) => {
      const st = r.status as SavingStatus
      return `  ${STATUS_EMOJI[st]} ${fmtDate(r.saving_date)}  ${fmtMoney(r.amount)}  <i>${STATUS_LABEL[st]}</i>`
    })
    .join('\n')

  const moreNote = rows.length > 8 ? `\n<i>… and ${rows.length - 8} more. Open the app to see all.</i>` : ''

  const msg =
    `💰 <b>ការសន្សំ</b>\n` +
    `👤 ${name}\n\n` +
    `<b>សរុប:</b> ${fmtMoney(grandTotal)}\n` +
    `✅ <b>បានត្រួតពិនិត្យ:</b> ${fmtMoney(totalVerified)}\n` +
    `⏳ <b>កំពុងរង់ចាំការត្រួតពិនិត្យ:</b> ${fmtMoney(totalPending)}\n\n` +
    `<b>ប្រវត្តិចុងក្រោយ:</b>\n` +
    recentLines +
    moreNote

  await sendTelegramMessageWithAppButton(chatId, msg)
}

async function handleLoanCommand(chatId: string): Promise<void> {
  const admin = createAdminClient()

  const { data: member } = await admin
    .from('members')
    .select('id, full_name_kh, full_name_en')
    .eq('telegram_chat_id', chatId)
    .maybeSingle()

  if (!member) {
    await sendTelegramMessageWithAppButton(chatId, NOT_LINKED)
    return
  }

  const { data: loan } = await admin
    .from('loans')
    .select('id, amount, currency, status, term_months, monthly_interest_rate, start_date, due_date')
    .eq('member_id', member.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!loan) {
    const { data: anyLoan } = await admin
      .from('loans')
      .select('status')
      .eq('member_id', member.id)
      .neq('status', 'rejected')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const statusMsg = anyLoan
      ? `\n\nស្ថានភាព: <b>${LOAN_STATUS_LABEL[anyLoan.status] ?? anyLoan.status}</b>`
      : ''

    await sendTelegramMessageWithAppButton(
      chatId,
      `🏦 <b>ប្រាក់កម្ចី / Loan</b>\n\nអ្នកមិនមានប្រាក់កម្ចីសកម្មទេ។\nYou have no active loan.${statusMsg}`
    )
    return
  }

  const { data: settings } = await admin
    .from('interest_settings')
    .select('monthly_loan_interest_rate')
    .eq('id', 1)
    .maybeSingle()

  const fallbackRate = Number(settings?.monthly_loan_interest_rate ?? DEFAULT_LOAN_INTEREST_RATE)
  const rate = resolveLoanInterestRate(loan, fallbackRate)
  const principal = Number(loan.amount ?? 0)
  const termMonths = Number(loan.term_months ?? 12)

  const { data: repayments } = await admin
    .from('loan_repayments')
    .select('amount, status')
    .eq('loan_id', loan.id)
    .neq('status', 'refunded')

  let totalPaid = 0
  let totalPending = 0
  for (const r of repayments ?? []) {
    const amt = Number(r.amount ?? 0)
    if (r.status === 'verified' || r.status === 'completed') totalPaid += amt
    else if (r.status === 'pending') totalPending += amt
  }

  const schedule = buildLoanPaymentSchedule(principal, termMonths, rate, loan.start_date)
  const annotated = annotateLoanPaymentSchedule(schedule, totalPaid, new Date(), totalPending)

  const totalOwed = annotated.reduce((s, r) => s + r.amount, 0)
  const remaining = Math.max(0, totalOwed - totalPaid)

  const name = member.full_name_kh ?? member.full_name_en ?? ''
  const unpaidCount = annotated.filter(r => r.status !== 'paid').length

  const parts: string[] = [
    `🏦 <b>ប្រាក់កម្ចី / Loan Report</b>`,
    `👤 ${name}`,
    ``,
    `💵 <b>ចំនួន:</b> ${fmtMoney(principal)}  |  📅 <b>រយៈពេល:</b> ${termMonths} ខែ`,
    `📈 <b>ការប្រាក់:</b> ${rate}%/ខែ`,
    ...(loan.due_date ? [`⏰ <b>ផុតកំណត់:</b> ${fmtDate(loan.due_date)}`] : []),
    ``,
    `💳 <b>បានបង់:</b> ${fmtMoney(totalPaid)}`,
    ...(totalPending > 0 ? [`⏳ <b>កំពុងផ្ទៀងផ្ទាត់:</b> ${fmtMoney(totalPending)}`] : []),
    `💸 <b>នៅសល់:</b> ${fmtMoney(remaining)}  <i>(${unpaidCount} ខែទៀត)</i>`,
  ]

  const unpaid = annotated.filter(r => r.status !== 'paid')

  if (unpaid.length === 0) {
    parts.push(``, `🎉 <b>អ្នកបានសងកម្ចីទាំងស្រុងហើយ!</b>`)
  } else {
    parts.push(``, `<b>📋 ការបង់ប្រចាំខែ / Monthly Schedule:</b>`)

    const shown = unpaid.slice(0, 12)
    for (const row of shown) {
      const emoji = SCHEDULE_STATUS_EMOJI[row.status] ?? '⏳'
      const dateStr = row.dueDate ? fmtDate(row.dueDate) : `ខែ ${row.month}`
      const paidNote = row.paidAmount > 0
        ? `  <i>(បានបង់ ${fmtMoney(row.paidAmount)})</i>`
        : ''
      parts.push(`  ${emoji} ${dateStr}  —  ${fmtMoney(row.amount)}${paidNote}`)
    }

    if (unpaid.length > 12) {
      parts.push(`  <i>… និង ${unpaid.length - 12} ខែទៀត។ បើកកម្មវិធីដើម្បីមើលទាំងអស់។</i>`)
    }
  }

  await sendTelegramMessageWithAppButton(chatId, parts.join('\n'))
}

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET
  const got = request.headers.get('x-telegram-bot-api-secret-token')
  console.log('[Webhook] secret check — expected:', expectedSecret ? '(set)' : '(not set)', '| got:', got ? '(present)' : '(missing)')

  if (expectedSecret) {
    if (got !== expectedSecret) {
      console.error('[Webhook] Secret mismatch — rejecting request')
      return NextResponse.json({ ok: false }, { status: 401 })
    }
  }

  let update: TelegramUpdate
  try {
    update = (await request.json()) as TelegramUpdate
  } catch {
    return NextResponse.json({ ok: true })
  }

  const message = update.message
  const chatId = message?.chat?.id
  const text = message?.text?.trim() ?? ''

  console.log('[Webhook] update — chatId:', chatId, '| text:', text)

  if (!chatId) return NextResponse.json({ ok: true })

  const chatIdStr = String(chatId)

  if (text === '/saving' || text.startsWith('/saving@')) {
    await handleSavingCommand(chatIdStr)
    return NextResponse.json({ ok: true })
  }

  if (text === '/loan' || text.startsWith('/loan@')) {
    await handleLoanCommand(chatIdStr)
    return NextResponse.json({ ok: true })
  }

  if (text.startsWith('/start')) {
    const token = text.slice('/start'.length).trim()

    if (!token) {
      console.log('[Webhook] /start with no token — sending welcome to', chatIdStr)
      await sendTelegramMessageWithAppButton(chatIdStr, WELCOME_NO_TOKEN)
      return NextResponse.json({ ok: true })
    }

    await handleStartWithToken(chatIdStr, token)
    return NextResponse.json({ ok: true })
  }

  await sendTelegramMessageWithAppButton(chatIdStr, WELCOME_NO_TOKEN)
  return NextResponse.json({ ok: true })
}
