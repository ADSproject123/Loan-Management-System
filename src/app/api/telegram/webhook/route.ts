import { NextResponse, type NextRequest } from 'next/server'
import { randomUUID } from 'crypto'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { formatMoney } from '@/lib/currency'
import { createAdminClient } from '@/lib/supabase/admin'
import { getR2Client, getR2BucketName } from '@/lib/r2'
import {
  sendTelegramMessage,
  sendTelegramMessageWithCommandButtons,
  sendTelegramPhoto,
  getTelegramFileDownloadUrl,
  answerTelegramCallbackQuery,
} from '@/lib/telegram'
import {
  buildLoanPaymentSchedule,
  annotateLoanPaymentSchedule,
  resolveLoanInterestRate,
  DEFAULT_LOAN_INTEREST_RATE,
} from '@/lib/interestCalculations'
import { getInterestSettings, fetchMemberLoanInterestRate } from '@/lib/interest'
import { addMonths, todayIso } from '@/lib/dates'
import { fetchMemberLoanEligibility, validateLoanRequestAmount } from '@/lib/loanEligibility'
import {
  getPendingPayment,
  setPendingPayment,
  clearPendingPayment,
  getPendingLoanRequest,
  setPendingLoanRequest,
  clearPendingLoanRequest,
} from '@/lib/telegramConversationState'
import type { SavingStatus } from '@/types/database'

export const dynamic = 'force-dynamic'

// Conversation state (mid-payment / mid-loan-request) is persisted in Supabase
// via telegramConversationState — it must survive across serverless instances.

// ---------------------------------------------------------------------------
// Telegram update shape
// ---------------------------------------------------------------------------
interface TelegramUpdate {
  message?: {
    text?: string
    caption?: string
    chat?: { id: number }
    from?: { first_name?: string }
    photo?: Array<{ file_id: string; width: number; height: number; file_size?: number }>
    document?: { file_id: string; mime_type?: string; file_name?: string }
  }
  callback_query?: {
    id: string
    from?: { id: number }
    message?: { chat?: { id: number } }
    data?: string
  }
}

const WELCOME_NO_TOKEN =
  '👋 សួស្តី!\n\n' +
  'ដើម្បីភ្ជាប់គណនី សូមប្រើ <b>តំណភ្ជាប់ផ្ទាល់ខ្លួន</b> ពីអ្នកគ្រប់គ្រង ឬ ចូលគណនីក្នុងកម្មវិធីហើយទៅ <b>ភ្ជាប់ Telegram</b>។'

const NOT_LINKED =
  '🔗 គណនី Telegram របស់អ្នកមិនទាន់ភ្ជាប់ទេ។ សូមប្រើតំណភ្ជាប់ផ្ទាល់ខ្លួនពីអ្នកគ្រប់គ្រង ឬ ចូលគណនីក្នុងកម្មវិធី។'

const NOT_ACTIVE_MEMBER =
  '⏳ គណនីរបស់អ្នកមិនទាន់សកម្មទេ។ អ្នកមិនអាចប្រើការសន្សំ ឬ កម្ជីបានទេ រហូតដល់អ្នកគ្រប់គ្រងទទួលយកគណនីរបស់អ្នក។'

type LinkedMember = {
  id: string
  status: string
  full_name_kh?: string | null
  full_name_en?: string | null
}

async function requireLinkedActiveMember(chatId: string): Promise<LinkedMember | null> {
  const admin = createAdminClient()
  const { data: member } = await admin
    .from('members')
    .select('id, status, full_name_kh, full_name_en')
    .eq('telegram_chat_id', chatId)
    .maybeSingle()

  if (!member) {
    await sendTelegramMessageWithCommandButtons(chatId, NOT_LINKED)
    return null
  }

  const linked = member as LinkedMember
  if (linked.status !== 'active') {
    await sendTelegramMessageWithCommandButtons(chatId, NOT_ACTIVE_MEMBER)
    return null
  }

  return linked
}

const STATUS_EMOJI: Record<SavingStatus, string> = {
  pending:   '⏳',
  verified:  '✅',
  completed: '🏁',
  refunded:  '↩️',
}

const STATUS_LABEL: Record<SavingStatus, string> = {
  pending:   'រង់ចាំ',
  verified:  'បានផ្ទៀងផ្ទាត់',
  completed: 'បានបញ្ចប់',
  refunded:  'បានសងត្រឡប់',
}

