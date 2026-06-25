export function buildTelegramDeepLink(connectToken: string | null | undefined): string | null {
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
  if (!botUsername || !connectToken) return null
  return `https://t.me/${botUsername}?start=${connectToken}`
}
