import type { ActionResult } from '@/app/actions/member'

export function AdminActionButton({
  action,
  id,
  children,
  decision,
  danger = false,
  secondary = false,
}: {
  action: (formData: FormData) => Promise<ActionResult>
  id: string
  children: React.ReactNode
  decision?: string
  danger?: boolean
  secondary?: boolean
}) {
  async function submit(formData: FormData) {
    'use server'
    await action(formData)
  }

  const classes = danger
    ? 'bg-red-600 text-white hover:bg-red-700'
    : secondary
      ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
      : 'bg-blue-900 text-white hover:bg-blue-800'

  return (
    <form action={submit}>
      <input type="hidden" name="id" value={id} />
      {decision && <input type="hidden" name="decision" value={decision} />}
      <button type="submit" className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${classes}`}>
        {children}
      </button>
    </form>
  )
}
