import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

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

const PAYMENT_FLOW = 'payment'
const LOAN_REQUEST_FLOW = 'loan_request'

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
