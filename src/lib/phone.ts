/** Normalize Cambodian phone numbers for comparison (digits only, no leading 0 or 855). */
export function normalizePhoneDigits(phone: string): string {
  let digits = phone.replace(/\D/g, '')
  if (digits.startsWith('855')) digits = digits.slice(3)
  if (digits.startsWith('0')) digits = digits.slice(1)
  return digits
}

export function phonesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizePhoneDigits(a ?? '')
  const right = normalizePhoneDigits(b ?? '')
  return Boolean(left && right && left === right)
}
