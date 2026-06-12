'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { requestVerificationCode, confirmVerificationCode } from '@/app/actions/verification'
import { Loader2, MessageCircle, ShieldCheck, AlertTriangle } from 'lucide-react'

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME

const RESEND_SECONDS = 60

/**
 * Telegram OTP gate: sends a 6-digit code to the member's linked Telegram
 * chat on mount, then calls onVerified once the member confirms it.
 * If the member verified the same action recently, the server short-circuits
 * and onVerified fires immediately.
 */
export function TelegramVerification({
  action,
  onVerified,
}: {
  action: 'loan_repay' | 'saving_add' | 'capital_request' | 'loan_request'
  onVerified: () => void
}) {
  const [sending, setSending] = useState(true)
  const [sendError, setSendError] = useState<string | null>(null)
  const [notLinked, setNotLinked] = useState(false)
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [resendIn, setResendIn] = useState(0)
  const requestedRef = useRef(false)

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
  }, [action, onVerified])

  useEffect(() => {
    // Strict mode mounts effects twice in dev; only request one code.
    if (requestedRef.current) return
    requestedRef.current = true
    void sendCode()
  }, [sendCode])

  useEffect(() => {
    if (resendIn <= 0) return
    const interval = setInterval(() => setResendIn((s) => s - 1), 1000)
    return () => clearInterval(interval)
  }, [resendIn])

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

  if (sending) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <Loader2 className="w-8 h-8 text-brand-700 animate-spin" />
        <p className="text-sm text-gray-500">កំពុងផ្ញើលេខកូដទៅ Telegram...</p>
      </div>
    )
  }

  if (notLinked) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-center">
        <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
        <p className="text-sm font-semibold text-yellow-900 mb-1">Telegram មិនទាន់បានភ្ជាប់</p>
        <p className="text-xs text-yellow-700 mb-4">
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
    )
  }

  return (
    <div>
      <div className="text-center mb-5">
        <div className="w-14 h-14 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-7 h-7 text-brand-700" />
        </div>
        <p className="font-semibold text-gray-900">បញ្ចូលលេខកូដផ្ទៀងផ្ទាត់</p>
        <p className="text-gray-500 text-sm mt-1">
          យើងបានផ្ញើលេខកូដ ៦ ខ្ទង់ទៅ Telegram របស់អ្នក
        </p>
      </div>

      {sendError && <p className="text-sm text-red-600 text-center mb-4">{sendError}</p>}

      <input
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChange={(e) => {
          setCode(e.target.value.replace(/\D/g, ''))
          setVerifyError(null)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void handleVerify()
        }}
        placeholder="••••••"
        className="w-full text-center text-2xl font-bold tracking-[0.5em] py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-900 mb-2"
      />

      {verifyError && <p className="text-sm text-red-600 text-center mb-2">{verifyError}</p>}

      <Button
        onClick={handleVerify}
        loading={verifying}
        disabled={code.length !== 6}
        className="w-full mt-3"
        size="lg"
      >
        ផ្ទៀងផ្ទាត់
      </Button>

      <div className="text-center mt-4">
        {resendIn > 0 ? (
          <p className="text-xs text-gray-400">ស្នើកូដថ្មីបានក្នុង {resendIn} វិនាទី</p>
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
    </div>
  )
}
