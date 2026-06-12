import { BakongKHQR, IndividualInfo, khqrData } from 'bakong-khqr'

const BAKONG_API_BASE = 'https://api-bakong.nbc.gov.kh'

export type KhqrIntent = {
  qr: string
  md5: string
  expiresAt: number
  merchantName: string
  currency: 'USD' | 'KHR'
}

export type BakongTransaction = {
  hash: string
  fromAccountId: string
  toAccountId: string
  currency: string
  amount: number
  createdDateMs: number
  acknowledgedDateMs: number
}

function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

function merchantName() {
  // Fall back to the username part of the merchant ID, e.g. heng_bunkheang@bkrt -> HENG BUNKHEANG
  return (
    process.env.BAKONG_MERCHANT_NAME ??
    requiredEnv('BAKONG_MERCHANT_ID').split('@')[0].replace(/[._-]+/g, ' ').toUpperCase()
  )
}

export function qrExpiryMinutes() {
  const minutes = Number(process.env.BAKONG_QR_EXPIRY_MINUTES ?? '10')
  return Number.isFinite(minutes) && minutes > 0 ? minutes : 10
}

/**
 * Generate a dynamic (amount-locked, expiring) KHQR string for the configured
 * Bakong account. The md5 is the handle used to poll payment status.
 */
export function createKhqrIntent(amount: number, billNumber: string): KhqrIntent {
  const currency = process.env.BAKONG_CURRENCY === 'KHR' ? 'KHR' : 'USD'
  // KHQR rejects > 2 decimal places for USD; KHR must be a whole number.
  const safeAmount =
    currency === 'KHR' ? Math.round(amount) : Math.round(amount * 100) / 100
  const expiresAt = Date.now() + qrExpiryMinutes() * 60_000
  const name = merchantName()

  const info = new IndividualInfo(
    requiredEnv('BAKONG_MERCHANT_ID'),
    name,
    process.env.BAKONG_MERCHANT_CITY ?? 'Phnom Penh',
    {
      currency: currency === 'KHR' ? khqrData.currency.khr : khqrData.currency.usd,
      amount: safeAmount,
      billNumber,
      expirationTimestamp: expiresAt,
    }
  )

  const response = new BakongKHQR().generateIndividual(info)
  if (response.status.code !== 0 || !response.data) {
    throw new Error(`KHQR generation failed: ${response.status.message ?? 'unknown error'}`)
  }

  return { qr: response.data.qr, md5: response.data.md5, expiresAt, merchantName: name, currency }
}

// BAKONG_TOKEN expires yearly; when the API returns 401 we renew via BAKONG_EMAIL
// and keep the fresh token here for the lifetime of the server process.
let renewedToken: string | null = null

async function renewToken() {
  const email = requiredEnv('BAKONG_EMAIL')
  const res = await fetch(`${BAKONG_API_BASE}/v1/renew_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
    cache: 'no-store',
  })
  const json = await res.json().catch(() => null)
  const token: string | undefined = json?.data?.token
  if (!res.ok || json?.responseCode !== 0 || !token) {
    throw new Error(
      `Bakong token renewal failed: ${json?.responseMessage ?? `HTTP ${res.status}`}`
    )
  }
  renewedToken = token
  console.warn(
    '[bakong] BAKONG_TOKEN was expired and has been renewed in-memory. Update BAKONG_TOKEN in .env to avoid renewing on every server restart.'
  )
}

async function bakongPost(path: string, body: unknown, retried = false): Promise<{
  responseCode: number
  responseMessage?: string
  errorCode?: number | null
  data?: Record<string, unknown> | null
}> {
  const token = renewedToken ?? requiredEnv('BAKONG_TOKEN')
  const res = await fetch(`${BAKONG_API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  if (res.status === 401 && !retried) {
    await renewToken()
    return bakongPost(path, body, true)
  }

  if (!res.ok && res.status !== 404) {
    throw new Error(`Bakong API ${path} failed: HTTP ${res.status}`)
  }

  return res.json()
}

/**
 * Check whether the KHQR identified by md5 has been paid.
 * Returns the settled transaction when found, or null while still unpaid.
 */
export async function checkPaymentByMd5(md5: string): Promise<BakongTransaction | null> {
  const json = await bakongPost('/v1/check_transaction_by_md5', { md5 })
  if (json.responseCode === 0 && json.data) {
    return json.data as unknown as BakongTransaction
  }
  return null
}
