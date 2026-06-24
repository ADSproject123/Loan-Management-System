'use client'

import { useState, useEffect } from 'react'
import { CAMBODIA_PROVINCES } from '@/lib/cambodia-address'

export type CambodiaAddress = {
  province: string
  district: string
  commune: string
  village: string
}

const EMPTY: CambodiaAddress = { province: '', district: '', commune: '', village: '' }

interface Props {
  value?: CambodiaAddress
  onChange: (address: CambodiaAddress) => void
  disabled?: boolean
  selectClassName?: string
  inputClassName?: string
}

export function CambodiaAddressSelect({ value, onChange, disabled, selectClassName = '', inputClassName = '' }: Props) {
  const [addr, setAddr] = useState<CambodiaAddress>(value ?? EMPTY)

  useEffect(() => {
    if (value) setAddr(value)
  }, [value])

  const province = CAMBODIA_PROVINCES.find((p) => p.name === addr.province)
  const district = province?.districts.find((d) => d.name === addr.district)
  const commune = district?.communes.find((c) => c.name === addr.commune)
  const hasCommunes = (district?.communes.length ?? 0) > 0
  const hasVillages = (commune?.villages?.length ?? 0) > 0

  function update(patch: Partial<CambodiaAddress>) {
    const next = { ...addr, ...patch }
    setAddr(next)
    onChange(next)
  }

  function setProvince(name: string) {
    update({ province: name, district: '', commune: '', village: '' })
  }

  function setDistrict(name: string) {
    update({ district: name, commune: '', village: '' })
  }

  function setCommune(name: string) {
    update({ commune: name, village: '' })
  }

  const sel = `${selectClassName} w-full`
  const inp = `${inputClassName} w-full`

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {/* Province */}
      <div>
        <label className="mb-1 block text-xs font-semibold text-muted">ខេត្ត / រាជធានី</label>
        <select value={addr.province} onChange={(e) => setProvince(e.target.value)} disabled={disabled} className={sel}>
          <option value="">-- ជ្រើសរើស --</option>
          {CAMBODIA_PROVINCES.map((p) => (
            <option key={p.name} value={p.name}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* District */}
      <div>
        <label className="mb-1 block text-xs font-semibold text-muted">ស្រុក / ខណ្ឌ</label>
        <select value={addr.district} onChange={(e) => setDistrict(e.target.value)} disabled={disabled || !addr.province} className={sel}>
          <option value="">-- ជ្រើសរើស --</option>
          {(province?.districts ?? []).map((d) => (
            <option key={d.name} value={d.name}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Commune */}
      <div>
        <label className="mb-1 block text-xs font-semibold text-muted">ឃុំ / សង្កាត់</label>
        {hasCommunes ? (
          <select value={addr.commune} onChange={(e) => setCommune(e.target.value)} disabled={disabled || !addr.district} className={sel}>
            <option value="">-- ជ្រើសរើស --</option>
            {(district?.communes ?? []).map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={addr.commune}
            onChange={(e) => update({ commune: e.target.value, village: '' })}
            disabled={disabled || !addr.district}
            placeholder="ឃុំ / សង្កាត់"
            className={inp}
          />
        )}
      </div>

      {/* Village */}
      <div>
        <label className="mb-1 block text-xs font-semibold text-muted">ភូមិ</label>
        {hasVillages ? (
          <select value={addr.village} onChange={(e) => update({ village: e.target.value })} disabled={disabled || !addr.commune} className={sel}>
            <option value="">-- ជ្រើសរើស --</option>
            {(commune?.villages ?? []).map((v) => (
              <option key={v.name} value={v.name}>{v.name}</option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={addr.village}
            onChange={(e) => update({ village: e.target.value })}
            disabled={disabled || !addr.commune}
            placeholder="ភូមិ"
            className={inp}
          />
        )}
      </div>
    </div>
  )
}

/** Serialise a CambodiaAddress to a single string for storage */
export function formatCambodiaAddress(addr: CambodiaAddress): string {
  return [addr.village, addr.commune, addr.district, addr.province].filter(Boolean).join(', ')
}

/** Parse a stored address string back (best-effort) */
export function parseCambodiaAddress(raw: string | null | undefined): CambodiaAddress {
  if (!raw) return EMPTY
  const parts = raw.split(',').map((s) => s.trim()).reverse()
  return {
    province: parts[0] ?? '',
    district: parts[1] ?? '',
    commune: parts[2] ?? '',
    village: parts[3] ?? '',
  }
}
