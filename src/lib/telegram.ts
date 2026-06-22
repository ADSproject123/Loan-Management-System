/**
 * Thin wrapper over the Telegram Bot API.
 *
 * A bot can only message a user who has messaged it first, so the user's
 * `chat_id` is captured by the webhook (see app/api/telegram/webhook) when they
 * press "Start". We store that id on the member and send notifications to it here.
 *
 * Required env: TELEGRAM_BOT_TOKEN (from @BotFather).
 * Optional env: NEXT_PUBLIC_APP_URL — the public URL of this site, used for the
 *   Mini App button. Falls back to VERCEL_URL then localhost.
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const API_BASE = BOT_TOKEN ? `https://api.telegram.org/bot${BOT_TOKEN}` : null

function appUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

/** True when a bot token is configured — callers can skip Telegram work otherwise. */
export function telegramEnabled(): boolean {
  return Boolean(API_BASE)
}

async function callTelegram(method: string, payload: Record<string, unknown>): Promise<boolean> {
  if (!API_BASE) return false
  try {
    const res = await fetch(`${API_BASE}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`Telegram ${method} failed (${res.status}): ${body}`)
      return false
    }
    return true
  } catch (error) {
    console.error(`Telegram ${method} error:`, error)
    return false
  }
}

/**
 * Send a message to a chat. Best-effort: never throws, returns false on failure
 * so a Telegram outage can't break the surrounding action (member approval, etc).
 * `text` supports a subset of HTML (<b>, <i>, <a>, ...) via parse_mode.
 */
export function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  return callTelegram('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  })
}

/**
 * Send a message with an inline "Open App" button that launches the site as a
 * Telegram Mini App. Best-effort — never throws.
 */
export function sendTelegramMessageWithAppButton(
  chatId: string,
  text: string,
  buttonLabel = '📱 បើកកម្មវិធី / Open App'
): Promise<boolean> {
  return callTelegram('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [[{ text: buttonLabel, web_app: { url: appUrl() } }]],
    },
  })
}

/**
 * Set the bot's persistent menu button to open the site as a Mini App.
 * Call this once during bot setup (see /api/telegram/setup).
 * Omitting chat_id sets the default for every chat.
 */
export function configureBotMenuButton(): Promise<boolean> {
  return callTelegram('setChatMenuButton', {
    menu_button: {
      type: 'web_app',
      text: '📱 Open App',
      web_app: { url: appUrl() },
    },
  })
}

/**
 * Register the bot's slash-command list shown in the Telegram UI.
 */
export function setBotCommands(): Promise<boolean> {
  return callTelegram('setMyCommands', {
    commands: [
      { command: 'start',  description: 'ភ្ជាប់គណនី / Link your account' },
      { command: 'saving', description: 'មើលការសន្សំ' },
    ],
  })
}
