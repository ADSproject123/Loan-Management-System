import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getTelegramConnectState } from '@/app/actions/member'
import { TelegramConnectPanel } from '@/components/telegram/TelegramConnectPanel'
import { TelegramConnectSteps } from '@/components/telegram/TelegramConnectBanner'
import { Card } from '@/components/ui/Card'

export default async function DashboardTelegramPage() {
  const { linked, connectToken } = await getTelegramConnectState()

  return (
    <div className="p-6 md:p-8">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        ត្រឡប់ក្រោយ
      </Link>

      <h1 className="text-2xl font-bold text-slate-900">ភ្ជាប់ Telegram</h1>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
        ប្រើតំណភ្ជាប់ផ្ទាល់ខ្លួនរបស់អ្នក បើក bot ហើយចុច Start។ ប្រព័ន្ធនឹងភ្ជាប់គណនីរបស់អ្នកដោយស្វ័យប្រវត្តិ។
      </p>

      <Card className="mt-6 max-w-lg">
        {linked ? (
          <div className="py-4 text-center">
            <p className="text-lg font-bold text-slate-900">តេលេក្រាមត្រូវបានភ្ជាប់រួចហើយ</p>
            <p className="mt-2 text-sm text-slate-600">អ្នកនឹងទទួលការជូនដំណឹងតាម Telegram នៅពេលមានអ្វីថ្មី។</p>
          </div>
        ) : (
          <div className="space-y-5">
            <TelegramConnectSteps />
            <TelegramConnectPanel
              connectToken={connectToken}
              title="តំណភ្ជាប់ផ្ទាល់ខ្លួនរបស់អ្នក"
              description="តំណនេះតែមួយគត់ភ្ជាប់គណនីរបស់អ្នក។ បើក Telegram ហើយចុច Start។"
            />
          </div>
        )}
      </Card>
    </div>
  )
}
