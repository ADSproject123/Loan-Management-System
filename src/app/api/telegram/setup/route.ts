import { NextResponse, type NextRequest } from 'next/server'
import { configureBotMenuButton, setBotCommands } from '@/lib/telegram'

// One-time setup endpoint: configures the bot's persistent menu button and
// command list. Call it once after deployment:
//   GET /api/telegram/setup?secret=<TELEGRAM_WEBHOOK_SECRET>
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

  return NextResponse.json({ ok: menuOk && commandsOk, menuButton: menuOk, commands: commandsOk })
}
