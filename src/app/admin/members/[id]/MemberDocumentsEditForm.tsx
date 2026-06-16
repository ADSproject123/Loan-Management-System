'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Upload, X } from 'lucide-react'
import { updateMemberDocuments } from '@/app/actions/admin'
import { showError, showSuccess } from '@/lib/toast'
import { useRegisterMemberEditForm } from './MemberEditModeContext'

type MemberDocumentsEditFormProps = {
  memberId: string
  onSaved?: () => void
}

function FileField({
  label,
  file,
  onChange,
  disabled,
}: {
  label: string
  file: File | null
  onChange: (file: File | null) => void
  disabled?: boolean
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted">{label}</p>
      {file ? (
        <div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface text-brand-700 ring-1 ring-brand-100">
            <FileText className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{file.name}</p>
            <p className="text-xs text-muted">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label
          className={`group flex h-28 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border bg-surface-muted/40 px-4 transition hover:border-brand-300 hover:bg-brand-50/40 ${disabled ? 'pointer-events-none opacity-50' : ''}`}
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-surface text-muted ring-1 ring-border transition group-hover:text-brand-700 group-hover:ring-brand-200">
            <Upload className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold text-foreground">ចុចដើម្បីផ្ទុក</span>
          <span className="text-xs text-muted">JPG, PNG ឬ PDF</span>
          <input
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            disabled={disabled}
            onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          />
        </label>
      )}
    </div>
  )
}

export function MemberDocumentsEditForm({ memberId, onSaved }: MemberDocumentsEditFormProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const formRef = useRegisterMemberEditForm(pending)
  const [idDocument, setIdDocument] = useState<File | null>(null)
  const [residentBook, setResidentBook] = useState<File | null>(null)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!idDocument && !residentBook) {
      showError('សូមជ្រើសរើសឯកសារដើម្បីផ្ទុក។')
      return
    }

    const payload = new FormData()
    payload.set('id', memberId)
    if (idDocument) payload.set('id_document', idDocument)
    if (residentBook) payload.set('resident_book', residentBook)

    startTransition(async () => {
      const result = await updateMemberDocuments(payload)
      if (!result.success) {
        showError(result.error ?? 'មិនអាចផ្ទុកឯកសារបានទេ។')
        return
      }
      showSuccess('បានផ្ទុកឯកសារថ្មី។')
      setIdDocument(null)
      setResidentBook(null)
      onSaved?.()
      router.refresh()
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="mb-6 space-y-4 rounded-xl border border-border bg-surface-muted/30 p-5">
      <div>
        <h4 className="text-sm font-semibold text-foreground">ផ្ទុកឯកសារថ្មី</h4>
        <p className="mt-1 text-sm text-muted">
          ជ្រើសរើសឯកសារដែលត្រូវបានធ្វើបច្ចុប្បន្នភាព។ ឯកសារចាស់នឹងត្រូវបានជំនួស។
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <FileField
          label="អត្តសញ្ញាណប័ណ្ណ"
          file={idDocument}
          onChange={setIdDocument}
          disabled={pending}
        />
        <FileField
          label="សៀវភៅគ្រួសារ"
          file={residentBook}
          onChange={setResidentBook}
          disabled={pending}
        />
      </div>
    </form>
  )
}
