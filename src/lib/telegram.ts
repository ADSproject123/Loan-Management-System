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

type TelegramResult = { ok: boolean; errorCode?: number; description?: string }

async function callTelegram(method: string, payload: Record<string, unknown>): Promise<TelegramResult> {
  if (!API_BASE) {
    console.warn('[Telegram] TELEGRAM_BOT_TOKEN not set — skipping', method)
    return { ok: false }
  }
  try {
    const res = await fetch(`${API_BASE}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      let errorCode: number | undefined
      let description: string | undefined
      try {
        const json = JSON.parse(body) as { error_code?: number; description?: string }
        errorCode = json.error_code
        description = json.description
      } catch { /* ignore */ }
      console.error(`[Telegram] ${method} failed (${res.status}): ${body}`)
      return { ok: false, errorCode, description }
    }
    console.log(`[Telegram] ${method} ✓`)
    return { ok: true }
  } catch (error) {
    console.error(`[Telegram] ${method} error:`, error)
    return { ok: false }
  }
}

/**
 * Send a plain HTML message. Best-effort — never throws.
 */
export async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  const result = await callTelegram('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  })
  return result.ok
}

export async function sendTelegramMessageRemoveKeyboard(chatId: string, text: string): Promise<boolean> {
  const result = await callTelegram('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    reply_markup: { remove_keyboard: true },
  })
  return result.ok
}

/**
 * Send a message with an inline "Open App" button (Telegram Mini App).
 * Falls back to a plain URL button if the web_app type is rejected (e.g. domain
 * not yet whitelisted), then falls back to a plain text message — so the user
 * always receives a reply.
 */
export async function sendTelegramMessageWithAppButton(
  chatId: string,
  text: string,
  buttonLabel = '📱 បើកកម្មវិធី'
): Promise<boolean> {
  const url = appUrl()

  // Attempt 1: web_app button (Mini App)
  const r1 = await callTelegram('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [[{ text: buttonLabel, web_app: { url } }]],
    },
  })
  if (r1.ok) return true

  console.warn(`[Telegram] web_app button rejected (${r1.errorCode}: ${r1.description}), falling back to URL button`)

  // Attempt 2: regular URL button
  const r2 = await callTelegram('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [[{ text: buttonLabel, url }]],
    },
  })
  if (r2.ok) return true

  console.warn(`[Telegram] URL button also rejected, sending plain message`)

  // Attempt 3: plain message with link appended
  const r3 = await callTelegram('sendMessage', {
    chat_id: chatId,
    text: `${text}\n\n🔗 <a href="${url}">${url}</a>`,
    parse_mode: 'HTML',
    disable_web_page_preview: false,
  })
  return r3.ok
}

/**
 * The persistent reply keyboard shown at the bottom of every chat.
 * Tapping a button sends its label text as a message, which the webhook routes
 * to the matching command handler via MENU_BUTTON_MAP.
 */
export const MENU_KEYBOARD = {
  keyboard: [
    [{ text: '💰 ការសន្សំ' },     { text: '🏦 ប្រាក់កម្ចី' }],
    [{ text: '📤 ដាក់ស្នើសន្សំ' }, { text: '💳 សងកម្ចី' }],
    [{ text: '📝 ស្នើសុំកម្ចី' }],
  ],
  resize_keyboard: true,
  is_persistent: true,
}

/**
 * Send a message and (re)show the persistent command menu at the bottom of the chat.
 * Use this for all main bot responses so the menu stays visible.
 */
export async function sendTelegramMessageWithCommandButtons(
  chatId: string,
  text: string,
): Promise<boolean> {
  const result = await callTelegram('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: MENU_KEYBOARD,
  })
  return result.ok
}

/**
 * Answer a callback query (removes the loading spinner on the button).
 * Must be called within 10 s of receiving the callback_query update.
 */
export async function answerTelegramCallbackQuery(callbackQueryId: string): Promise<boolean> {
  const result = await callTelegram('answerCallbackQuery', { callback_query_id: callbackQueryId })
  return result.ok
}

/**
 * Set the bot's persistent menu button to open the site as a Mini App.
 * Call once during bot setup via /api/telegram/setup.
 */
export async function configureBotMenuButton(): Promise<boolean> {
  const result = await callTelegram('setChatMenuButton', {
    menu_button: {
      type: 'web_app',
      text: '📱 បើកកម្មវិធី',
      web_app: { url: appUrl() },
    },
  })
  return result.ok
}

/**
 * Register the bot's slash-command list shown in the Telegram UI.
 */
export async function setBotCommands(): Promise<boolean> {
  const result = await callTelegram('setMyCommands', {
    commands: [
      { command: 'start',      description: 'ភ្ជាប់គណនី' },
      { command: 'saving',     description: 'មើលការសន្សំ' },
      { command: 'loan',       description: 'មើលរបាយការណ៍កម្ជី' },
      { command: 'paysaving',    description: 'ដាក់ស្នើការសន្សំ' },
      { command: 'payloan',      description: 'ដាក់ស្នើការសងកម្ជី' },
      { command: 'requestloan',  description: 'ស្នើសុំកម្ជី' },
    ],
  })
  return result.ok
}

/**
 * Send a photo to a chat by URL. Caption supports HTML.
 */
export async function sendTelegramPhoto(
  chatId: string,
  photoUrl: string,
  caption: string,
  forceReply = false,
): Promise<boolean> {
  const payload: Record<string, unknown> = {
    chat_id: chatId,
    photo: photoUrl,
    caption,
    parse_mode: 'HTML',
  }
  if (forceReply) {
    payload.reply_markup = { force_reply: true, selective: true }
  }
  const result = await callTelegram('sendPhoto', payload)
  return result.ok
}

/**
 * Resolve a Telegram file_id to a direct download URL.
 * Returns null if the bot token is missing or the file is not found.
 */
export async function getTelegramFileDownloadUrl(fileId: string): Promise<string | null> {
  if (!API_BASE || !BOT_TOKEN) return null
  try {
    const res = await fetch(`${API_BASE}/getFile?file_id=${encodeURIComponent(fileId)}`)
    if (!res.ok) return null
    const data = (await res.json()) as { ok: boolean; result?: { file_path?: string } }
    if (!data.ok || !data.result?.file_path) return null
    return `https://api.telegram.org/file/bot${BOT_TOKEN}/${data.result.file_path}`
  } catch {
    return null
  }
}
