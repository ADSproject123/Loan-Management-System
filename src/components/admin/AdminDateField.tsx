import { adminFieldClassName } from '@/components/admin/AdminListToolbar'

type AdminDateFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  min?: string
}

export function AdminDateField({ id, label, value, onChange, min }: AdminDateFieldProps) {
  return (
    <div className="min-w-38">
      <label htmlFor={id} className="mb-1 block text-xs font-semibold text-gray-500">
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        className={`${adminFieldClassName} px-3 py-2.5`}
      />
    </div>
  )
}
