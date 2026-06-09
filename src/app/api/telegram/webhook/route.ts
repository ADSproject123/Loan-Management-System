import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTelegramMessage } from '@/lib/telegram'

// Telegram calls this on every message to the bot. Always run at request time.
export const dynamic = 'force-dynamic'

/**
 * Shape of the bits of a Telegram Update we care about. A member presses the
 * bot's deep link (t.me/<bot>?start=<token>) and taps Start, which delivers a
 * message of "/start <token>". We map that token to the member and store the
 * chat id so future notifications can reach them.
 */
interface TelegramUpdate {
  message?: {
    text?: string
    chat?: { id: number }
    from?: { first_name?: string }
  }
}

const WELCOME_NO_TOKEN =
  '👋 សួស្តី! សូមភ្ជាប់គណនីរបស់អ្នកដោយចុចតំណ "ភ្ជាប់តេលេក្រាម" នៅក្នុងទំព័រចុះឈ្មោះ។\n\n' +
  'Please open the "Connect Telegram" link from the registration page to link your account.'

export async function POST(request: NextRequest) {
  // Verify the request is really from Telegram. We set this secret when
  // registering the webhook (setWebhook?secret_token=...); Telegram echoes it
  // back in this header on every call.
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (expectedSecret) {
    const got = request.headers.get('x-telegram-bot-api-secret-token')
    if (got !== expectedSecret) {
      return NextResponse.json({ ok: false }, { status: 401 })
    }
  }

  let update: TelegramUpdate
  try {
    update = (await request.json()) as TelegramUpdate
  } catch {
    return NextResponse.json({ ok: true })
  }

  const message = update.message
  const chatId = message?.chat?.id
  const text = message?.text?.trim() ?? ''

  // Telegram requires a 2xx for every update or it will keep retrying, so we
  // always answer 200 even when we ignore the message.
  if (!chatId) return NextResponse.json({ ok: true })

  // Only the linking command matters. Format: "/start <token>".
  if (!text.startsWith('/start')) {
    await sendTelegramMessage(String(chatId), WELCOME_NO_TOKEN)
    return NextResponse.json({ ok: true })
  }

  const token = text.slice('/start'.length).trim()
  if (!token) {
    await sendTelegramMessage(String(chatId), WELCOME_NO_TOKEN)
    return NextResponse.json({ ok: true })
  }

  const admin = createAdminClient()
  const { data: member } = await admin
    .from('members')
    .select('id, full_name_kh, full_name_en')
    .eq('telegram_connect_token', token)
    .maybeSingle()

  if (!member) {
    await sendTelegramMessage(
      String(chatId),
      '⚠️ តំណភ្ជាប់នេះមិនត្រឹមត្រូវ ឬផុតកំណត់។ សូមព្យាយាមម្តងទៀតពីទំព័រចុះឈ្មោះ។\n\n' +
        'This connection link is invalid or expired. Please try again from the registration page.'
    )
    return NextResponse.json({ ok: true })
  }

  // Link (or re-link) this chat to the member. We keep the token so the
  // registration page can still confirm the link by polling; re-pressing Start
  // simply rewrites the same chat id.
  const { error } = await admin
    .from('members')
    .update({ telegram_chat_id: String(chatId) })
    .eq('id', member.id)

  if (error) {
    await sendTelegramMessage(
      String(chatId),
      '❌ មានបញ្ហាក្នុងការភ្ជាប់។ សូមព្យាយាមម្តងទៀតពេលក្រោយ។\n\nSomething went wrong linking your account. Please try again later.'
    )
    return NextResponse.json({ ok: true })
  }

  await sendTelegramMessage(
    String(chatId),
    '✅ <b>បានភ្ជាប់ដោយជោគជ័យ!</b>\nអ្នកនឹងទទួលបានការជូនដំណឹងពីសមាគមន៏សន្សំនៅទីនេះ។\n\n' +
      '<b>Connected!</b> You will now receive notifications here.'
  )

  return NextResponse.json({ ok: true })
}