const LOAN_STATUS_LABEL: Record<string, string> = {
  pending:      'រង់ចាំ',
  under_review: 'កំពុងពិនិត្យ',
  approved:     'បានអនុម័ត',
  active:       'សកម្ម',
  completed:    'បានបញ្ចប់',
  rejected:     'បានបដិសេធ',
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
      '⚠️ តំណភ្ជាប់នេះមិនត្រឹមត្រូវ ឬផុតកំណត់។ សូមស្នើតំណថ្មីពីអ្នកគ្រប់គ្រង ឬ ចូលគណនីក្នុងកម្មវិធី។'
    )
    return
  }

  const result = await linkTelegramChat(member.id, chatId)

  if (!result.ok) {
    await sendTelegramMessage(
      chatId,
      result.duplicate
        ? '⛔ គណនី Telegram នេះត្រូវបានភ្ជាប់ជាមួយសមាជិកដទៃរួចហើយ។'
        : '❌ មានបញ្ហាក្នុងការភ្ជាប់។ សូមព្យាយាមម្តងទៀតពេលក្រោយ។'
    )
    return
  }

  const name = member.full_name_kh ?? member.full_name_en ?? ''
  await sendTelegramMessageWithCommandButtons(
    chatId,
    `✅ <b>បានភ្ជាប់ដោយជោគជ័យ!</b>\nគណនី <b>${name}</b> ត្រូវបានភ្ជាប់ហើយ។ អ្នកនឹងទទួលការជូនដំណឹងនៅទីនេះ។`
  )
}

async function handleSavingCommand(chatId: string): Promise<void> {
  const member = await requireLinkedActiveMember(chatId)
  if (!member) return

  const admin = createAdminClient()
  const { data: savings } = await admin
    .from('savings')
    .select('amount, saving_date, status, currency')
    .eq('member_id', member.id)
    .neq('status', 'refunded')
    .order('saving_date', { ascending: false })
    .limit(50)

  const rows = savings ?? []

  if (rows.length === 0) {
    await sendTelegramMessageWithCommandButtons(
      chatId,
      '💰 <b>ការសន្សំ</b>\n\nអ្នកមិនទាន់មានការសន្សំណាមួយទេ។'
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

  const moreNote = rows.length > 8 ? `\n<i>… និង ${rows.length - 8} ទៀត។ បើកកម្មវិធីដើម្បីមើលទាំងអស់។</i>` : ''

  const msg =
    `💰 <b>ការសន្សំ</b>\n` +
    `👤 ${name}\n\n` +
    `<b>សរុប:</b> ${fmtMoney(grandTotal)}\n` +
    `✅ <b>បានត្រួតពិនិត្យ:</b> ${fmtMoney(totalVerified)}\n` +
    `⏳ <b>កំពុងរង់ចាំការត្រួតពិនិត្យ:</b> ${fmtMoney(totalPending)}\n\n` +
    `<b>ប្រវត្តិចុងក្រោយ:</b>\n` +
    recentLines +
    moreNote

  await sendTelegramMessageWithCommandButtons(chatId, msg)
}

async function handleLoanCommand(chatId: string): Promise<void> {
  const member = await requireLinkedActiveMember(chatId)
  if (!member) return

  const admin = createAdminClient()
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

    await sendTelegramMessageWithCommandButtons(
      chatId,
      `🏦 <b>កម្ជី</b>\n\nអ្នកមិនមានកម្ជីសកម្មទេ។${statusMsg}`
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
    `🏦 <b>របាយការណ៍កម្ជី</b>`,
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
    parts.push(``, `<b>📋 តារាបង់ប្រចាំខែ:</b>`)

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

  await sendTelegramMessageWithCommandButtons(chatId, parts.join('\n'))
}

// ---------------------------------------------------------------------------
// R2 upload helper for raw buffers (bot photo uploads bypass File API)
// ---------------------------------------------------------------------------
async function uploadBufferToR2(memberId: string, folder: string, buf: Buffer, ext: string): Promise<string> {
  const key = `payment-evidence/${memberId}/${folder}/${randomUUID()}.${ext}`
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: getR2BucketName(),
      Key: key,
      Body: buf,
      ContentType: ext === 'png' ? 'image/png' : 'image/jpeg',
    })
  )
  return key
}

