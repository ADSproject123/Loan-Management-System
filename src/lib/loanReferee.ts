import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { getInterestSettings, fetchMemberLoanInterestRate } from '@/lib/interest'
import { addMonths, todayIso } from '@/lib/dates'
import { notifyAdmins } from '@/lib/notifyAdmins'
import { formatMoney } from '@/lib/currency'
import {
  sendTelegramMessage,
  sendTelegramMessageWithInlineKeyboard,
  sendTelegramDocument,
} from '@/lib/telegram'
import {
  tgAdminRefereeAwaiting,
  tgAdminRefereePhysicalPath,
  tgLoanExpiredNoResponse,
  tgLoanReadyForPhysicalReview,
  tgLoanReadyForSignature,
  tgLoanRejectedByReferee,
  tgRefereeInvite,
  tgRefereeInviteCancelled,
  tgRefereeInviteExpired,
  tgRefereeReadyForSignature,
} from '@/lib/telegramMessages'
import {
  getPendingLoanSignature,
  setPendingLoanSignature,
  setPendingRefereeSignature,
} from '@/lib/telegramConversationState'
import type { MemberRole, LoanRefereeStatus } from '@/types/database'

// NOTE: unrelated to loans.referee_id / referee_verified (an older, free-text
// guarantor-contact-info feature used only by the web loan-request form). This
// module owns the newer loan_referees workflow exclusively — do not conflate.

export const ROLES: MemberRole[] = ['founder', 'comember', 'member']
export const REFEREE_LIST_THRESHOLD = 10
export const REFEREE_RESPONSE_TIMEOUT_DAYS = 3

export const REFEREE_CATEGORY_PREFIX = 'rfcat:'
export const REFEREE_PICK_PREFIX = 'rfpick:'
export const REFEREE_BACK = 'rfback'
export const REFEREE_CANCEL = 'rfcancel'
export const REFEREE_RESPONSE_PREFIX = 'rfa:'

function escapeIlikePattern(value: string) {
  return value.replace(/[%_,]/g, (char) => `\\${char}`)
}

export type RefereeCandidate = {
  id: string
  full_name_kh: string | null
  full_name_en: string | null
  phone: string | null
}

function normalizeCandidateRow(row: {
  id: string
  full_name: string
  full_name_kh: string | null
  full_name_en: string | null
  phone: string | null
}): RefereeCandidate {
  return {
    id: row.id,
    full_name_kh: row.full_name_kh ?? row.full_name,
    full_name_en: row.full_name_en ?? row.full_name,
    phone: row.phone ?? null,
  }
}

export function refereeDisplayName(candidate: { full_name_kh: string | null; full_name_en: string | null }) {
  return candidate.full_name_kh ?? candidate.full_name_en ?? 'សមាជិកមិនស្គាល់'
}

/** Live candidate counts per role, for the category menu buttons. */
export async function countRefereeCandidatesByRole(
  admin: SupabaseClient,
  requesterId: string
): Promise<Record<MemberRole, number>> {
  const counts: Record<MemberRole, number> = { founder: 0, comember: 0, member: 0 }
  for (const role of ROLES) {
    const { count } = await admin
      .from('members')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('is_admin', false)
      .eq('role', role)
      .not('telegram_chat_id', 'is', null)
      .neq('id', requesterId)
    counts[role] = count ?? 0
  }
  return counts
}

export type RefereeCandidateResult =
  | { mode: 'list'; candidates: RefereeCandidate[] }
  | { mode: 'search' }

/**
 * Small roles (few founders/core members) render as toggle buttons; a role
 * with more than REFEREE_LIST_THRESHOLD active, Telegram-linked candidates
 * falls back to search instead of a truncated list.
 */
export async function fetchRefereeCandidates(
  admin: SupabaseClient,
  role: MemberRole,
  requesterId: string
): Promise<RefereeCandidateResult> {
  const { data } = await admin
    .from('members')
    .select('id, full_name, full_name_kh, full_name_en, phone')
    .eq('status', 'active')
    .eq('is_admin', false)
    .eq('role', role)
    .not('telegram_chat_id', 'is', null)
    .neq('id', requesterId)
    .order('full_name_kh', { ascending: true })
    .limit(REFEREE_LIST_THRESHOLD + 1)

  const rows = data ?? []
  if (rows.length > REFEREE_LIST_THRESHOLD) {
    return { mode: 'search' }
  }

  return { mode: 'list', candidates: rows.map(normalizeCandidateRow) }
}

