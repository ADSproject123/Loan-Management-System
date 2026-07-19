import { NextResponse, type NextRequest } from 'next/server'
import { configureBotMenuButton, setBotCommands, getWebhookInfo, setWebhook } from '@/lib/telegram'

// One-time setup endpoint: configures the bot's persistent menu button and
// command list, and reports the current webhook registration. Call it after
// deployment, or any time to check why inline buttons might not be working:
//   GET /api/telegram/setup?secret=<TELEGRAM_WEBHOOK_SECRET>
//
// The response's `webhookInfo.allowed_updates` MUST include "callback_query"
// or Telegram will render inline buttons fine but never deliver button taps
// to this server at all (they'll just spin forever client-side). If it's
// missing or the url is wrong, re-register with:
//   GET /api/telegram/setup?secret=<TELEGRAM_WEBHOOK_SECRET>&fixWebhookUrl=<exact webhook URL, e.g. https://your-domain/api/telegram/webhook>
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (!expectedSecret) {
    return NextResponse.json({ ok: false, error: 'TELEGRAM_WEBHOOK_SECRET not configured' }, { status: 500 })
  }

  const secret = request.nextUrl.searchParams.get('secret')
  if (secret !== expectedSecret) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const [menuOk, commandsOk] = await Promise.all([
    configureBotMenuButton(),
    setBotCommands(),
  ])

  const fixWebhookUrl = request.nextUrl.searchParams.get('fixWebhookUrl')
  let webhookFixed: boolean | null = null
  if (fixWebhookUrl) {
    webhookFixed = await setWebhook(fixWebhookUrl, expectedSecret)
  }

  const webhookInfo = await getWebhookInfo()

  return NextResponse.json({
    ok: menuOk && commandsOk,
    menuButton: menuOk,
    commands: commandsOk,
    webhookInfo,
    webhookFixed,
  })
}