// ---------------------------------------------------------------------------
// /paysaving — send QR, prompt for proof photo
// ---------------------------------------------------------------------------
async function handlePaySavingCommand(chatId: string): Promise<void> {
  const member = await requireLinkedActiveMember(chatId)
  if (!member) return

  const qrUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/khqr-payment.png`

  const ok = await sendTelegramPhoto(
    chatId,
    qrUrl,
    '💰 <b>ដាក់ស្នើការសន្សំ</b>\n\n' +
    'ស្កេន KHQR ខាងលើដើម្បីបង់ប្រាក់។\n\n' +
    '📸 <b>បន្ទាប់មកផ្ញើរូបភាពបញ្ជាក់ ហើយសរសេរចំនួន (ដុល្លារ) ក្នុង caption</b>\n' +
    '<i>ឧ. <code>50</code> សម្រាប់ $50</i>',
    true, // force reply
  )

  if (ok) await setPendingPayment(chatId, { type: 'saving' })
}

// ---------------------------------------------------------------------------
// /payloan — send QR with the next due amount, prompt for proof photo
// ---------------------------------------------------------------------------
async function handlePayLoanCommand(chatId: string): Promise<void> {
  const member = await requireLinkedActiveMember(chatId)
  if (!member) return

  const admin = createAdminClient()
  const { data: loan } = await admin
    .from('loans')
    .select('id, amount, term_months, monthly_interest_rate, start_date')
    .eq('member_id', member.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!loan) {
    await sendTelegramMessageWithCommandButtons(chatId, '🏦 អ្នកមិនមានកម្ជីសកម្មទេ។')
    return
  }

  const { data: settings } = await admin
    .from('interest_settings')
    .select('monthly_loan_interest_rate')
    .eq('id', 1)
    .maybeSingle()

  const rate = resolveLoanInterestRate(loan, Number(settings?.monthly_loan_interest_rate ?? DEFAULT_LOAN_INTEREST_RATE))
  const { data: repayments } = await admin
    .from('loan_repayments')
    .select('amount, status')
    .eq('loan_id', loan.id)
    .neq('status', 'refunded')

  let totalPaid = 0
  for (const r of repayments ?? []) {
    if (r.status === 'verified' || r.status === 'completed') totalPaid += Number(r.amount ?? 0)
  }

  const schedule = buildLoanPaymentSchedule(Number(loan.amount), Number(loan.term_months ?? 12), rate, loan.start_date)
  const annotated = annotateLoanPaymentSchedule(schedule, totalPaid)
  const nextDue = annotated.find(r => r.status !== 'paid')
  const dueAmount = nextDue?.amount ?? Number(loan.amount) / Number(loan.term_months ?? 12)

  const qrUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/khqr-payment.png`

  const ok = await sendTelegramPhoto(
    chatId,
    qrUrl,
    `🏦 <b>ដាក់ស្នើការសងកម្ជី</b>\n\n` +
    `💵 <b>ចំនួនត្រូវបង់ប្រចាំខែ:</b> ${fmtMoney(dueAmount)}\n\n` +
    'ស្កេន KHQR ខាងលើដើម្បីបង់ប្រាក់។\n\n' +
    '📸 <b>បន្ទាប់មកផ្ញើរូបភាពបញ្ជាក់</b> ជាការឆ្លើយតបទៅសារនេះ។',
    true, // force reply
  )

  if (ok) await setPendingPayment(chatId, { type: 'loan', loanId: loan.id, amount: dueAmount })
}

