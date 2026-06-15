'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { requestVerificationCode, confirmVerificationCode } from '@/app/actions/verification'
import { Loader2, MessageCircle, ShieldCheck, AlertTriangle, X } from 'lucide-react'

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME

const RESEND_SECONDS = 60

/**
 * Telegram OTP gate rendered as a centered modal overlay.
 * Sends a 6-digit code to the member's linked Telegram chat on mount,
 * then calls onVerified once the member confirms it.
 * If the member verified the same action recently, the server short-circuits
 * and onVerified fires immediately (modal never appears).
 */
export function TelegramVerification({
  action,
  onVerified,
  onCancel,
}: {
  action: 'loan_repay' | 'saving_add' | 'capital_request' | 'loan_request'
  onVerified: () => void
  onCancel?: () => void
}) {
  const [sending, setSending] = useState(true)
  const [sendError, setSendError] = useState<string | null>(null)
  const [notLinked, setNotLinked] = useState(false)
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [resendIn, setResendIn] = useState(0)
  const requestedRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const sendCode = useCallback(async () => {
    setSending(true)
    setSendError(null)
    setNotLinked(false)
    setVerifyError(null)
    const result = await requestVerificationCode(action)
    setSending(false)
    if (!result.success) {
      if (result.notLinked) setNotLinked(true)
      setSendError(result.error)
      return
    }
    if (result.alreadyVerified) {
      onVerified()
      return
    }
    setResendIn(RESEND_SECONDS)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [action, onVerified])

  useEffect(() => {
    if (requestedRef.current) return
    requestedRef.current = true
    void sendCode()
  }, [sendCode])

  useEffect(() => {
    if (resendIn <= 0) return
    const interval = setInterval(() => setResendIn((s) => s - 1), 1000)
    return () => clearInterval(interval)
  }, [resendIn])

  // Close on Escape
  useEffect(() => {
    if (!onCancel) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCancel])

  const handleVerify = async () => {
    if (!/^\d{6}$/.test(code)) {
      setVerifyError('សូមបញ្ចូលលេខកូដ ៦ ខ្ទង់។')
      return
    }
    setVerifying(true)
    setVerifyError(null)
    const result = await confirmVerificationCode(action, code)
    setVerifying(false)
    if (!result.success) {
      setVerifyError(result.error)
      return
    }
    onVerified()
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel?.() }}
    >
      {/* Modal card */}
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-surface shadow-2xl shadow-black/20 animate-in zoom-in-95 duration-200">

        {/* Close button */}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="បិទ"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="p-7">
          {sending ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8">
              <Loader2 className="w-8 h-8 text-brand-700 animate-spin" />
              <p className="text-sm text-slate-500">កំពុងផ្ញើលេខកូដទៅ Telegram...</p>
            </div>
          ) : notLinked ? (
            <div className="text-center py-2">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-amber-100">
                <AlertTriangle className="w-7 h-7 text-amber-500" />
              </div>
              <p className="font-semibold text-slate-900 mb-1">Telegram មិនទាន់បានភ្ជាប់</p>
              <p className="text-sm text-slate-500 mb-5">
                ដើម្បីបន្ត សូមភ្ជាប់គណនី Telegram របស់អ្នកជាមួយ bot របស់ប្រព័ន្ធ ឬ ទាក់ទងអ្នកគ្រប់គ្រង។
              </p>
              {BOT_USERNAME && (
                <a
                  href={`https://t.me/${BOT_USERNAME}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#229ED9] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  <MessageCircle className="w-4 h-4" />
                  បើក @{BOT_USERNAME}
                </a>
              )}
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-6">
                <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-brand-100">
                  <ShieldCheck className="w-7 h-7 text-brand-700" />
                </div>
                <p className="text-lg font-bold text-slate-900">បញ្ចូលលេខកូដផ្ទៀងផ្ទាត់</p>
                <p className="text-sm text-slate-500 mt-1">
                  យើងបានផ្ញើលេខកូដ ៦ ខ្ទង់ទៅ Telegram របស់អ្នក
                </p>
              </div>

              {sendError && (
                <p className="text-sm text-red-600 text-center mb-4">{sendError}</p>
              )}

              {/* Code input */}
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, ''))
                  setVerifyError(null)
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') void handleVerify() }}
                placeholder="••••••"
                className="w-full text-center text-3xl font-bold tracking-[0.6em] py-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 mb-2 bg-background"
              />

              {verifyError && (
                <p className="text-sm text-red-600 text-center mb-2">{verifyError}</p>
              )}

              <Button
                onClick={handleVerify}
                loading={verifying}
                disabled={code.length !== 6}
                className="w-full mt-2"
                size="lg"
              >
                ផ្ទៀងផ្ទាត់
              </Button>

              <div className="text-center mt-4">
                {resendIn > 0 ? (
                  <p className="text-xs text-slate-400">ស្នើកូដថ្មីបានក្នុង {resendIn} វិនាទី</p>
                ) : (
                  <button
                    type="button"
                    onClick={() => void sendCode()}
                    className="text-xs font-medium text-brand-700 hover:text-brand-900 transition-colors"
                  >
                    ផ្ញើកូដម្តងទៀត
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
