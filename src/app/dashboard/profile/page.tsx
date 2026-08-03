import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { requireActiveMember } from '@/lib/auth/member'
import { ProfileForm } from './ProfileForm'
import { ChangePasswordForm } from './ChangePasswordForm'

export default async function ProfilePage() {
  const member = await requireActiveMember()

  return (
    <div className="p-6 md:p-8 w-full">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-foreground hover:text-foreground text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          ត្រឡប់ក្រោយទៅផ្ទាំងគ្រប់គ្រង
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">ព័ត៌មានផ្ទាល់ខ្លួន</h1>
        <p className="text-foreground text-sm mt-1">
          បំពេញ ឬ កែប្រែព័ត៌មានផ្ទាល់ខ្លួនរបស់អ្នក
        </p>
      </div>

      <div className="space-y-6">
        <ProfileForm
          member={{
            phone: member.phone ?? '',
            date_of_birth: member.date_of_birth ?? '',
            address: member.address ?? '',
            id_number: member.id_number ?? '',
            resident_book_number: member.resident_book_number ?? '',
          }}
        />
        <ChangePasswordForm />
      </div>
    </div>
  )
}