// ---------------------------------------------------------------------------
// Photo received — store proof and create pending record
// ---------------------------------------------------------------------------
async function handlePhotoMessage(chatId: string, fileId: string, caption?: string): Promise<void> {
  const pending = await getPendingPayment(chatId)
  if (!pending) {
    await sendTelegramMessage(
      chatId,
      '📸 ដើម្បីដាក់ស្នើការបង់ប្រាក់ សូមប្រើ /paysaving ឬ /payloan ជាមុនសិន។'
    )
    return
  }

  const admin = createAdminClient()
  const member = await requireLinkedActiveMember(chatId)
  if (!member) {
    await clearPendingPayment(chatId)
    return
  }

  // Download the photo from Telegram
  const downloadUrl = await getTelegramFileDownloadUrl(fileId)
  if (!downloadUrl) {
    await sendTelegramMessage(chatId, '❌ មិនអាចទាញយករូបភាពបានទេ។ សូមព្យាយាមម្តងទៀត។')
    return
  }

  let photoBuffer: Buffer
  try {
    const res = await fetch(downloadUrl)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    photoBuffer = Buffer.from(await res.arrayBuffer())
  } catch {
    await sendTelegramMessage(chatId, '❌ មិនអាចទាញយករូបភាពបានទេ។')
    return
  }

  // Upload to R2
  let evidenceUrl: string
  try {
    const ext = downloadUrl.includes('.png') ? 'png' : 'jpg'
    const folder = pending.type === 'saving' ? 'savings' : 'repayments'
    evidenceUrl = await uploadBufferToR2(member.id, folder, photoBuffer, ext)
  } catch {
    await sendTelegramMessage(chatId, '❌ មិនអាចរក្សាទុករូបភាពបានទេ។')
    return
  }

  await clearPendingPayment(chatId)

  // Create the pending record
  if (pending.type === 'saving') {
    const rawAmount = caption?.replace(/[^0-9.]/g, '') ?? ''
    const amount = parseFloat(rawAmount)
    if (!amount || amount <= 0) {
      await sendTelegramMessage(
        chatId,
        '⚠️ រូបភាពបានទទួល ប៉ុន្តែចំនួនមិនត្រឹមត្រូវ។ សូមប្រើ /paysaving ម្តងទៀត ហើយសរសេរចំនួន (ឧ. <code>50</code>) ក្នុង caption។'
      )
      return
    }

    const { error } = await admin.from('savings').insert({
      member_id: member.id,
      amount,
      currency: 'USD',
      evidence_url: evidenceUrl,
      qr_code_ref: `SAV-BOT-${Date.now()}`,
      status: 'pending',
    })

    if (error) {
      await sendTelegramMessage(chatId, '❌ មានបញ្ហាក្នុងការរក្សាទុក។')
      return
    }

    await sendTelegramMessageWithCommandButtons(
      chatId,
      `✅ <b>ទទួលបានដោយជោគជ័យ!</b>\n` +
      `💰 ចំនួន: <b>${fmtMoney(amount)}</b>\n` +
      `⏳ ស្ថានភាព: <b>កំពុងរង់ចាំការផ្ទៀងផ្ទាត់</b>\n\n` +
      `បានដាក់ស្នើការសន្សំ <b>${fmtMoney(amount)}</b> — រង់ចាំអ្នកគ្រប់គ្រងផ្ទៀងផ្ទាត់។`
    )

  } else {
    const { error } = await admin.from('loan_repayments').insert({
      loan_id: pending.loanId,
      member_id: member.id,
      amount: pending.amount,
      currency: 'USD',
      evidence_url: evidenceUrl,
      qr_code_ref: `REP-BOT-${Date.now()}`,
      status: 'pending',
    })

    if (error) {
      await sendTelegramMessage(chatId, '❌ មានបញ្ហាក្នុងការរក្សាទុក។')
      return
    }

    await sendTelegramMessageWithCommandButtons(
      chatId,
      `✅ <b>ទទួលបានដោយជោគជ័យ!</b>\n` +
      `💳 ចំនួន: <b>${fmtMoney(pending.amount)}</b>\n` +
      `⏳ ស្ថានភាព: <b>កំពុងរង់ចាំការផ្ទៀងផ្ទាត់</b>\n\n` +
      `បានដាក់ស្នើការសងកម្ជី <b>${fmtMoney(pending.amount)}</b> — រង់ចាំអ្នកគ្រប់គ្រងផ្ទៀងផ្ទាត់។`
    )
  }
}

