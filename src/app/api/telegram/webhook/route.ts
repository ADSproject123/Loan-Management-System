import { NextResponse, type NextRequest } from 'next/server'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { formatMoney, MIN_SAVING_AMOUNT } from '@/lib/currency'
import { createAdminClient } from '@/lib/supabase/admin'
import { getR2Client, getR2BucketName } from '@/lib/r2'
import type { UploadBucket } from '@/lib/uploads'
import {
  sendTelegramMessage,
  sendTelegramMessageWithCommandButtons,
  sendTelegramMessageWithInlineKeyboard,
  sendTelegramPhoto,
  getTelegramFileDownloadUrl,
  answerTelegramCallbackQuery,
} from '@/lib/telegram'
import {
  accruedSavingInterestTotal,
  annotateLoanPaymentSchedule,
  buildLoanPaymentSchedule,
  loanScheduleStartDate,
  resolveLoanInterestRate,
  DEFAULT_LOAN_INTEREST_RATE,
} from '@/lib/interestCalculations'
import { getInterestSettings } from '@/lib/interest'
import { todayIso } from '@/lib/dates'
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
  tgWithdrawalNoSavings,
  tgWithdrawalRequestBlocked,
  tgWithdrawalRequestStart,
  tgWithdrawalRequestReview,
  tgWithdrawalRequestCancelled,
  tgWithdrawalRequestSubmitted,
  tgRefereeCategoryPrompt,
  tgRefereeCandidateListPrompt,
  tgRefereeSearchPrompt,
  tgRefereeSearchNoResults,
  tgLoanRequestCancelled,
  tgNoActiveLoanRequestToCancel,
  tgRefereeInviteCancelled,
  tgLoanSignatureReminder,
  tgLoanSignedDocumentReceived,
  tgAdminSignedDocumentReceived,
  tgChatMessageForwarded,
  MEMBER_ROLE_LABEL,
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
  getPendingWithdrawalRequest,
  setPendingWithdrawalRequest,
  clearPendingWithdrawalRequest,
  getPendingLoanSignature,
  clearPendingLoanSignature,
} from '@/lib/telegramConversationState'
import {
  ROLES,
  REFEREE_CATEGORY_PREFIX,
  REFEREE_PICK_PREFIX,
  REFEREE_BACK,
  REFEREE_CANCEL,
  REFEREE_RESPONSE_PREFIX,
  countRefereeCandidatesByRole,
  fetchRefereeCandidates,
  searchRefereeCandidates,
  refereeDisplayName,
  finalizeLoanRequest,
  processRefereeResponse,
  rejectAwaitingRefereeLoan,
} from '@/lib/loanReferee'
import type { SavingStatus, MemberRole } from '@/types/database'

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
  const verifiedRows: typeof rows = []
  for (const r of rows) {
    const amt = Number(r.amount ?? 0)
    if (r.status === 'verified' || r.status === 'completed') {
      totalVerified += amt
      verifiedRows.push(r)
    } else if (r.status === 'pending') {
      totalPending += amt
    }
  }
  const grandTotal = totalVerified + totalPending

  const interestSettings = await getInterestSettings()
  const accruedInterest = accruedSavingInterestTotal(verifiedRows, interestSettings.monthlySavingInterestRate)

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
    totalWithInterest: fmtMoney(grandTotal + accruedInterest),
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
async function uploadBufferToR2(
  bucketPrefix: UploadBucket,
  memberId: string,
  folder: string,
  buf: Buffer,
  ext: string,
  contentType?: string
): Promise<string> {
  const key = `${bucketPrefix}/${memberId}/${folder}/${randomUUID()}.${ext}`
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: getR2BucketName(),
      Key: key,
      Body: buf,
      ContentType: contentType ?? (ext === 'png' ? 'image/png' : 'image/jpeg'),
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
/** Fresh due-this-month amount and total remaining balance for a loan, straight from the DB. */
async function fetchLoanRepaymentSnapshot(
  loanId: string,
  fallbackRate: number
): Promise<{ dueAmount: number; remaining: number; totalPaid: number } | null> {
  const admin = createAdminClient()
  const { data: loan } = await admin
    .from('loans')
    .select('id, amount, term_months, monthly_interest_rate, start_date, disbursed_at, created_at')
    .eq('id', loanId)
    .maybeSingle()

  if (!loan) return null

  const rate = resolveLoanInterestRate(loan, fallbackRate)
  const principal = Number(loan.amount ?? 0)
  const termMonths = Number(loan.term_months ?? 12)

  const { data: repayments } = await admin
    .from('loan_repayments')
    .select('amount, status')
    .eq('loan_id', loanId)
    .neq('status', 'refunded')

  let totalPaid = 0
  for (const r of repayments ?? []) {
    if (r.status === 'verified' || r.status === 'completed') totalPaid += Number(r.amount ?? 0)
  }

  const schedule = buildLoanPaymentSchedule(principal, termMonths, rate, loanScheduleStartDate(loan))
  const annotated = annotateLoanPaymentSchedule(schedule, totalPaid)
  const nextDue = annotated.find((r) => r.status !== 'paid')
  const dueAmount = nextDue?.amount ?? principal / termMonths
  const totalOwed = annotated.reduce((sum, row) => sum + row.amount, 0)
  const remaining = Math.max(0, totalOwed - totalPaid)

  return { dueAmount, remaining, totalPaid }
}

async function handlePayLoanCommand(chatId: string): Promise<void> {
  const member = await requireLinkedActiveMember(chatId)
  if (!member) return

  const admin = createAdminClient()
  const { data: loan } = await admin
    .from('loans')
    .select('id')
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

  const fallbackRate = Number(settings?.monthly_loan_interest_rate ?? DEFAULT_LOAN_INTEREST_RATE)
  const snapshot = await fetchLoanRepaymentSnapshot(loan.id, fallbackRate)
  const dueAmount = snapshot?.dueAmount ?? 0
  const remaining = snapshot?.remaining ?? dueAmount

  const qrUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/khqr-payment.png`

  const ok = await sendTelegramPhoto(
    chatId,
    qrUrl,
    tgPayLoanCaption(fmtMoney(dueAmount), fmtMoney(remaining)),
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
    evidenceUrl = await uploadBufferToR2('payment-evidence', member.id, folder, photoBuffer, ext)
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

  const amount = parseTelegramAmount(caption) ?? pending.amount

  const { data: settings } = await admin
    .from('interest_settings')
    .select('monthly_loan_interest_rate')
    .eq('id', 1)
    .maybeSingle()
  const fallbackRate = Number(settings?.monthly_loan_interest_rate ?? DEFAULT_LOAN_INTEREST_RATE)
  const snapshot = await fetchLoanRepaymentSnapshot(pending.loanId, fallbackRate)

  if (snapshot && amount > snapshot.remaining + 0.01) {
    await sendTelegramMessage(
      chatId,
      formatTelegramNotification(
        'ចំនួនលើសសមតុល្យ',
        `ចំនួនមិនអាចលើសសមតុល្យកម្ជីនៅសល់ ${fmtMoney(snapshot.remaining)} ។ សូមផ្ញើរូបភាពម្តងទៀត ជាមួយចំនួនត្រឹមត្រូវក្នុង caption ។`
      )
    )
    return
  }

  const { error } = await admin.from('loan_repayments').insert({
    loan_id: pending.loanId,
    member_id: member.id,
    amount,
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
    tgSubmissionReceived('loan', fmtMoney(amount))
  )
}

// ---------------------------------------------------------------------------
// Signed loan contract returned after full referee (online) acceptance
// ---------------------------------------------------------------------------

function extensionAndContentTypeForDocument(doc: { mime_type?: string; file_name?: string }): {
  ext: string
  contentType: string
} {
  const nameExt = doc.file_name?.split('.').pop()?.toLowerCase()
  if (nameExt && /^[a-z0-9]+$/.test(nameExt)) {
    return { ext: nameExt, contentType: doc.mime_type ?? 'application/octet-stream' }
  }
  if (doc.mime_type === 'application/pdf') return { ext: 'pdf', contentType: 'application/pdf' }
  if (doc.mime_type?.startsWith('image/')) {
    return { ext: doc.mime_type.split('/')[1] || 'jpg', contentType: doc.mime_type }
  }
  return { ext: 'bin', contentType: doc.mime_type ?? 'application/octet-stream' }
}

async function handleSignedLoanDocument(
  chatId: string,
  fileId: string,
  fileMeta: { mime_type?: string; file_name?: string } | null
): Promise<void> {
  const pending = await getPendingLoanSignature(chatId)
  if (!pending) return

  const member = await requireLinkedActiveMember(chatId)
  if (!member) {
    await clearPendingLoanSignature(chatId)
    return
  }

  const downloadUrl = await getTelegramFileDownloadUrl(fileId)
  if (!downloadUrl) {
    await sendTelegramMessage(chatId, tgErrorPhotoDownload())
    return
  }

  let buf: Buffer
  try {
    const res = await fetch(downloadUrl)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    buf = Buffer.from(await res.arrayBuffer())
  } catch {
    await sendTelegramMessage(chatId, tgErrorPhotoDownload())
    return
  }

  const { ext, contentType } = fileMeta
    ? extensionAndContentTypeForDocument(fileMeta)
    : { ext: 'jpg', contentType: 'image/jpeg' }

  let key: string
  try {
    key = await uploadBufferToR2('loan-documents', member.id, 'contract', buf, ext, contentType)
  } catch {
    await sendTelegramMessage(chatId, tgErrorPhotoUpload())
    return
  }

  const admin = createAdminClient()
  const { data: loan, error } = await admin
    .from('loans')
    .update({ support_document_url: key })
    .eq('id', pending.loanId)
    .eq('member_id', member.id)
    .select('amount')
    .maybeSingle()

  if (error || !loan) {
    await sendTelegramMessage(chatId, tgErrorStorage())
    return
  }

  await clearPendingLoanSignature(chatId)
  await sendTelegramMessageWithCommandButtons(chatId, tgLoanSignedDocumentReceived())
  await notifyAdmins(
    'ឯកសារកិច្ចសន្យាបានទទួល',
    tgAdminSignedDocumentReceived(memberKhmerName(member), fmtMoney(Number(loan.amount ?? 0))),
    'loan_referee'
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
    .in('status', ['pending', 'awaiting_referee', 'under_review', 'approved', 'active'])
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

    await setPendingLoanRequest(chatId, {
      step: 'referees',
      amount: state.amount,
      termMonths: state.termMonths,
      purpose,
    })
    await sendTelegramMessage(chatId, tgRefereeCategoryPrompt(purpose))
    await sendRefereeCategoryMenu(chatId, admin, member.id)
    return
  }

  if (state.step === 'referees' && state.searchRole) {
    const results = await searchRefereeCandidates(admin, state.searchRole, member.id, input)

    if (results.length === 0) {
      await sendTelegramMessage(chatId, tgRefereeSearchNoResults())
      return
    }

    await sendTelegramMessageWithInlineKeyboard(
      chatId,
      tgRefereeCandidateListPrompt(MEMBER_ROLE_LABEL[state.searchRole]),
      results.map((c) => [{ text: refereeDisplayName(c), callback_data: `${REFEREE_PICK_PREFIX}${c.id}` }])
    )
  }
}

// ---------------------------------------------------------------------------
// Loan referee (guarantor) selection — inline-keyboard sub-flow of /requestloan.
// Exactly one referee per loan request.
// ---------------------------------------------------------------------------

const REFEREE_CATEGORY_LETTER: Record<MemberRole, string> = {
  founder: 'ក',
  comember: 'ខ',
  member: 'គ',
}
const REFEREE_CANCEL_LETTER = 'ឃ'

async function sendRefereeCategoryMenu(
  chatId: string,
  admin: ReturnType<typeof createAdminClient>,
  requesterId: string
): Promise<void> {
  const counts = await countRefereeCandidatesByRole(admin, requesterId)
  const explanation = [
    'សូមជ្រើសរើសប្រភេទសមាជិកសម្រាប់មេធានា៖',
    '',
    ...ROLES.map((role) => `${REFEREE_CATEGORY_LETTER[role]} = ${MEMBER_ROLE_LABEL[role]} (${counts[role]})`),
    `${REFEREE_CANCEL_LETTER} = បោះបង់`,
  ].join('\n')

  await sendTelegramMessageWithInlineKeyboard(
    chatId,
    explanation,
    [
      ROLES.map((role) => ({
        text: REFEREE_CATEGORY_LETTER[role],
        callback_data: `${REFEREE_CATEGORY_PREFIX}${role}`,
      })),
      [{ text: REFEREE_CANCEL_LETTER, callback_data: REFEREE_CANCEL }],
    ]
  )
}

async function handleRefereeCategoryCallback(chatId: string, role: MemberRole): Promise<void> {
  console.log('[RefereeDebug] handleRefereeCategoryCallback start', { chatId, role })
  try {
    const state = await getPendingLoanRequest(chatId)
    console.log('[RefereeDebug] state', JSON.stringify(state))
    const member = await requireLinkedActiveMember(chatId)
    console.log('[RefereeDebug] member', member ? member.id : null)
    if (!state || state.step !== 'referees' || !member) {
      console.log('[RefereeDebug] early return', {
        hasState: Boolean(state),
        step: state?.step,
        hasMember: Boolean(member),
      })
      return
    }

    const admin = createAdminClient()
    const result = await fetchRefereeCandidates(admin, role, member.id)
    console.log('[RefereeDebug] fetchRefereeCandidates result', JSON.stringify(result))

    if (result.mode === 'search') {
      await setPendingLoanRequest(chatId, { ...state, searchRole: role })
      await sendTelegramMessage(chatId, tgRefereeSearchPrompt(MEMBER_ROLE_LABEL[role]))
      return
    }

    if (result.candidates.length === 0) {
      await sendTelegramMessage(
        chatId,
        formatTelegramNotification('គ្មានសមាជិក', 'មិនមានសមាជិកក្នុងប្រភេទនេះទេ។ សូមជ្រើសរើសប្រភេទផ្សេង។')
      )
      return
    }

    const ok = await sendTelegramMessageWithInlineKeyboard(
      chatId,
      tgRefereeCandidateListPrompt(MEMBER_ROLE_LABEL[role]),
      [
        ...result.candidates.map((c) => [
          { text: refereeDisplayName(c), callback_data: `${REFEREE_PICK_PREFIX}${c.id}` },
        ]),
        [{ text: '⬅ ត្រឡប់ក្រោយ', callback_data: REFEREE_BACK }],
      ]
    )
    console.log('[RefereeDebug] sendTelegramMessageWithInlineKeyboard ok?', ok)
  } catch (err) {
    console.error('[RefereeDebug] EXCEPTION in handleRefereeCategoryCallback', err)
  }
}

async function handleRefereePickCallback(
  chatId: string,
  callbackQueryId: string,
  candidateId: string
): Promise<void> {
  const state = await getPendingLoanRequest(chatId)
  const member = await requireLinkedActiveMember(chatId)
  if (!state || state.step !== 'referees' || !member) return

  await clearPendingLoanRequest(chatId)
  await answerTelegramCallbackQuery(callbackQueryId, 'កំពុងផ្ញើទៅមេធានា...')

  const admin = createAdminClient()
  const result = await finalizeLoanRequest(admin, {
    memberId: member.id,
    requesterName: memberKhmerName(member),
    amount: state.amount,
    termMonths: state.termMonths,
    purpose: state.purpose,
    refereeIds: [candidateId],
  })

  if (!result.ok) {
    await sendTelegramMessage(chatId, tgErrorGeneric(result.error))
    return
  }

  await sendTelegramMessageWithCommandButtons(
    chatId,
    tgLoanRequestSubmitted({
      amount: fmtMoney(state.amount),
      termMonths: state.termMonths,
      rate: result.rate,
      purpose: state.purpose,
    })
  )
}

async function handleRefereeBackCallback(chatId: string): Promise<void> {
  const state = await getPendingLoanRequest(chatId)
  const member = await requireLinkedActiveMember(chatId)
  if (!state || state.step !== 'referees' || !member) return

  await setPendingLoanRequest(chatId, { ...state, searchRole: undefined })
  await sendRefereeCategoryMenu(chatId, createAdminClient(), member.id)
}

async function handleRefereeCancelCallback(chatId: string): Promise<void> {
  await clearPendingLoanRequest(chatId)
  await sendTelegramMessageWithCommandButtons(chatId, tgLoanRequestCancelled())
}

async function handleRefereeResponseCallback(
  chatId: string,
  callbackQueryId: string,
  decisionCode: 'o' | 'p' | 'd',
  loanRefereeId: string
): Promise<void> {
  const member = await requireLinkedActiveMember(chatId)
  if (!member) return

  const decision =
    decisionCode === 'o' ? 'accepted_online' : decisionCode === 'p' ? 'accepted_physical' : 'declined'

  const admin = createAdminClient()
  const outcome = await processRefereeResponse(admin, {
    loanRefereeId,
    respondingMemberId: member.id,
    decision,
  })

  if (outcome.outcome === 'not_your_invite') {
    await answerTelegramCallbackQuery(callbackQueryId, 'សំណើនេះមិនមែនសម្រាប់អ្នកទេ។', true)
    return
  }
  if (outcome.outcome === 'already_responded') {
    await answerTelegramCallbackQuery(callbackQueryId, 'អ្នកបានឆ្លើយតបរួចហើយ។', true)
    return
  }

  const thanksText =
    decision === 'declined'
      ? 'បានកត់ត្រាការបដិសេធរបស់អ្នក។'
      : decision === 'accepted_online'
        ? 'អរគុណ! បានកត់ត្រាការទទួលយក (អនឡាញ)។'
        : 'អរគុណ! បានកត់ត្រាការទទួលយក (ជួបផ្ទាល់)។'
  await answerTelegramCallbackQuery(callbackQueryId, thanksText)
}

async function handleCancelLoanCommand(chatId: string): Promise<void> {
  const pending = await getPendingLoanRequest(chatId)
  if (pending) {
    await clearPendingLoanRequest(chatId)
    await sendTelegramMessageWithCommandButtons(chatId, tgLoanRequestCancelled())
    return
  }

  const member = await requireLinkedActiveMember(chatId)
  if (!member) return

  const admin = createAdminClient()
  const { data: loan } = await admin
    .from('loans')
    .select('id')
    .eq('member_id', member.id)
    .eq('status', 'awaiting_referee')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!loan) {
    await sendTelegramMessageWithCommandButtons(chatId, tgNoActiveLoanRequestToCancel())
    return
  }

  const cancelled = await rejectAwaitingRefereeLoan(admin, loan.id, {
    rejectionReason: 'បានលុបចោលដោយសមាជិកខ្លួនឯង',
    requesterMessage: tgLoanRequestCancelled(),
    pendingRefereeMessage: tgRefereeInviteCancelled(),
  })

  await sendTelegramMessageWithCommandButtons(
    chatId,
    cancelled ? tgLoanRequestCancelled() : tgNoActiveLoanRequestToCancel()
  )
}

async function fetchVerifiedSavingsBalance(memberId: string): Promise<number> {
  const admin = createAdminClient()
  const { data: savings } = await admin
    .from('savings')
    .select('amount, status')
    .eq('member_id', memberId)
    .in('status', ['verified', 'completed'])

  return (savings ?? []).reduce((sum, r) => sum + Number(r.amount ?? 0), 0)
}

async function handleRequestWithdrawalCommand(chatId: string): Promise<void> {
  const member = await requireLinkedActiveMember(chatId)
  if (!member) return

  const admin = createAdminClient()

  // Block if they already have a pending withdrawal request
  const { data: existingRequest } = await admin
    .from('capital_requests')
    .select('id')
    .eq('member_id', member.id)
    .eq('status', 'pending')
    .limit(1)
    .maybeSingle()

  if (existingRequest) {
    await sendTelegramMessageWithCommandButtons(chatId, tgWithdrawalRequestBlocked())
    return
  }

  const balance = await fetchVerifiedSavingsBalance(member.id)
  if (balance <= 0) {
    await sendTelegramMessageWithCommandButtons(chatId, tgWithdrawalNoSavings())
    return
  }

  await setPendingWithdrawalRequest(chatId, { step: 'amount' })
  await sendTelegramMessage(chatId, tgWithdrawalRequestStart(fmtMoney(balance)))
}

async function handleWithdrawalRequestStep(chatId: string, input: string): Promise<void> {
  const state = await getPendingWithdrawalRequest(chatId)
  if (!state) return

  const member = await requireLinkedActiveMember(chatId)
  if (!member) {
    await clearPendingWithdrawalRequest(chatId)
    return
  }

  if (state.step === 'amount') {
    const balance = await fetchVerifiedSavingsBalance(member.id)
    const normalized = input.trim().toLowerCase()
    const amount = ['ទាំងអស់', 'all'].includes(normalized)
      ? balance
      : parseFloat(input.replace(/[^0-9.]/g, ''))

    if (!amount || amount <= 0) {
      await sendTelegramMessage(chatId, tgPromptValidAmount())
      return
    }
    if (amount > balance) {
      await sendTelegramMessage(
        chatId,
        formatTelegramNotification(
          'ចំនួនលើសសមតុល្យ',
          `ចំនួនមិនអាចលើសសមតុល្យសន្សំរបស់អ្នក ${fmtMoney(balance)} ។`
        )
      )
      return
    }

    await setPendingWithdrawalRequest(chatId, { step: 'reason', amount })
    await sendTelegramMessage(
      chatId,
      formatTelegramNotification(
        'ចំនួនត្រូវបានរក្សាទុក',
        [
          formatTelegramField('ចំនួន', fmtMoney(amount)),
          '',
          'សូមប្រាប់មូលហេតុនៃការស្នើសុំដកប្រាក់របស់អ្នក។',
        ].join('\n')
      )
    )
    return
  }

  if (state.step === 'reason') {
    const reason = input.trim()
    if (reason.length < 3) {
      await sendTelegramMessage(
        chatId,
        formatTelegramNotification(
          'មូលហេតុមិនគ្រប់គ្រាន់',
          'សូមពិពណ៌នាមូលហេតុនៃការដកប្រាក់ឱ្យច្បាស់លាស់ជាងនេះ។'
        )
      )
      return
    }

    await setPendingWithdrawalRequest(chatId, { step: 'membership', amount: state.amount, reason })
    await sendTelegramMessage(
      chatId,
      formatTelegramNotification(
        'សំណួរចុងក្រោយ',
        [
          'តើអ្នកចង់បន្តជាសមាជិកសហករណ៍ បន្ទាប់ពីការដកនេះដែរឬទេ?',
          '',
          'សូមឆ្លើយ <code>បន្ត</code> ដើម្បីបន្តជាសមាជិក',
          'ឬ <code>ឈប់</code> ដើម្បីឈប់ធ្វើជាសមាជិក',
        ].join('\n')
      )
    )
    return
  }

  if (state.step === 'membership') {
    const normalized = input.trim().toLowerCase()
    const continueLabels = ['បន្ត', 'continue']
    const stopLabels = ['ឈប់', 'stop', 'withdraw', 'leave']

    let continueSaving: boolean
    if (continueLabels.includes(normalized)) {
      continueSaving = true
    } else if (stopLabels.includes(normalized)) {
      continueSaving = false
    } else {
      await sendTelegramMessage(
        chatId,
        formatTelegramNotification('សូមឆ្លើយឱ្យច្បាស់', 'សូមឆ្លើយ <code>បន្ត</code> ឬ <code>ឈប់</code>។')
      )
      return
    }

    const balance = await fetchVerifiedSavingsBalance(member.id)
    await setPendingWithdrawalRequest(chatId, {
      step: 'confirm',
      amount: state.amount,
      reason: state.reason,
      continueSaving,
    })
    await sendTelegramMessage(
      chatId,
      tgWithdrawalRequestReview({
        amount: fmtMoney(state.amount),
        balance: fmtMoney(balance),
        remaining: fmtMoney(Math.max(balance - state.amount, 0)),
        reason: state.reason,
        continuing: continueSaving,
      })
    )
    return
  }

  if (state.step === 'confirm') {
    const normalized = input.trim().toLowerCase()
    const confirmLabels = ['បញ្ជាក់', 'confirm', 'yes']
    const cancelLabels = ['បោះបង់', 'cancel', 'no']

    if (cancelLabels.includes(normalized)) {
      await clearPendingWithdrawalRequest(chatId)
      await sendTelegramMessageWithCommandButtons(chatId, tgWithdrawalRequestCancelled())
      return
    }

    if (!confirmLabels.includes(normalized)) {
      await sendTelegramMessage(
        chatId,
        formatTelegramNotification(
          'សូមឆ្លើយឱ្យច្បាស់',
          'សូមឆ្លើយ <code>បញ្ជាក់</code> ដើម្បីដាក់ស្នើ ឬ <code>បោះបង់</code> ដើម្បីលុបចោល។'
        )
      )
      return
    }

    await clearPendingWithdrawalRequest(chatId)

    const admin = createAdminClient()
    const { error } = await admin.from('capital_requests').insert({
      member_id: member.id,
      amount: state.amount,
      currency: 'USD',
      reason: state.reason,
      continue_saving: state.continueSaving,
      remove_membership: !state.continueSaving,
      status: 'pending',
    })

    if (error) {
      await sendTelegramMessage(chatId, tgErrorGeneric('មិនអាចដាក់ស្នើសុំដកប្រាក់បានទេ។ សូមព្យាយាមម្តងទៀត។'))
      return
    }

    await notifyAdmins(
      'សំណើដកសន្សំថ្មី',
      tgAdminRequestBody({
        memberName: memberKhmerName(member),
        fields: [
          { label: 'ចំនួន', value: fmtMoney(state.amount) },
          { label: 'បន្ទាប់ពីដក', value: state.continueSaving ? 'បន្តសន្សំ' : 'ឈប់ចូលជាសមាជិក' },
        ],
        note: 'សូមពិនិត្យនៅផ្នែកស្នើសុំដកដើមទុន។',
      }),
      'capital_request'
    )
    revalidatePath('/admin')
    revalidatePath('/admin/savings/capital')
    revalidatePath('/admin/capital')

    await sendTelegramMessageWithCommandButtons(
      chatId,
      tgWithdrawalRequestSubmitted({
        amount: fmtMoney(state.amount),
        continuing: state.continueSaving,
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
    console.log('[RefereeDebug] callback_query received', { cbChatId, data, cbqId: cbq.id })

    // Referee callbacks answer the query themselves (with a toast where useful),
    // so they must NOT be pre-answered blank below.
    if (cbChatId && data.startsWith(REFEREE_CATEGORY_PREFIX)) {
      await answerTelegramCallbackQuery(cbq.id)
      await handleRefereeCategoryCallback(cbChatId, data.slice(REFEREE_CATEGORY_PREFIX.length) as MemberRole)
      return NextResponse.json({ ok: true })
    }
    if (cbChatId && data.startsWith(REFEREE_PICK_PREFIX)) {
      await handleRefereePickCallback(cbChatId, cbq.id, data.slice(REFEREE_PICK_PREFIX.length))
      return NextResponse.json({ ok: true })
    }
    if (cbChatId && data === REFEREE_BACK) {
      await answerTelegramCallbackQuery(cbq.id)
      await handleRefereeBackCallback(cbChatId)
      return NextResponse.json({ ok: true })
    }
    if (cbChatId && data === REFEREE_CANCEL) {
      await answerTelegramCallbackQuery(cbq.id)
      await handleRefereeCancelCallback(cbChatId)
      return NextResponse.json({ ok: true })
    }
    if (cbChatId && data.startsWith(REFEREE_RESPONSE_PREFIX)) {
      // Shape: rfa:o:<loanRefereeId> | rfa:p:<loanRefereeId> | rfa:d:<loanRefereeId>
      const rest = data.slice(REFEREE_RESPONSE_PREFIX.length)
      const decisionCode = rest.slice(0, 1) as 'o' | 'p' | 'd'
      const loanRefereeId = rest.slice(2)
      await handleRefereeResponseCallback(cbChatId, cbq.id, decisionCode, loanRefereeId)
      return NextResponse.json({ ok: true })
    }

    await answerTelegramCallbackQuery(cbq.id)
    if (cbChatId) {
      if (data === '/saving')      await handleSavingCommand(cbChatId)
      else if (data === '/loan')   await handleLoanCommand(cbChatId)
      else if (data === '/paysaving')   await handlePaySavingCommand(cbChatId)
      else if (data === '/payloan')     await handlePayLoanCommand(cbChatId)
      else if (data === '/requestloan') await handleRequestLoanCommand(cbChatId)
      else if (data === '/requestwithdrawal') await handleRequestWithdrawalCommand(cbChatId)
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

  if (text === '/requestwithdrawal' || text.startsWith('/requestwithdrawal@')) {
    await handleRequestWithdrawalCommand(chatIdStr)
    return NextResponse.json({ ok: true })
  }

  if (text === '/cancelloan' || text.startsWith('/cancelloan@')) {
    await handleCancelLoanCommand(chatIdStr)
    return NextResponse.json({ ok: true })
  }

  // Reply-keyboard menu buttons — map label text to command handlers
  const menuButtonHandlers: Record<string, (id: string) => Promise<void>> = {
    'របាយការសន្សំ': handleSavingCommand,
    'របាយការកម្ចី': handleLoanCommand,
    'ដាក់ប្រាក់សន្សំ': handlePaySavingCommand,
    'សងកម្ជី': handlePayLoanCommand,
    'ស្នើសុំកម្ជី': handleRequestLoanCommand,
    'ស្នើសំដកសន្សំ': handleRequestWithdrawalCommand,
    // Aliases for the pre-rename labels — members whose Telegram client still
    // shows the old persistent keyboard (sent before this rename) would otherwise
    // fall through to the "please connect" fallback on tap.
    'ការសន្សំ': handleSavingCommand,
    'ប្រាក់កម្ជី': handleLoanCommand,
    'ដាក់ស្នើសន្សំ': handlePaySavingCommand,
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

  // Mid-conversation withdrawal request — intercept plain text replies
  if (text && !text.startsWith('/') && (await getPendingWithdrawalRequest(chatIdStr))) {
    await handleWithdrawalRequestStep(chatIdStr, text)
    return NextResponse.json({ ok: true })
  }

  // Awaiting a signed loan contract — plain text means they haven't sent the
  // file yet, remind them instead of falling through to the generic fallback.
  if (text && !text.startsWith('/') && (await getPendingLoanSignature(chatIdStr))) {
    await sendTelegramMessage(chatIdStr, tgLoanSignatureReminder())
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

  // Photo / document message — check pending payment / loan-signature state
  const photo = message?.photo
  const doc = message?.document
  const awaitingSignature = await getPendingLoanSignature(chatIdStr)

  if (awaitingSignature && photo && photo.length > 0) {
    const largest = photo.reduce((a, b) => (a.file_size ?? 0) > (b.file_size ?? 0) ? a : b)
    await handleSignedLoanDocument(chatIdStr, largest.file_id, null)
    return NextResponse.json({ ok: true })
  }
  if (awaitingSignature && doc) {
    await handleSignedLoanDocument(chatIdStr, doc.file_id, doc)
    return NextResponse.json({ ok: true })
  }

  if (photo && photo.length > 0) {
    const largest = photo.reduce((a, b) => (a.file_size ?? 0) > (b.file_size ?? 0) ? a : b)
    await handlePhotoMessage(chatIdStr, largest.file_id, message?.caption ?? undefined)
    return NextResponse.json({ ok: true })
  }
  if (doc && doc.mime_type?.startsWith('image/')) {
    await handlePhotoMessage(chatIdStr, doc.file_id, message?.caption ?? undefined)
    return NextResponse.json({ ok: true })
  }

  // Free text that no command/menu-button/pending-flow check above claimed.
  // For an already-linked, active member this is a message meant for admin,
  // not gibberish — forward it into the admin chat inbox instead of the
  // generic "please connect your account" fallback below (which would be
  // wrong for someone who's already linked). Deliberately not reusing
  // requireLinkedActiveMember here: it has its own side-effecting messages
  // for the not-linked/not-active cases, and this must leave that fallback
  // path completely unchanged for anyone not already linked+active.
  if (text && !text.startsWith('/')) {
    const admin = createAdminClient()
    const { data: linkedMember } = await admin
      .from('members')
      .select('id, status')
      .eq('telegram_chat_id', chatIdStr)
      .maybeSingle()

    if (linkedMember && linkedMember.status === 'active') {
      await recordMemberChatMessage(linkedMember.id, text)
      await sendTelegramMessage(chatIdStr, tgChatMessageForwarded())
      return NextResponse.json({ ok: true })
    }
  }

  await sendTelegramMessageWithCommandButtons(chatIdStr, WELCOME_NO_TOKEN)
  return NextResponse.json({ ok: true })
}

async function recordMemberChatMessage(memberId: string, body: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from('admin_member_messages').insert({
    member_id: memberId,
    sender_type: 'member',
    body,
  })
  if (error) {
    console.error('[Webhook] recordMemberChatMessage failed:', error.message)
  }
}
