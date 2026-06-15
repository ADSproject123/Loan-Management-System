'use client'

import React from 'react'

export const STATIC_KHQR_IMAGE = '/khqr-payment.png'

export function KhqrPaymentCard() {
  return (
    <div className="mx-auto w-70">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={STATIC_KHQR_IMAGE}
        alt="KHQR payment QR code"
        className="w-full rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.15)]"
      />
    </div>
  )
}