// ---------------------------------------------------------------------------
// /requestloan — multi-step conversation to submit a loan request
// ---------------------------------------------------------------------------
async function handleRequestLoanCommand(chatId: string): Promise<void> {
  const member = await requireLinkedActiveMember(chatId)
  if (!member) return

  const admin = createAdminClient()

  // Block if they already have a non-rejected/completed loan
  const { data: existingLoan } = await admin
    .from('loans')
    .select('status')
    .eq('member_id', member.id)
    .in('status', ['pending', 'under_review', 'approved', 'active'])
    .limit(1)
    .maybeSingle()

  if (existingLoan) {
    await sendTelegramMessageWithCommandButtons(
      chatId,
      `🏦 អ្នកមានកម្ជី <b>${LOAN_STATUS_LABEL[existingLoan.status] ?? existingLoan.status}</b> រួចហើយ។\n\n` +
      'ប្រើ /loan ដើម្បីមើលស្ថានភាព។'
    )
    return
  }

  // Check eligibility (must have verified savings)
  const eligibility = await fetchMemberLoanEligibility(admin, member.id)
  if (eligibility.totalSavings <= 0) {
    await sendTelegramMessageWithCommandButtons(
      chatId,
      '⚠️ អ្នកត្រូវមានការសន្សំដែលបានផ្ទៀងផ្ទាត់មុនពេលអាចស្នើសុំកម្ជីបាន។\n\n' +
      'ប្រើ /saving ដើម្បីមើលសមតុល្យសន្សំរបស់អ្នក។'
    )
    return
  }

  await setPendingLoanRequest(chatId, { step: 'amount' })

  await sendTelegramMessage(
    chatId,
    `🏦 <b>ស្នើសុំកម្ជី</b>\n\n` +
    `💰 ចំនួនអតិបរមាដែលអ្នកអាចស្នើសុំ: <b>${fmtMoney(eligibility.availableLoanAmount)}</b>\n\n` +
    `<b>សូមវាយចំនួនដែលអ្នកចង់កម្ចី (ដុល្លារ):</b>\n` +
    `<i>ឧ. <code>500</code> សម្រាប់ $500</i>`
  )
}

