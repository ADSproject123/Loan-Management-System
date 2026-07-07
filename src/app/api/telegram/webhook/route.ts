import { NextResponse, type NextRequest } from 'next/server'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { formatMoney, MIN_SAVING_AMOUNT } from '@/lib/currency'
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
  annotateLoanPaymentSchedule,
  buildLoanPaymentSchedule,
  loanScheduleStartDate,
  resolveLoanInterestRate,
  DEFAULT_LOAN_INTEREST_RATE,
} from '@/lib/interestCalculations'
import { getInterestSettings, fetchMemberLoanInterestRate } from '@/lib/interest'
import { addMonths, todayIso } from '@/lib/dates'
import { fetchMemberLoanEligibility, validateLoanRequestAmount } from '@/lib/loanEligibility'
import { memberKhmerName } from '@/lib/memberNames'
import { notifyAdmins } from '@/lib/notifyAdmins'
import {
  LOAN_STATUS_LABEL,
  SAVING_STATUS_LABEL,
  SCHEDULE_STATUS_LABEL,
  TG_ACCOUNT_NOT_ACTIVE,
  TG_ACCOUNT_NOT_LINKED,
  TG_LOAN_NONE_ACTIVE,
  TG_SAVINGS_EMPTY,
  TG_WELCOME_UNLINKED,
  tgErrorGeneric,
  tgErrorPhotoDownload,
  tgErrorPhotoUpload,
  tgErrorSession,
  tgErrorStorage,
  tgLinkDuplicateAccount,
  tgLinkFailed,
  tgLinkInvalidToken,
  tgLinkSuccess,
  tgLoanNoneActiveWithStatus,
  tgLoanReport,
  tgLoanRequestBlocked,
  tgLoanRequestNoSavings,
  tgLoanRequestStart,
  tgLoanRequestSubmitted,
  tgLoanScheduleLine,
  tgMinSavingAmount,
  tgPayLoanCaption,
  tgPaySavingCaption,
  tgPromptAmountSaved,
  tgPromptPhotoSaved,
  tgPromptUsePaymentCommand,
  tgPromptValidAmount,
  tgSavingTransactionLine,
  tgSavingsReport,
  tgSubmissionReceived,
  formatTelegramNotification,
  formatTelegramField,
  tgAdminRequestBody,
} from '@/lib/telegramMessages'
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

const WELCOME_NO_TOKEN = TG_WELCOME_UNLINKED
const NOT_LINKED = TG_ACCOUNT_NOT_LINKED
const NOT_ACTIVE_MEMBER = TG_ACCOUNT_NOT_ACTIVE

type LinkedMember = {
  id: string
  status: string
  full_name?: string | null
  full_name_kh?: string | null
  full_name_en?: string | null
}

async function requireLinkedActiveMember(chatId: string): Promise<LinkedMember | null> {
  const admin = createAdminClient()
  const { data: member } = await admin
    .from('members')
    .select('id, status, full_name, full_name_kh, full_name_en')
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

const STATUS_LABEL: Record<SavingStatus, string> = SAVING_STATUS_LABEL

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
    await sendTelegramMessage(chatId, tgLinkInvalidToken())
    return
  }

  const result = await linkTelegramChat(member.id, chatId)

  if (!result.ok) {
    await sendTelegramMessage(
      chatId,
      result.duplicate ? tgLinkDuplicateAccount() : tgLinkFailed()
    )
    return
  }

  const name = member.full_name_kh ?? member.full_name_en ?? ''
  await sendTelegramMessageWithCommandButtons(chatId, tgLinkSuccess(name))
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
    await sendTelegramMessageWithCommandButtons(chatId, TG_SAVINGS_EMPTY)
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
  const recentLines = recent.map((r) => {
    const st = r.status as SavingStatus
    return tgSavingTransactionLine(fmtDate(r.saving_date), fmtMoney(r.amount), STATUS_LABEL[st])
  })

  const msg = tgSavingsReport({
    memberName: name,
    grandTotal: fmtMoney(grandTotal),
    verifiedTotal: fmtMoney(totalVerified),
    pendingTotal: fmtMoney(totalPending),
    recentLines,
    moreCount: rows.length > 8 ? rows.length - 8 : undefined,
  })

  await sendTelegramMessageWithCommandButtons(chatId, msg)
}

