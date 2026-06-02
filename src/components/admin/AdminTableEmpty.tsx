import type { LucideIcon } from 'lucide-react'

type AdminTableEmptyProps = {
  icon: LucideIcon
  title: string
  description: string
  colSpan: number
}

export function AdminTableEmpty({ icon: Icon, title, description, colSpan }: AdminTableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-16 text-center md:px-8">
        <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
          <span className="grid h-12 w-12 place-items-center bg-gray-100 text-gray-400">
            <Icon className="h-6 w-6" />
          </span>
          <p className="font-semibold text-gray-900">{title}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </td>
    </tr>
  )
}

export function AdminTableNoResults({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-16 text-center md:px-8">
        <p className="font-semibold text-gray-900">រកមិនឃើញលទ្ធផល</p>
        <p className="mt-1 text-sm text-gray-500">ព្យាយាមកែពាក្យស្វែងរក ឬតម្រងវិញ។</p>
      </td>
    </tr>
  )
}