async function handleLoanRequestStep(chatId: string, input: string): Promise<void> {
  const state = await getPendingLoanRequest(chatId)
  if (!state) return

  const admin = createAdminClient()
  const member = await requireLinkedActiveMember(chatId)
  if (!member) {
    await clearPendingLoanRequest(chatId)
    return
  }

  if (state.step === 'amount') {
    const amount = parseFloat(input.replace(/[^0-9.]/g, ''))
    if (!amount || amount <= 0) {
      await sendTelegramMessage(chatId, '⚠️ ចំនួនមិនត្រឹមត្រូវ។ សូមវាយចំនួនជាលេខ (ឧ. <code>500</code>)។')
      return
    }

    const eligibility = await fetchMemberLoanEligibility(admin, member.id)
    const check = validateLoanRequestAmount(amount, eligibility)
    if (!check.valid) {
      await sendTelegramMessage(chatId, `⚠️ ${check.error}`)
      return
    }

    await setPendingLoanRequest(chatId, { step: 'term', amount })
    await sendTelegramMessage(
      chatId,
      `✅ ចំនួន: <b>${fmtMoney(amount)}</b>\n\n` +
      `<b>រយៈពេលកម្ជី (ខែ):</b>\n` +
      `<i>ឧ. <code>12</code> សម្រាប់ ១ ឆ្នាំ — អប្បបរមា ១ ខែ ដល់ អតិបរមា ៦០ ខែ</i>`
    )
    return
  }

  if (state.step === 'term') {
    const termMonths = parseInt(input.replace(/[^0-9]/g, ''), 10)
    if (!termMonths || termMonths < 1 || termMonths > 60) {
      await sendTelegramMessage(chatId, '⚠️ រយៈពេលមិនត្រឹមត្រូវ។ សូមវាយចំនួនខែពី ១ ដល់ ៦០។')
      return
    }

    await setPendingLoanRequest(chatId, { step: 'purpose', amount: state.amount, termMonths })
    await sendTelegramMessage(
      chatId,
      `✅ រយៈពេល: <b>${termMonths} ខែ</b>\n\n` +
      `<b>គោលបំណងនៃកម្ជី:</b>\n` +
      `<i>ឧ. ជួសជុលផ្ទះ, ការអប់រំ, អាជីវកម្ម...</i>`
    )
    return
  }

  if (state.step === 'purpose') {
    const purpose = input.trim()
    if (purpose.length < 3) {
      await sendTelegramMessage(chatId, '⚠️ គោលបំណងខ្លីពេក។ សូមពិពណ៌នាបន្ថែម។')
      return
    }

    await clearPendingLoanRequest(chatId)

    // Fetch interest rate
    const interestSettings = await getInterestSettings()
    const rate = await fetchMemberLoanInterestRate(member.id, interestSettings.monthlyLoanInterestRate)

    // Compute start/end dates
    const startDate = todayIso()
    const endDate = addMonths(startDate, state.termMonths)

    const { error } = await admin.from('loans').insert({
      member_id: member.id,
      amount: state.amount,
      currency: 'USD',
      purpose,
      term_months: state.termMonths,
      monthly_interest_rate: rate,
      start_date: startDate,
      end_date: endDate,
      status: 'under_review',
    })

    if (error) {
      await sendTelegramMessage(chatId, '❌ មានបញ្ហាក្នុងការដាក់ស្នើ។ សូមព្យាយាមម្តងទៀត។')
      return
    }

    await sendTelegramMessageWithCommandButtons(
      chatId,
      `✅ <b>ស្នើសុំកម្ជីបានដោយជោគជ័យ!</b>\n\n` +
      `💵 ចំនួន: <b>${fmtMoney(state.amount)}</b>\n` +
      `📅 រយៈពេល: <b>${state.termMonths} ខែ</b>\n` +
      `📈 ការប្រាក់: <b>${rate}%/ខែ</b>\n` +
      `📝 គោលបំណង: <i>${purpose}</i>\n\n` +
      `⏳ ស្ថានភាព: <b>កំពុងពិនិត្យ</b>\n\n` +
      `អ្នកគ្រប់គ្រងនឹងពិនិត្យពាក្យសុំរបស់អ្នកឆាប់ៗនេះ។ ប្រើ /loan ដើម្បីមើលស្ថានភាព។`
    )
  }
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

  // Inline keyboard button tap
  const cbq = update.callback_query
  if (cbq) {
    const cbChatId = String(cbq.message?.chat?.id ?? cbq.from?.id ?? '')
    const data = cbq.data ?? ''
    await answerTelegramCallbackQuery(cbq.id)
    if (cbChatId) {
      if (data === '/saving')      await handleSavingCommand(cbChatId)
      else if (data === '/loan')   await handleLoanCommand(cbChatId)
      else if (data === '/paysaving')   await handlePaySavingCommand(cbChatId)
      else if (data === '/payloan')     await handlePayLoanCommand(cbChatId)
      else if (data === '/requestloan') await handleRequestLoanCommand(cbChatId)
    }
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

  if (text === '/paysaving' || text.startsWith('/paysaving@')) {
    await handlePaySavingCommand(chatIdStr)
    return NextResponse.json({ ok: true })
  }

  if (text === '/payloan' || text.startsWith('/payloan@')) {
    await handlePayLoanCommand(chatIdStr)
    return NextResponse.json({ ok: true })
  }

  if (text === '/requestloan' || text.startsWith('/requestloan@')) {
    await handleRequestLoanCommand(chatIdStr)
    return NextResponse.json({ ok: true })
  }

  // Reply-keyboard menu buttons — map label text to command handlers
  const menuButtonHandlers: Record<string, (id: string) => Promise<void>> = {
    '💰 ការសន្សំ':       handleSavingCommand,
    '🏦 ប្រាក់កម្ចី':      handleLoanCommand,
    '📤 ដាក់ស្នើសន្សំ':   handlePaySavingCommand,
    '💳 សងកម្ចី':        handlePayLoanCommand,
    '📝 ស្នើសុំកម្ចី':    handleRequestLoanCommand,
  }
  if (text && menuButtonHandlers[text]) {
    await menuButtonHandlers[text](chatIdStr)
    return NextResponse.json({ ok: true })
  }

  // Mid-conversation loan request — intercept plain text replies
  if (text && !text.startsWith('/') && (await getPendingLoanRequest(chatIdStr))) {
    await handleLoanRequestStep(chatIdStr, text)
    return NextResponse.json({ ok: true })
  }

  if (text.startsWith('/start')) {
    const token = text.slice('/start'.length).trim()

    if (!token) {
      console.log('[Webhook] /start with no token — sending welcome to', chatIdStr)
      await sendTelegramMessageWithCommandButtons(chatIdStr, WELCOME_NO_TOKEN)
      return NextResponse.json({ ok: true })
    }

    await handleStartWithToken(chatIdStr, token)
    return NextResponse.json({ ok: true })
  }

  // Photo / document message — check pending payment state
  const photo = message?.photo
  const doc = message?.document
  if (photo && photo.length > 0) {
    const largest = photo.reduce((a, b) => (a.file_size ?? 0) > (b.file_size ?? 0) ? a : b)
    await handlePhotoMessage(chatIdStr, largest.file_id, message?.caption ?? undefined)
    return NextResponse.json({ ok: true })
  }
  if (doc && doc.mime_type?.startsWith('image/')) {
    await handlePhotoMessage(chatIdStr, doc.file_id, message?.caption ?? undefined)
    return NextResponse.json({ ok: true })
  }

  await sendTelegramMessageWithCommandButtons(chatIdStr, WELCOME_NO_TOKEN)
  return NextResponse.json({ ok: true })
}
