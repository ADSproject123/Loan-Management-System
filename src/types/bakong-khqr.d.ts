declare module 'bakong-khqr' {
  export type KhqrOptionalData = {
    currency?: number
    amount?: number
    billNumber?: string
    storeLabel?: string
    terminalLabel?: string
    mobileNumber?: string
    purposeOfTransaction?: string
    acquiringBank?: string
    accountInformation?: string
    expirationTimestamp?: number
    merchantCategoryCode?: string
  }

  export class IndividualInfo {
    constructor(
      bakongAccountID: string,
      merchantName: string,
      merchantCity: string,
      optional?: KhqrOptionalData
    )
  }

  export class MerchantInfo {
    constructor(
      bakongAccountID: string,
      merchantName: string,
      merchantCity: string,
      merchantID: string,
      acquiringBank: string,
      optional?: KhqrOptionalData
    )
  }

  export type KhqrResponse = {
    status: { code: number; errorCode: number | null; message: string | null }
    data: { qr: string; md5: string } | null
  }

  export class BakongKHQR {
    generateIndividual(info: IndividualInfo): KhqrResponse
    generateMerchant(info: MerchantInfo): KhqrResponse
  }

  export const khqrData: {
    currency: { usd: number; khr: number }
    merchantType: { merchant: string; individual: string }
  }
}
