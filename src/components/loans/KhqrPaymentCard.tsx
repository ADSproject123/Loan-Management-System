'use client'

import React, { useEffect, useState } from 'react'

const KHQR_LOGO_WHITE = '/KHQR - asset/KHQR Logo.svg'
const KHQR_RED = '#E1232E'

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(Math.ceil(ms / 1000), 0)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function KhqrPaymentCard({
  merchantName,
  amount,
  currency,
  qrImage,
  expiresAt,
  expired,
  onExpired,
}: {
  merchantName: string
  amount: number
  currency: 'USD' | 'KHR'
  qrImage: string
  expiresAt: number
  expired: boolean
  onExpired: () => void
}) {
  // The parent remounts this card (key) whenever a new QR is generated,
  // so the initial value is always in sync with expiresAt.
  const [remainingMs, setRemainingMs] = useState(() => expiresAt - Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      const left = expiresAt - Date.now()
      setRemainingMs(left)
      if (left <= 0) clearInterval(interval)
    }, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  useEffect(() => {
    if (remainingMs <= 0 && !expired) onExpired()
  }, [remainingMs, expired, onExpired])

  const amountLabel =
    currency === 'KHR'
      ? Math.round(amount).toLocaleString()
      : amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div
      className="mx-auto w-70 overflow-hidden rounded-2xl bg-white shadow-[0_10px_35px_rgba(0,0,0,0.15)]"
      style={{ clipPath: 'polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 0 100%)' }}
    >
      {/* Official KHQR red banner */}
      <div className="flex h-12 items-center justify-center" style={{ backgroundColor: KHQR_RED }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={KHQR_LOGO_WHITE} alt="KHQR" className="h-4.5 w-auto" />
      </div>

      <div className="px-6 pb-3 pt-4 text-left">
        <p className="text-[11px] leading-tight text-gray-800">{merchantName}</p>
        <p className="mt-1 text-[26px] font-bold leading-none text-gray-900">
          {amountLabel} <span className="text-sm font-medium text-gray-700">{currency}</span>
        </p>
      </div>

      <div className="border-t-2 border-dashed border-gray-200" />

      <div className="relative flex items-center justify-center px-6 py-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrImage}
          alt="KHQR payment QR code"
          className={`h-48 w-48 transition-all ${expired ? 'opacity-20 blur-[3px]' : ''}`}
        />
        {!expired && (
          <span className="absolute flex h-9 w-9 items-center justify-center rounded-lg bg-white text-lg font-bold text-gray-900 shadow-sm ring-1 ring-gray-200">
            {currency === 'KHR' ? '៛' : '$'}
          </span>
        )}
        {expired && (
          <span className="absolute rounded-full bg-gray-900/80 px-4 py-1.5 text-xs font-semibold text-white">
            QR បានផុតកំណត់
          </span>
        )}
      </div>

      {!expired && (
        <div className="pb-4 text-center">
          <p className="text-xs text-gray-500">
            QR ផុតកំណត់ក្នុង{' '}
            <span className="font-semibold tabular-nums text-gray-900">
              {formatCountdown(remainingMs)}
            </span>
          </p>
        </div>
      )}
    </div>
  )
}