async function handleLoanCommand(chatId: string): Promise<void> {
  const member = await requireLinkedActiveMember(chatId)
  if (!member) return

  const admin = createAdminClient()
  const { data: loan } = await admin
    .from('loans')
    .select('id, amount, currency, status, term_months, monthly_interest_rate, start_date, disbursed_at, created_at, due_date')
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
      ? LOAN_STATUS_LABEL[anyLoan.status] ?? anyLoan.status
      : null

    await sendTelegramMessageWithCommandButtons(
      chatId,
      statusMsg ? tgLoanNoneActiveWithStatus(statusMsg) : TG_LOAN_NONE_ACTIVE
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

  const schedule = buildLoanPaymentSchedule(principal, termMonths, rate, loanScheduleStartDate(loan))
  const annotated = annotateLoanPaymentSchedule(schedule, totalPaid, new Date(), totalPending)

  const totalOwed = annotated.reduce((s, r) => s + r.amount, 0)
  const remaining = Math.max(0, totalOwed - totalPaid)

  const name = member.full_name_kh ?? member.full_name_en ?? ''
  const unpaidCount = annotated.filter(r => r.status !== 'paid').length

  const unpaid = annotated.filter((r) => r.status !== 'paid')
  const scheduleLines = unpaid.slice(0, 12).map((row) => {
    const dateStr = row.dueDate ? fmtDate(row.dueDate) : `ខែ ${row.month}`
    const paidNote =
      row.paidAmount > 0 ? `បានបង់ ${fmtMoney(row.paidAmount)}` : undefined
    return tgLoanScheduleLine(
      dateStr,
      fmtMoney(row.amount),
      SCHEDULE_STATUS_LABEL[row.status] ?? row.status,
      paidNote
    )
  })

  const msg = tgLoanReport({
    memberName: name,
    principal: fmtMoney(principal),
    termMonths,
    rate,
    dueDate: loan.due_date ? fmtDate(loan.due_date) : undefined,
    totalPaid: fmtMoney(totalPaid),
    pendingPaid: totalPending > 0 ? fmtMoney(totalPending) : undefined,
    remaining: fmtMoney(remaining),
    unpaidMonths: unpaidCount,
    scheduleLines,
    scheduleMoreCount: unpaid.length > 12 ? unpaid.length - 12 : undefined,
    fullyPaid: unpaid.length === 0,
  })

  await sendTelegramMessageWithCommandButtons(chatId, msg)
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

function parseTelegramAmount(text?: string) {
  const rawAmount = text?.replace(/[^0-9.]/g, '') ?? ''
  const amount = parseFloat(rawAmount)
  return Number.isFinite(amount) && amount > 0 ? amount : null
}

async function submitSavingRequest(
  chatId: string,
  member: LinkedMember,
  amount: number,
  evidenceUrl: string
): Promise<boolean> {
  if (amount < MIN_SAVING_AMOUNT) {
    await sendTelegramMessage(chatId, tgMinSavingAmount(fmtMoney(MIN_SAVING_AMOUNT)))
    return false
  }

  const admin = createAdminClient()
  const { error } = await admin.from('savings').insert({
    member_id: member.id,
    amount,
    currency: 'USD',
    evidence_url: evidenceUrl,
    qr_code_ref: `SAV-BOT-${Date.now()}`,
    saving_date: todayIso(),
    status: 'pending',
  })

  if (error) {
    console.error('[Telegram] savings insert failed:', error.message)
    await sendTelegramMessage(chatId, tgErrorStorage())
    return false
  }

  await clearPendingPayment(chatId)
  await notifyAdmins(
    'សំណើសន្សំថ្មី',
    tgAdminRequestBody({
      memberName: memberKhmerName(member),
      fields: [
        { label: 'ចំនួន', value: fmtMoney(amount) },
        { label: 'ប្រភព', value: 'Telegram' },
      ],
      note: 'សូមពិនិត្យនៅផ្នែកសំណើសន្សំ។',
    }),
    'saving_request'
  )
  revalidatePath('/admin')
  revalidatePath('/admin/savings')
  revalidatePath('/admin/savings/requests')

  await sendTelegramMessageWithCommandButtons(
    chatId,
    tgSubmissionReceived('saving', fmtMoney(amount))
  )

  return true
}

async function handlePendingSavingAmount(chatId: string, text: string): Promise<boolean> {
  const pending = await getPendingPayment(chatId)
  if (!pending || pending.type !== 'saving') return false

  const amount = parseTelegramAmount(text)
  if (!amount) {
    await sendTelegramMessage(chatId, tgPromptValidAmount())
    return true
  }

  const member = await requireLinkedActiveMember(chatId)
  if (!member) {
    await clearPendingPayment(chatId)
    return true
  }

  if (pending.evidenceUrl) {
    await submitSavingRequest(chatId, member, amount, pending.evidenceUrl)
    return true
  }

  const saved = await setPendingPayment(chatId, { type: 'saving', amount })
  if (!saved) {
    await sendTelegramMessage(chatId, tgErrorSession('/paysaving'))
    return true
  }

  await sendTelegramMessage(chatId, tgPromptAmountSaved(fmtMoney(amount)))
  return true
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
    tgPaySavingCaption(),
    true,
  )

  if (ok) {
    const saved = await setPendingPayment(chatId, { type: 'saving' })
    if (!saved) {
      await sendTelegramMessage(chatId, tgErrorSession('/paysaving'))
    }
  }
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
    .select('id, amount, term_months, monthly_interest_rate, start_date, disbursed_at, created_at')
    .eq('member_id', member.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!loan) {
    await sendTelegramMessageWithCommandButtons(chatId, TG_LOAN_NONE_ACTIVE)
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

  const schedule = buildLoanPaymentSchedule(
    Number(loan.amount),
    Number(loan.term_months ?? 12),
    rate,
    loanScheduleStartDate(loan)
  )
  const annotated = annotateLoanPaymentSchedule(schedule, totalPaid)
  const nextDue = annotated.find(r => r.status !== 'paid')
  const dueAmount = nextDue?.amount ?? Number(loan.amount) / Number(loan.term_months ?? 12)

  const qrUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/khqr-payment.png`

  const ok = await sendTelegramPhoto(
    chatId,
    qrUrl,
    tgPayLoanCaption(fmtMoney(dueAmount)),
    true,
  )

  if (ok) {
    const saved = await setPendingPayment(chatId, { type: 'loan', loanId: loan.id, amount: dueAmount })
    if (!saved) {
      await sendTelegramMessage(chatId, tgErrorSession('/payloan'))
    }
  }
}

// ---------------------------------------------------------------------------
// Photo received — store proof and create pending record
// ---------------------------------------------------------------------------
async function handlePhotoMessage(chatId: string, fileId: string, caption?: string): Promise<void> {
  const pending = await getPendingPayment(chatId)
  if (!pending) {
    await sendTelegramMessage(chatId, tgPromptUsePaymentCommand())
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
    await sendTelegramMessage(chatId, tgErrorPhotoDownload())
    return
  }

  let photoBuffer: Buffer
  try {
    const res = await fetch(downloadUrl)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    photoBuffer = Buffer.from(await res.arrayBuffer())
  } catch {
    await sendTelegramMessage(chatId, tgErrorPhotoDownload())
    return
  }

  // Upload to R2
  let evidenceUrl: string
  try {
    const ext = downloadUrl.includes('.png') ? 'png' : 'jpg'
    const folder = pending.type === 'saving' ? 'savings' : 'repayments'
    evidenceUrl = await uploadBufferToR2(member.id, folder, photoBuffer, ext)
  } catch {
    await sendTelegramMessage(chatId, tgErrorPhotoUpload())
    return
  }

  if (pending.type === 'saving') {
    const amount = parseTelegramAmount(caption) ?? pending.amount ?? null

    if (!amount) {
      const saved = await setPendingPayment(chatId, { type: 'saving', evidenceUrl })
      if (!saved) {
        await sendTelegramMessage(chatId, tgErrorSession('/paysaving'))
        return
      }
      await sendTelegramMessage(chatId, tgPromptPhotoSaved())
      return
    }

    await submitSavingRequest(chatId, member, amount, pending.evidenceUrl ?? evidenceUrl)
    return
  }

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
    console.error('[Telegram] loan repayment insert failed:', error.message)
    await sendTelegramMessage(chatId, tgErrorStorage())
    return
  }

  await clearPendingPayment(chatId)
  revalidatePath('/admin/loans/payments')

  await sendTelegramMessageWithCommandButtons(
    chatId,
    tgSubmissionReceived('loan', fmtMoney(pending.amount))
  )
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
      tgLoanRequestBlocked(LOAN_STATUS_LABEL[existingLoan.status] ?? existingLoan.status)
    )
    return
  }

  // Check eligibility (must have verified savings)
  const eligibility = await fetchMemberLoanEligibility(admin, member.id)
  if (eligibility.totalSavings <= 0) {
    await sendTelegramMessageWithCommandButtons(chatId, tgLoanRequestNoSavings())
    return
  }

  await setPendingLoanRequest(chatId, { step: 'amount' })

  await sendTelegramMessage(
    chatId,
    tgLoanRequestStart(fmtMoney(eligibility.availableLoanAmount))
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
      await sendTelegramMessage(chatId, tgPromptValidAmount())
      return
    }

    const eligibility = await fetchMemberLoanEligibility(admin, member.id)
    const check = validateLoanRequestAmount(amount, eligibility)
    if (!check.valid) {
      await sendTelegramMessage(chatId, formatTelegramNotification('មិនអាចស្នើសុំបាន', check.error))
      return
    }

    await setPendingLoanRequest(chatId, { step: 'term', amount })
    await sendTelegramMessage(
      chatId,
      formatTelegramNotification(
        'ចំនួនត្រូវបានរក្សាទុក',
        [
          formatTelegramField('ចំនួន', fmtMoney(amount)),
          '',
          'សូមវាយរយៈពេលកម្ជី (ខែ)។',
          '<i>ឧទាហរណ៍: <code>12</code> សម្រាប់ ១ ឆ្នាំ (អប្បបរមា ១ ខែ ដល់ ៦០ ខែ)</i>',
        ].join('\n')
      )
    )
    return
  }

  if (state.step === 'term') {
    const termMonths = parseInt(input.replace(/[^0-9]/g, ''), 10)
    if (!termMonths || termMonths < 1 || termMonths > 60) {
      await sendTelegramMessage(
        chatId,
        formatTelegramNotification(
          'រយៈពេលមិនត្រឹមត្រូវ',
          'សូមវាយចំនួនខែពី ១ ដល់ ៦០។'
        )
      )
      return
    }

    await setPendingLoanRequest(chatId, { step: 'purpose', amount: state.amount, termMonths })
    await sendTelegramMessage(
      chatId,
      formatTelegramNotification(
        'រយៈពេលត្រូវបានរក្សាទុក',
        [
          formatTelegramField('រយៈពេល', `${termMonths} ខែ`),
          '',
          'សូមបញ្ជាក់គោលបំណងនៃកម្ជី។',
          '<i>ឧទាហរណ៍: ជួសជុលផ្ទះ, ការអប់រំ, អាជីវកម្ម</i>',
        ].join('\n')
      )
    )
    return
  }

  if (state.step === 'purpose') {
    const purpose = input.trim()
    if (purpose.length < 3) {
      await sendTelegramMessage(
        chatId,
        formatTelegramNotification(
          'គោលបំណងមិនគ្រប់គ្រាន់',
          'សូមពិពណ៌នាគោលបំណងកម្ជីឱ្យច្បាស់លាស់ជាងនេះ។'
        )
      )
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
      await sendTelegramMessage(chatId, tgErrorGeneric('មិនអាចដាក់ស្នើសុំកម្ជីបានទេ។ សូមព្យាយាមម្តងទៀត។'))
      return
    }

    await sendTelegramMessageWithCommandButtons(
      chatId,
      tgLoanRequestSubmitted({
        amount: fmtMoney(state.amount),
        termMonths: state.termMonths,
        rate,
        purpose,
      })
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
    'ការសន្សំ': handleSavingCommand,
    'ប្រាក់កម្ជី': handleLoanCommand,
    'ដាក់ស្នើសន្សំ': handlePaySavingCommand,
    'សងកម្ជី': handlePayLoanCommand,
    'ស្នើសុំកម្ជី': handleRequestLoanCommand,
  }
  if (text && menuButtonHandlers[text]) {
    await menuButtonHandlers[text](chatIdStr)
    return NextResponse.json({ ok: true })
  }

  // Pending saving amount after photo, or amount before photo
  if (text && !text.startsWith('/') && (await getPendingPayment(chatIdStr))?.type === 'saving') {
    await handlePendingSavingAmount(chatIdStr, text)
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
