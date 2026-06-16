'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, FileText, Phone, Plus, Search, Trash2, Upload, User, X } from 'lucide-react'
import { createMemberByAdmin } from '@/app/actions/admin'
import { searchActiveMembers, type MemberSearchResult } from '@/app/actions/member'
import { showError, showSuccess } from '@/lib/toast'
import { adminFieldClassName } from '@/components/admin/AdminListToolbar'

type EmergencyContact = { full_name: string; phone: string }

const EMPTY_FORM = {
  email: '',
  password: '',
  full_name_kh: '',
  full_name_en: '',
  phone: '',
  date_of_birth: '',
  address: '',
  id_number: '',
  resident_book_number: '',
  role: 'member',
  referee_id: '',
  referee_display_name: '',
}

const inputClass = `${adminFieldClassName} px-3 py-2.5`
const labelClass = 'mb-1.5 block text-sm font-semibold text-slate-700'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">{children}</h3>
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className={labelClass}>
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  )
}

function FileUploadField({
  label,
  file,
  onChange,
  disabled,
  optional,
}: {
  label: string
  subtitle: string
  file: File | null
  onChange: (f: File | null) => void
  disabled?: boolean
  optional?: boolean
}) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold text-slate-800">
          {label}
          {optional && <span className="ml-1.5 text-xs font-normal text-slate-400">(មិនដាក់ក៏បាន)</span>}
        </p>
      </div>
      {file ? (
        <div className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50/60 px-4 py-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-brand-700 ring-1 ring-brand-100">
            <FileText className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-brand-950">{file.name}</p>
            <p className="text-xs text-brand-800/70">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-white hover:text-rose-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className={`group flex h-28 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/40 px-4 transition hover:border-brand-300 hover:bg-brand-50/40 ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-slate-400 ring-1 ring-slate-200 transition group-hover:text-brand-700 group-hover:ring-brand-200">
            <Upload className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold text-slate-600">ចុចដើម្បីផ្ទុក</span>
          <span className="text-xs text-slate-400">JPG, PNG ឬ PDF · រហូតដល់ ១០ មេកាបៃ</span>
          <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
        </label>
      )}
    </div>
  )
}

function RefereeSearch({
  selectedId,
  selectedName,
  onSelect,
  onClear,
  disabled,
}: {
  selectedId: string
  selectedName: string
  onSelect: (m: MemberSearchResult) => void
  onClear: () => void
  disabled?: boolean
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MemberSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    if (!query.trim()) { setResults([]); setShowResults(false); return }
    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const members = await searchActiveMembers(query)
        setResults(members)
        setShowResults(true)
      } finally { setIsSearching(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  if (selectedId) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-emerald-700 ring-1 ring-emerald-100">
          <Check className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-emerald-950">{selectedName}</p>
          <p className="text-xs text-emerald-700/70">សមាជិកដែលបានជ្រើស</p>
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-white hover:text-rose-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="relative max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={() => setTimeout(() => setShowResults(false), 150)}
        className={`${inputClass} pl-9`}
        placeholder="ស្វែងរកឈ្មោះសមាជិក..."
        disabled={disabled}
      />
      {isSearching && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">កំពុងស្វែងរក...</span>
      )}
      {showResults && results.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {results.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onMouseDown={() => onSelect(m)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-slate-50"
              >
                <User className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="text-sm font-medium text-slate-800">
                  {m.full_name_kh ?? m.full_name_en}
                  {m.full_name_kh && m.full_name_en && (
                    <span className="ml-1.5 text-xs text-slate-400">{m.full_name_en}</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {showResults && results.length === 0 && !isSearching && (
        <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-400 shadow-lg">
          រកមិនឃើញ
        </div>
      )}
    </div>
  )
}

export function CreateMemberForm() {
  const router = useRouter()
  const [form, setForm] = useState(EMPTY_FORM)
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([])
  const [idDocument, setIdDocument] = useState<File | null>(null)
  const [residentBook, setResidentBook] = useState<File | null>(null)
  const [pending, startTransition] = useTransition()

  function set(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function addContact() {
    setEmergencyContacts((prev) => [...prev, { full_name: '', phone: '' }])
  }

  function updateContact(i: number, field: keyof EmergencyContact, value: string) {
    setEmergencyContacts((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c))
    )
  }

  function removeContact(i: number) {
    setEmergencyContacts((prev) => prev.filter((_, idx) => idx !== i))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = new FormData()
    Object.entries(form).forEach(([k, v]) => payload.set(k, v))
    payload.set('emergency_contacts', JSON.stringify(emergencyContacts))
    if (idDocument) payload.set('id_document', idDocument)
    if (residentBook) payload.set('resident_book', residentBook)

    startTransition(async () => {
      const result = await createMemberByAdmin(payload)
      if (result.success) {
        showSuccess('បានបង្កើតសមាជិកដោយជោគជ័យ។')
        router.push('/admin/members')
        return
      }
      showError(result.error ?? 'មិនអាចបង្កើតសមាជិកបានទេ។')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">

      {/* Account */}
      <section className="space-y-4">
        <SectionTitle>គណនី</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="អ៊ីមែល" required>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              className={inputClass}
              placeholder="member@example.com"
              required
              disabled={pending}
            />
          </Field>
          <Field label="ពាក្យសម្ងាត់បណ្តោះអាសន្ន" required>
            <input
              type="text"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              className={inputClass}
              placeholder="យ៉ាងតិច ៨ តួអក្សរ"
              required
              disabled={pending}
            />
          </Field>
          <Field label="តួនាទីសមាជិក">
            <select
              value={form.role}
              onChange={(e) => set('role', e.target.value)}
              className={inputClass}
              disabled={pending}
            >
              <option value="member">Member</option>
              <option value="comember">Co-member</option>
              <option value="founder">Founder</option>
            </select>
          </Field>
        </div>
      </section>

      {/* Personal info */}
      <section className="space-y-4">
        <SectionTitle>ព័ត៌មានផ្ទាល់ខ្លួន</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="ឈ្មោះ (ខ្មែរ)" required>
            <input
              type="text"
              value={form.full_name_kh}
              onChange={(e) => set('full_name_kh', e.target.value)}
              className={inputClass}
              placeholder="ឈ្មោះជាអក្សរខ្មែរ"
              required
              disabled={pending}
            />
          </Field>
          <Field label="ឈ្មោះ (អង់គ្លេស)" required>
            <input
              type="text"
              value={form.full_name_en}
              onChange={(e) => set('full_name_en', e.target.value)}
              className={inputClass}
              placeholder="Full name in English"
              required
              disabled={pending}
            />
          </Field>
          <Field label="លេខទូរស័ព្ទ">
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              className={inputClass}
              placeholder="0812345678"
              disabled={pending}
            />
          </Field>
          <Field label="ថ្ងៃខែឆ្នាំកំណើត">
            <input
              type="date"
              value={form.date_of_birth}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => set('date_of_birth', e.target.value)}
              className={inputClass}
              disabled={pending}
            />
          </Field>
          <Field label="លេខអត្តសញ្ញាណប័ណ្ណ">
            <input
              type="text"
              inputMode="numeric"
              maxLength={9}
              value={form.id_number}
              onChange={(e) => set('id_number', e.target.value.replace(/\D/g, '').slice(0, 9))}
              className={inputClass}
              placeholder="៩ ខ្ទង់"
              disabled={pending}
            />
          </Field>
          <Field label="លេខសៀវភៅគ្រួសារ/ស្នាក់នៅ">
            <input
              type="text"
              value={form.resident_book_number}
              onChange={(e) => set('resident_book_number', e.target.value)}
              className={inputClass}
              placeholder="លេខសៀវភៅ"
              disabled={pending}
            />
          </Field>
        </div>
        <Field label="អាសយដ្ឋាន">
          <textarea
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
            rows={3}
            className={`${inputClass} resize-none`}
            placeholder="អាសយដ្ឋានបច្ចុប្បន្ន"
            disabled={pending}
          />
        </Field>
      </section>

      {/* Emergency contacts */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionTitle>ទំនាក់ទំនងបន្ទាន់</SectionTitle>
          <button
            type="button"
            onClick={addContact}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800 transition hover:bg-brand-100 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            បន្ថែមមនុស្ស
          </button>
        </div>

        {emergencyContacts.length === 0 ? (
          <button
            type="button"
            onClick={addContact}
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-6 text-sm font-medium text-slate-400 transition hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            បន្ថែមទំនាក់ទំនងបន្ទាន់
          </button>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {emergencyContacts.map((contact, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">ទំនាក់ទំនងលេខ {i + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeContact(i)}
                    disabled={pending}
                    className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={contact.full_name}
                      onChange={(e) => updateContact(i, 'full_name', e.target.value)}
                      className={`${inputClass} pl-9`}
                      placeholder="ឈ្មោះពេញ"
                      disabled={pending}
                    />
                  </div>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={contact.phone}
                      onChange={(e) => updateContact(i, 'phone', e.target.value)}
                      className={`${inputClass} pl-9`}
                      placeholder="0812345678"
                      disabled={pending}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Referee / មេគ្រុម */}
      <section className="space-y-4">
        <SectionTitle>មេគ្រុម</SectionTitle>
        <RefereeSearch
          selectedId={form.referee_id}
          selectedName={form.referee_display_name}
          onSelect={(m) => {
            set('referee_id', m.id)
            set('referee_display_name', m.full_name_kh ?? m.full_name_en ?? '')
          }}
          onClear={() => {
            set('referee_id', '')
            set('referee_display_name', '')
          }}
          disabled={pending}
        />
      </section>

      {/* Documents */}
      <section className="space-y-4">
        <SectionTitle>ឯកសារ</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FileUploadField
            label="អត្តសញ្ញាណប័ណ្ណ"
            file={idDocument}
            onChange={setIdDocument}
            disabled={pending}
          />
          <FileUploadField
            label="សៀវភៅគ្រួសារ/ស្នាក់នៅ"   
            file={residentBook}
            onChange={setResidentBook}
            disabled={pending}
            optional
          />
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
        <button
          type="button"
          onClick={() => router.push('/admin/members')}
          disabled={pending}
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          បោះបង់
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {pending ? 'កំពុងបង្កើត...' : 'បង្កើតសមាជិក'}
        </button>
      </div>
    </form>
  )
}
