import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import type { MemberRole } from '@/types/database'

// Persistent replacement for the old in-memory conversation Maps. State is
// keyed by (chat_id, flow) in the telegram_conversation_state table so it
// survives across serverless invocations. See migration 030.

export type PendingPayment =
  | { type: 'saving'; amount?: number; evidenceUrl?: string }
  | { type: 'loan'; loanId: string; amount: number }

export type PendingLoanRequest =
  | { step: 'amount' }
  | { step: 'term'; amount: number }
  | { step: 'purpose'; amount: number; termMonths: number }
  | {
      step: 'referees'
      amount: number
      termMonths: number
      purpose: string
      // Set only while awaiting a free-text search query scoped to this role
      // (the candidate list for that role was too large to show as buttons).
      searchRole?: MemberRole
    }

// Independent of PendingLoanRequest above — set only once a loan has fully
// cleared referee approval and is waiting on the requester to send back a
// signed contract. The wizard state is long gone by the time this applies.
export type PendingLoanSignature = { loanId: string }

// Set on a referee's own chat right after they accept a loan online — they
// must sign and return the contract themselves before it goes to the
// requester. Independent of PendingLoanSignature (that one is requester-side).
export type PendingRefereeSignature = { loanId: string; loanRefereeId: string }

export type PendingWithdrawalRequest =
  | { step: 'amount' }
  | { step: 'reason'; amount: number }
  | { step: 'membership'; amount: number; reason: string }
  | { step: 'confirm'; amount: number; reason: string; continueSaving: boolean }

const PAYMENT_FLOW = 'payment'
const LOAN_REQUEST_FLOW = 'loan_request'
const WITHDRAWAL_REQUEST_FLOW = 'withdrawal_request'
const LOAN_SIGNATURE_FLOW = 'loan_signature'
const REFEREE_SIGNATURE_FLOW = 'referee_signature'

async function readState<T>(chatId: string, flow: string): Promise<T | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('telegram_conversation_state')
    .select('state')
    .eq('chat_id', chatId)
    .eq('flow', flow)
    .maybeSingle()
  return (data?.state as T | undefined) ?? null
}

async function writeState(chatId: string, flow: string, state: unknown): Promise<boolean> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('telegram_conversation_state')
    .upsert(
      { chat_id: chatId, flow, state, updated_at: new Date().toISOString() },
      { onConflict: 'chat_id,flow' }
    )

  if (error) {
    console.error('[telegramConversationState] write failed:', error.message)
    return false
  }

  return true
}

async function clearState(chatId: string, flow: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('telegram_conversation_state')
    .delete()
    .eq('chat_id', chatId)
    .eq('flow', flow)

  if (error) {
    console.error('[telegramConversationState] clear failed:', error.message)
  }
}

// Payment proof flow (/paysaving, /payloan → photo upload)
export const getPendingPayment = (chatId: string) =>
  readState<PendingPayment>(chatId, PAYMENT_FLOW)
export const setPendingPayment = (chatId: string, state: PendingPayment) =>
  writeState(chatId, PAYMENT_FLOW, state)
export const clearPendingPayment = (chatId: string) =>
  clearState(chatId, PAYMENT_FLOW)

// Multi-step loan request wizard (/requestloan)
export const getPendingLoanRequest = (chatId: string) =>
  readState<PendingLoanRequest>(chatId, LOAN_REQUEST_FLOW)
export const setPendingLoanRequest = (chatId: string, state: PendingLoanRequest) =>
  writeState(chatId, LOAN_REQUEST_FLOW, state)
export const clearPendingLoanRequest = (chatId: string) =>
  clearState(chatId, LOAN_REQUEST_FLOW)

// Multi-step savings withdrawal wizard (/requestwithdrawal)
export const getPendingWithdrawalRequest = (chatId: string) =>
  readState<PendingWithdrawalRequest>(chatId, WITHDRAWAL_REQUEST_FLOW)
export const setPendingWithdrawalRequest = (chatId: string, state: PendingWithdrawalRequest) =>
  writeState(chatId, WITHDRAWAL_REQUEST_FLOW, state)
export const clearPendingWithdrawalRequest = (chatId: string) =>
  clearState(chatId, WITHDRAWAL_REQUEST_FLOW)

// Awaiting the requester's signed loan contract, after referee approval clears
export const getPendingLoanSignature = (chatId: string) =>
  readState<PendingLoanSignature>(chatId, LOAN_SIGNATURE_FLOW)
export const setPendingLoanSignature = (chatId: string, state: PendingLoanSignature) =>
  writeState(chatId, LOAN_SIGNATURE_FLOW, state)
export const clearPendingLoanSignature = (chatId: string) =>
  clearState(chatId, LOAN_SIGNATURE_FLOW)

// Awaiting a referee's own signed contract, after they accepted online
export const getPendingRefereeSignature = (chatId: string) =>
  readState<PendingRefereeSignature>(chatId, REFEREE_SIGNATURE_FLOW)
export const setPendingRefereeSignature = (chatId: string, state: PendingRefereeSignature) =>
  writeState(chatId, REFEREE_SIGNATURE_FLOW, state)
export const clearPendingRefereeSignature = (chatId: string) =>
  clearState(chatId, REFEREE_SIGNATURE_FLOW)