export async function searchRefereeCandidates(
  admin: SupabaseClient,
  role: MemberRole,
  requesterId: string,
  query: string
): Promise<RefereeCandidate[]> {
  const trimmed = query.trim()
  if (!trimmed) return []
  const pattern = `%${escapeIlikePattern(trimmed)}%`

  const { data } = await admin
    .from('members')
    .select('id, full_name, full_name_kh, full_name_en, phone')
    .eq('status', 'active')
    .eq('is_admin', false)
    .eq('role', role)
    .not('telegram_chat_id', 'is', null)
    .neq('id', requesterId)
    .or(
      `full_name_kh.ilike.${pattern},full_name_en.ilike.${pattern},full_name.ilike.${pattern},phone.ilike.${pattern}`
    )
    .order('full_name_kh', { ascending: true })
    .limit(8)

  return (data ?? []).map(normalizeCandidateRow)
}

// ---------------------------------------------------------------------------
// Finalize: insert the loan + loan_referees rows, send invites
// ---------------------------------------------------------------------------

export type FinalizeLoanRequestParams = {
  memberId: string
  requesterName: string
  amount: number
  termMonths: number
  purpose: string
  refereeIds: string[]
}

export type FinalizeLoanRequestResult =
  | { ok: true; loanId: string; rate: number }
  | { ok: false; error: string }

export async function finalizeLoanRequest(
  admin: SupabaseClient,
  params: FinalizeLoanRequestParams
): Promise<FinalizeLoanRequestResult> {
  const interestSettings = await getInterestSettings()
  const rate = await fetchMemberLoanInterestRate(params.memberId, interestSettings.monthlyLoanInterestRate)
  const startDate = todayIso()
  const endDate = addMonths(startDate, params.termMonths)

  const { data: loan, error: loanError } = await admin
    .from('loans')
    .insert({
      member_id: params.memberId,
      amount: params.amount,
      currency: 'USD',
      purpose: params.purpose,
      term_months: params.termMonths,
      monthly_interest_rate: rate,
      start_date: startDate,
      end_date: endDate,
      status: 'awaiting_referee',
    })
    .select('id')
    .single()

  if (loanError || !loan) {
    return { ok: false, error: 'មិនអាចដាក់ស្នើសុំកម្ជីបានទេ។ សូមព្យាយាមម្តងទៀត។' }
  }

  const { error: refereesError } = await admin.from('loan_referees').insert(
    params.refereeIds.map((referee_member_id) => ({ loan_id: loan.id, referee_member_id }))
  )

  if (refereesError) {
    await admin.from('loans').delete().eq('id', loan.id)
    return { ok: false, error: 'មិនអាចរក្សាទុកមេធានាបានទេ។ សូមព្យាយាមម្តងទៀត។' }
  }

  const { data: refereeRows } = await admin
    .from('loan_referees')
    .select('id, referee:referee_member_id(telegram_chat_id)')
    .eq('loan_id', loan.id)

  const amountText = formatMoney(params.amount)
  for (const row of refereeRows ?? []) {
    const refMember = Array.isArray(row.referee) ? row.referee[0] : row.referee
    const chatId = refMember?.telegram_chat_id
    if (!chatId) continue
    // Best-effort per referee — one failed send must not affect the others.
    await sendTelegramMessageWithInlineKeyboard(
      chatId,
      tgRefereeInvite({
        requesterName: params.requesterName,
        amount: amountText,
        termMonths: params.termMonths,
        purpose: params.purpose,
      }),
      [
        [
          { text: '✅ ទទួលយក (អនឡាញ)', callback_data: `${REFEREE_RESPONSE_PREFIX}o:${row.id}` },
          { text: '🤝 ទទួលយក (ជួបផ្ទាល់)', callback_data: `${REFEREE_RESPONSE_PREFIX}p:${row.id}` },
        ],
        [{ text: '❌ បដិសេធ', callback_data: `${REFEREE_RESPONSE_PREFIX}d:${row.id}` }],
      ]
    )
  }

  return { ok: true, loanId: loan.id, rate }
}

// ---------------------------------------------------------------------------
// Referee response handling — concurrency-safe via conditional updates
// ---------------------------------------------------------------------------

