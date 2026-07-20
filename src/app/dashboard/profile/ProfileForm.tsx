'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { CambodiaAddressSelect, formatCambodiaAddress, parseCambodiaAddress } from '@/components/ui/CambodiaAddressSelect'
import { updateMemberProfile } from '@/app/actions/member'
import { showError, showSuccess } from '@/lib/toast'
import { Phone, Calendar, CreditCard, FileText } from 'lucide-react'

interface ProfileFormValues {
  phone: string
  date_of_birth: string
  address: string
  id_number: string
  resident_book_number: string
}

const inputBase = 'app-input shadow-xs'

function Field({
  label,
  htmlFor,
  optional,
  children,
}: {
  label: string
  htmlFor: string
  optional?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-foreground">
        {label}
        {optional && <span className="ml-1.5 text-xs font-normal text-foreground">(ស្រេចចិត្ត)</span>}
      </label>
      {children}
    </div>
  )
}

function IconInput({
  icon,
  className = '',
  value,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground">{icon}</span>
      <input {...rest} value={value ?? ''} className={`${inputBase} app-input--with-icon ${className}`} />
    </div>
  )
}

export function ProfileForm({ member }: { member: ProfileFormValues }) {
  const [formData, setFormData] = useState<ProfileFormValues>(member)
  const [loading, setLoading] = useState(false)

  const updateField = <K extends keyof ProfileFormValues>(field: K, value: ProfileFormValues[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!formData.phone || !formData.date_of_birth || !formData.id_number) {
      showError('សូមបំពេញគ្រប់វាលទាំងអស់ដែលត្រូវការ។')
      return
    }

    setLoading(true)
    const payload = new FormData()
    payload.append('phone', formData.phone)
    payload.append('date_of_birth', formData.date_of_birth)
    payload.append('address', formData.address)
    payload.append('id_number', formData.id_number)
    payload.append('resident_book_number', formData.resident_book_number)

    const result = await updateMemberProfile(payload)
    setLoading(false)

    if (!result.success) {
      showError(result.error ?? 'មិនអាចរក្សាទុកព័ត៌មានផ្ទាល់ខ្លួនបានទេ។')
      return
    }

    showSuccess('ព័ត៌មានផ្ទាល់ខ្លួនត្រូវបានរក្សាទុក។')
  }

  return (
    <Card>
      <div className="space-y-5">
        <Field label="លេខទូរស័ព្ទ" htmlFor="phone">
          <IconInput
            id="phone"
            icon={<Phone className="h-4.5 w-4.5" />}
            type="tel"
            autoComplete="tel"
            value={formData.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            placeholder="0812345678"
          />
        </Field>

        <Field label="ថ្ងៃខែឆ្នាំកំណើត" htmlFor="date_of_birth">
          <IconInput
            id="date_of_birth"
            icon={<Calendar className="h-4.5 w-4.5" />}
            type="date"
            autoComplete="bday"
            value={formData.date_of_birth}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => updateField('date_of_birth', e.target.value)}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="លេខអត្តសញ្ញាណប័ណ្ណ" htmlFor="id_number">
            <IconInput
              id="id_number"
              icon={<CreditCard className="h-4.5 w-4.5" />}
              type="text"
              inputMode="numeric"
              maxLength={9}
              value={formData.id_number}
              onChange={(e) => updateField('id_number', e.target.value.replace(/\D/g, '').slice(0, 9))}
              placeholder="លេខអត្តសញ្ញាណប័ណ្ណ ៩ ខ្ទង់"
            />
          </Field>
          <Field label="លេខសៀវភៅគ្រួសារ/លេខសៀវភៅស្នាក់នៅ" htmlFor="resident_book_number" optional>
            <IconInput
              id="resident_book_number"
              icon={<FileText className="h-4.5 w-4.5" />}
              type="text"
              value={formData.resident_book_number}
              onChange={(e) => updateField('resident_book_number', e.target.value)}
              placeholder="លេខសៀវភៅ"
            />
          </Field>
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-foreground">
            អាសយដ្ឋាន <span className="text-xs font-normal text-foreground">(ស្រេចចិត្ត)</span>
          </p>
          <CambodiaAddressSelect
            value={parseCambodiaAddress(formData.address)}
            onChange={(addr) => updateField('address', formatCambodiaAddress(addr))}
            selectClassName={inputBase}
            inputClassName={inputBase}
          />
        </div>

        <Button onClick={handleSubmit} loading={loading} className="w-full" size="lg">
          រក្សាទុកព័ត៌មាន
        </Button>
      </div>
    </Card>
  )
}
