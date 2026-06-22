import Link from 'next/link'
import { UserPlus } from 'lucide-react'

export function CreateMemberButton() {
  return (
    <Link
      href="/admin/members/new"
      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
    >
      <UserPlus className="h-4 w-4" />
      បន្ថែម
    </Link>
  )
}