type SiblingRow = {
  id: string
  status: LoanRefereeStatus
  referee_member_id: string
  referee:
    | { full_name: string; full_name_kh: string | null; full_name_en: string | null }
    | { full_name: string; full_name_kh: string | null; full_name_en: string | null }[]
    | null
}

function normalizeOne<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value
}

async function fetchSiblingReferees(admin: SupabaseClient, loanId: string): Promise<SiblingRow[]> {
  const { data } = await admin
    .from('loan_referees')
    .select('id, status, referee_member_id, referee:referee_member_id(full_name, full_name_kh, full_name_en)')
    .eq('loan_id', loanId)
  return (data ?? []) as SiblingRow[]
}

/** Reject an awaiting_referee loan and notify requester + still-pending referees. Idempotent. */
export async function rejectAwaitingRefereeLoan(
  admin: SupabaseClient,
  loanId: string,
  options: { rejectionReason: string; requesterMessage: string; pendingRefereeMessage: string }
): Promise<boolean> {
  const { data: updated } = await admin
    .from('loans')
    .update({
      status: 'rejected',
      rejection_reason: options.rejectionReason,
      rejected_at: new Date().toISOString(),
    })
    .eq('id', loanId)
    .eq('status', 'awaiting_referee')
    .select('id, member_id')
    .maybeSingle()

  if (!updated) return false

  const { data: member } = await admin
    .from('members')
    .select('telegram_chat_id')
    .eq('id', updated.member_id)
    .maybeSingle()
  if (member?.telegram_chat_id) {
    await sendTelegramMessage(member.telegram_chat_id, options.requesterMessage)
  }

  const siblings = await fetchSiblingReferees(admin, loanId)
  const pendingIds = siblings.filter((r) => r.status === 'pending').map((r) => r.referee_member_id)
  if (pendingIds.length > 0) {
    const { data: pendingMembers } = await admin
      .from('members')
      .select('telegram_chat_id')
      .in('id', pendingIds)
    for (const m of pendingMembers ?? []) {
      if (m.telegram_chat_id) await sendTelegramMessage(m.telegram_chat_id, options.pendingRefereeMessage)
    }
  }

  return true
}

export type RefereeResponseOutcome =
  | { outcome: 'not_your_invite' }
  | { outcome: 'already_responded' }
  | { outcome: 'recorded' }

/**
 * Records one referee's response (compare-and-swap on their own row, gated on
 * status='pending' so duplicate/stale taps are harmless no-ops) and, if this
 * response resolves the whole request, performs the loan-level transition and
 * all resulting notifications. See supabase/migrations/031 + the loanReferee
 * design notes for the concurrency reasoning.
 */
export async function processRefereeResponse(
  admin: SupabaseClient,
  params: {
    loanRefereeId: string
    respondingMemberId: string
    decision: 'accepted_online' | 'accepted_physical' | 'declined'
  }
): Promise<RefereeResponseOutcome> {
  const { data: row } = await admin
    .from('loan_referees')
    .select('id, loan_id, referee_member_id, status')
    .eq('id', params.loanRefereeId)
    .maybeSingle()

  if (!row || row.referee_member_id !== params.respondingMemberId) {
    return { outcome: 'not_your_invite' }
  }

  const { data: updatedRow } = await admin
    .from('loan_referees')
    .update({ status: params.decision, responded_at: new Date().toISOString() })
    .eq('id', params.loanRefereeId)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()

  if (!updatedRow) {
    return { outcome: 'already_responded' }
  }

  await resolveLoanAfterResponse(admin, row.loan_id, params.decision, {
    loanRefereeId: params.loanRefereeId,
    respondingMemberId: params.respondingMemberId,
  })
  return { outcome: 'recorded' }
}

