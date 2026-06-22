import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTelegramMessage, sendTelegramMessageWithAppButton } from '@/lib/telegram'
import type { SavingStatus } from '@/types/database'

// Telegram calls this on every message to the bot. Always run at request time.
export const dynamic = 'force-dynamic'

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

const NOT_LINKED =
  '🔗 គណនី Telegram របស់អ្នកមិនទាន់ភ្ជាប់ទេ។ សូមចូល "ភ្ជាប់តេលេក្រាម" ពីទំព័រចុះឈ្មោះ។\n\n' +
  'Your Telegram account is not linked yet. Please use the "Connect Telegram" link from the registration page.'

const STATUS_EMOJI: Record<SavingStatus, string> = {
  pending:   '⏳',
  verified:  '✅',
  completed: '🏁',
  refunded:  '↩️',
}

const STATUS_LABEL: Record<SavingStatus, string> = {
  pending:   'Pending',
  verified:  'Verified',
  completed: 'Completed',
  refunded:  'Refunded',
}

function fmtMoney(amount: number | null) {
  if (amount === null) return '$0'
  return `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function fmtDate(iso: string) {
  // saving_date is stored as YYYY-MM-DD
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

async function handleSavingCommand(chatId: string): Promise<void> {
  const admin = createAdminClient()

  // Find the member by their linked chat id
  const { data: member } = await admin
    .from('members')
    .select('id, full_name_kh, full_name_en')
    .eq('telegram_chat_id', chatId)
    .maybeSingle()

  if (!member) {
    await sendTelegramMessageWithAppButton(chatId, NOT_LINKED)
    return
  }

  const { data: savings } = await admin
    .from('savings')
    .select('amount, saving_date, status, currency')
    .eq('member_id', member.id)
    .neq('status', 'refunded')
    .order('saving_date', { ascending: false })
    .limit(50)

  const rows = savings ?? []

  if (rows.length === 0) {
    await sendTelegramMessageWithAppButton(
      chatId,
      '💰 <b>ការសន្សំ / Savings</b>\n\nអ្នកមិនទាន់មានការសន្សំណាមួយទេ។\nYou have no savings records yet.'
    )
    return
  }

  // Totals by status
  let totalVerified = 0
  let totalPending = 0
  for (const r of rows) {
    const amt = Number(r.amount ?? 0)
    if (r.status === 'verified' || r.status === 'completed') totalVerified += amt
    else if (r.status === 'pending') totalPending += amt
  }
  const grandTotal = totalVerified + totalPending

  const name = member.full_name_kh ?? member.full_name_en ?? ''

  // Last 8 entries for the detail list
  const recent = rows.slice(0, 8)
  const recentLines = recent
    .map(r => {
      const st = r.status as SavingStatus
      return `  ${STATUS_EMOJI[st]} ${fmtDate(r.saving_date)}  ${fmtMoney(r.amount)}  <i>${STATUS_LABEL[st]}</i>`
    })
    .join('\n')

  const moreNote = rows.length > 8 ? `\n<i>… and ${rows.length - 8} more. Open the app to see all.</i>` : ''

  const msg =
    `💰 <b>ការសន្សំ</b>\n` +
    `👤 ${name}\n\n` +
    `<b>សរុប:</b> ${fmtMoney(grandTotal)}\n` +
    `✅ <b>បានត្រួតពិនិត្យ:</b> ${fmtMoney(totalVerified)}\n` +
    `⏳ <b>កំពុងរង់ចាំការត្រួតពិនិត្យ:</b> ${fmtMoney(totalPending)}\n\n` +
    `<b>ប្រវត្តិចុងក្រោយ:</b>\n` +
    recentLines +
    moreNote

  await sendTelegramMessageWithAppButton(chatId, msg)
}

export async function POST(request: NextRequest) {
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

  // Telegram requires a 2xx for every update or it will keep retrying.
  if (!chatId) return NextResponse.json({ ok: true })

  // /saving — show the member's savings summary
  if (text === '/saving' || text.startsWith('/saving@')) {
    await handleSavingCommand(String(chatId))
    return NextResponse.json({ ok: true })
  }

  // /start <token> — account linking flow
  if (text.startsWith('/start')) {
    const token = text.slice('/start'.length).trim()

    if (!token) {
      await sendTelegramMessageWithAppButton(String(chatId), WELCOME_NO_TOKEN)
      return NextResponse.json({ ok: true })
    }

    const admin = createAdminClient()
    const { data: member } = await admin
      .from('members')
      .select('id, full_name_kh, full_name_en, telegram_chat_id')
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

    if (member.telegram_chat_id !== String(chatId)) {
      const { data: existing } = await admin
        .from('members')
        .select('id')
        .eq('telegram_chat_id', String(chatId))
        .neq('id', member.id)
        .maybeSingle()

      if (existing) {
        await sendTelegramMessage(
          String(chatId),
          '⛔ គណនី Telegram នេះត្រូវបានភ្ជាប់ជាមួយសមាជិកដទៃរួចហើយ។\n\n' +
            'This Telegram account is already linked to another member. Please contact the admin.'
        )
        return NextResponse.json({ ok: true })
      }
    }

    const { error } = await admin
      .from('members')
      .update({ telegram_chat_id: String(chatId) })
      .eq('id', member.id)

    if (error) {
      const isDuplicate =
        error.code === '23505' || error.message?.includes('members_telegram_chat_id_unique')
      await sendTelegramMessage(
        String(chatId),
        isDuplicate
          ? '⛔ គណនី Telegram នេះត្រូវបានភ្ជាប់ជាមួយសមាជិកដទៃរួចហើយ។\n\nThis Telegram account is already linked to another member. Please contact the admin.'
          : '❌ មានបញ្ហាក្នុងការភ្ជាប់។ សូមព្យាយាមម្តងទៀតពេលក្រោយ។\n\nSomething went wrong linking your account. Please try again later.'
      )
      return NextResponse.json({ ok: true })
    }

    await sendTelegramMessageWithAppButton(
      String(chatId),
      '✅ <b>បានភ្ជាប់ដោយជោគជ័យ!</b>\nអ្នកនឹងទទួលបានការជូនដំណឹងពីសមាគមន៏សន្សំនៅទីនេះ។\n\n' +
        '<b>Connected!</b> You will now receive notifications here.'
    )

    return NextResponse.json({ ok: true })
  }

  // Any other message → welcome prompt
  await sendTelegramMessageWithAppButton(String(chatId), WELCOME_NO_TOKEN)
  return NextResponse.json({ ok: true })
}