async function resolveLoanAfterResponse(
  admin: SupabaseClient,
  loanId: string,
  triggeringDecision: 'accepted_online' | 'accepted_physical' | 'declined',
  responder: { loanRefereeId: string; respondingMemberId: string }
): Promise<void> {
  const { data: loan } = await admin
    .from('loans')
    .select('member_id, amount')
    .eq('id', loanId)
    .maybeSingle()
  if (!loan) return

  const { data: requester } = await admin
    .from('members')
    .select('telegram_chat_id, full_name, full_name_kh, full_name_en')
    .eq('id', loan.member_id)
    .maybeSingle()

  const amountText = formatMoney(Number(loan.amount ?? 0))
  const requesterName = requester?.full_name_kh ?? requester?.full_name_en ?? requester?.full_name ?? ''

  // A referee who just accepted online must sign the contract themselves
  // before it goes to the requester - send it to them immediately, regardless
  // of whether sibling referees have responded yet.
  if (triggeringDecision === 'accepted_online') {
    const { data: refereeMember } = await admin
      .from('members')
      .select('telegram_chat_id')
      .eq('id', responder.respondingMemberId)
      .maybeSingle()

    if (refereeMember?.telegram_chat_id) {
      await sendTelegramMessage(refereeMember.telegram_chat_id, tgRefereeReadyForSignature(amountText))
      await setPendingRefereeSignature(refereeMember.telegram_chat_id, {
        loanId,
        loanRefereeId: responder.loanRefereeId,
      })
      const contractUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/loan-application-contract.docx`
      await sendTelegramDocument(refereeMember.telegram_chat_id, contractUrl, 'កិច្ចសន្យាកម្ជី')
    }
  }

  if (triggeringDecision === 'declined') {
    const siblings = await fetchSiblingReferees(admin, loanId)
    const decliner = siblings.find((r) => r.status === 'declined')
    const declinerName = decliner ? refereeDisplayName(normalizeOne(decliner.referee) as never) : ''

    await rejectAwaitingRefereeLoan(admin, loanId, {
      rejectionReason: 'បដិសេធដោយមេធានា',
      requesterMessage: tgLoanRejectedByReferee(declinerName),
      pendingRefereeMessage: tgRefereeInviteCancelled(),
    })
    return
  }

  // Acceptance path: only transition if a fresh re-query shows the set is fully
  // resolved (no pending, no declines — a decline is handled by its own
  // invocation above, never here).
  const siblings = await fetchSiblingReferees(admin, loanId)
  if (siblings.some((r) => r.status === 'pending' || r.status === 'declined')) return

  const allOnline = siblings.length > 0 && siblings.every((r) => r.status === 'accepted_online')

  const { data: transitioned } = await admin
    .from('loans')
    .update({ status: 'under_review' })
    .eq('id', loanId)
    .eq('status', 'awaiting_referee')
    .select('id')
    .maybeSingle()

  // Zero rows back means another concurrent response already performed this
  // transition — this invocation lost the race, stop silently.
  if (!transitioned) return

  const refereeNames = siblings.map((r) => refereeDisplayName(normalizeOne(r.referee) as never))

  if (allOnline) {
    // The requester is not messaged yet - every online referee must sign and
    // return the contract first. See tryAdvanceToRequesterSignature, which
    // sends it to the requester once the last referee's signature comes in.
    await notifyAdmins(
      'កម្ជីកំពុងរង់ចាំហត្ថលេខាមេធានា',
      tgAdminRefereeAwaiting({ memberName: requesterName, amount: amountText, refereeNames }),
      'loan_referee'
    )
    return
  }

  if (requester?.telegram_chat_id) {
    await sendTelegramMessage(requester.telegram_chat_id, tgLoanReadyForPhysicalReview())
  }
  const physicalNames = siblings
    .filter((r) => r.status === 'accepted_physical')
    .map((r) => refereeDisplayName(normalizeOne(r.referee) as never))
  await notifyAdmins(
    'កម្ជីត្រូវការដំណើរការជួបផ្ទាល់',
    tgAdminRefereePhysicalPath({ memberName: requesterName, amount: amountText, physicalRefereeNames: physicalNames }),
    'loan_referee'
  )
}

export type RecordRefereeSignedDocumentOutcome =
  | { ok: false }
  | { ok: true; amountText: string; requesterName: string }

/**
 * Stores a referee's own signed contract (uploaded by the caller - this just
 * records the resulting key) and, once every online-accepting referee on the
 * loan has done the same, forwards the contract to the requester to sign.
 * Mirrors the concurrency approach in resolveLoanAfterResponse: re-fetches
 * siblings fresh rather than trusting caller-provided state.
 */
export async function recordRefereeSignedDocument(
  admin: SupabaseClient,
  params: { loanRefereeId: string; respondingMemberId: string; documentKey: string }
): Promise<RecordRefereeSignedDocumentOutcome> {
  const { data: updated } = await admin
    .from('loan_referees')
    .update({ signed_document_url: params.documentKey })
    .eq('id', params.loanRefereeId)
    .eq('referee_member_id', params.respondingMemberId)
    .eq('status', 'accepted_online')
    .select('loan_id')
    .maybeSingle()

  if (!updated) return { ok: false }

  const { data: loan } = await admin
    .from('loans')
    .select('member_id, amount')
    .eq('id', updated.loan_id)
    .maybeSingle()
  const amountText = formatMoney(Number(loan?.amount ?? 0))

  const { data: requester } = await admin
    .from('members')
    .select('full_name, full_name_kh, full_name_en')
    .eq('id', loan?.member_id ?? '')
    .maybeSingle()
  const requesterName = requester?.full_name_kh ?? requester?.full_name_en ?? requester?.full_name ?? ''

  await tryAdvanceToRequesterSignature(admin, updated.loan_id)

  return { ok: true, amountText, requesterName }
}

/**
 * Checks whether every accepted-online referee on the loan has now signed and
 * returned their own contract; if so, sends it on to the requester. No-op
 * (including for mixed/physical/pending loans) otherwise. Safe to call after
 * every individual referee signature - only the one that completes the set
 * actually messages the requester, guarded by requester not already having a
 * pending signature.
 */
async function tryAdvanceToRequesterSignature(admin: SupabaseClient, loanId: string): Promise<void> {
  const { data: loan } = await admin
    .from('loans')
    .select('member_id, amount, status')
    .eq('id', loanId)
    .maybeSingle()
  if (!loan || loan.status !== 'under_review') return

  const siblings = await fetchSiblingReferees(admin, loanId)
  const allOnline = siblings.length > 0 && siblings.every((r) => r.status === 'accepted_online')
  if (!allOnline) return

  const { data: signedRows } = await admin
    .from('loan_referees')
    .select('signed_document_url')
    .eq('loan_id', loanId)
  if (!signedRows?.length || signedRows.some((r) => !r.signed_document_url)) return

  const { data: requester } = await admin
    .from('members')
    .select('telegram_chat_id')
    .eq('id', loan.member_id)
    .maybeSingle()
  if (!requester?.telegram_chat_id) return

  // Guard against double-send if two referees' signatures race in.
  const alreadyPending = await getPendingLoanSignature(requester.telegram_chat_id)
  if (alreadyPending) return

  const amountText = formatMoney(Number(loan.amount ?? 0))
  await sendTelegramMessage(requester.telegram_chat_id, tgLoanReadyForSignature(amountText))
  await setPendingLoanSignature(requester.telegram_chat_id, { loanId })
  const contractUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/loan-application-contract.docx`
  await sendTelegramDocument(requester.telegram_chat_id, contractUrl, 'កិច្ចសន្យាកម្ជី')
}

export type LoanReferee = {
  id: string
  status: LoanRefereeStatus
  responded_at: string | null
  referee_member_id: string
  signed_document_url: string | null
  referee: { id: string; full_name: string; full_name_kh: string | null; full_name_en: string | null } | null
}

/** Read-only listing used by the admin loan detail page. */
export async function fetchLoanReferees(admin: SupabaseClient, loanId: string): Promise<LoanReferee[]> {
  const { data } = await admin
    .from('loan_referees')
    .select(
      'id, status, responded_at, referee_member_id, signed_document_url, referee:referee_member_id(id, full_name, full_name_kh, full_name_en)'
    )
    .eq('loan_id', loanId)
    .order('created_at', { ascending: true })

  return (data ?? []).map((row) => ({
    ...row,
    referee: normalizeOne(row.referee),
  })) as LoanReferee[]
}

/** Loans stuck in awaiting_referee past the response window — used by the expiry cron. */
export async function fetchExpiredAwaitingRefereeLoans(admin: SupabaseClient) {
  const cutoff = new Date(Date.now() - REFEREE_RESPONSE_TIMEOUT_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const { data } = await admin
    .from('loans')
    .select('id')
    .eq('status', 'awaiting_referee')
    .lt('created_at', cutoff)
  return data ?? []
}

export async function expireAwaitingRefereeLoan(admin: SupabaseClient, loanId: string): Promise<boolean> {
  return rejectAwaitingRefereeLoan(admin, loanId, {
    rejectionReason: 'ផុតកំណត់ពេលរង់ចាំមេធានា',
    requesterMessage: tgLoanExpiredNoResponse(),
    pendingRefereeMessage: tgRefereeInviteExpired(),
  })
}
