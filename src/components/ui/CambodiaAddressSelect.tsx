'use client'

import { useEffect, useState } from 'react'
import {
  findGazetteerChildByName,
  findProvinceByName,
  getGazetteerChildren,
  loadCambodiaGazetteer,
  type GazetteerIndex,
  type GazetteerRecord,
} from '@/lib/cambodia-gazetteer'

export type CambodiaAddress = {
  province: string
  district: string
  commune: string
  village: string
  streetNumber: string
  houseNumber: string
}

const EMPTY: CambodiaAddress = {
  province: '',
  district: '',
  commune: '',
  village: '',
  streetNumber: '',
  houseNumber: '',
}

function normalizeCambodiaAddress(value?: Partial<CambodiaAddress> | null): CambodiaAddress {
  return {
    province: value?.province ?? '',
    district: value?.district ?? '',
    commune: value?.commune ?? '',
    village: value?.village ?? '',
    streetNumber: value?.streetNumber ?? '',
    houseNumber: value?.houseNumber ?? '',
  }
}

interface Props {
  value?: CambodiaAddress
  onChange: (address: CambodiaAddress) => void
  disabled?: boolean
  selectClassName?: string
  inputClassName?: string
}

function optionLabel(record: GazetteerRecord) {
  return `${record.type_km} ${record.name_km}`
}

export function CambodiaAddressSelect({
  value,
  onChange,
  disabled,
  selectClassName = '',
  inputClassName = '',
}: Props) {
  const [addr, setAddr] = useState<CambodiaAddress>(() => normalizeCambodiaAddress(value))
  const [index, setIndex] = useState<GazetteerIndex | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (value !== undefined) {
      setAddr(normalizeCambodiaAddress(value))
    }
  }, [value])

  useEffect(() => {
    let cancelled = false

    loadCambodiaGazetteer()
      .then((loaded) => {
        if (!cancelled) {
          setIndex(loaded)
          setError(null)
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'មិនអាចផ្ទុកទិន្នន័យអាសយដ្ឋានបានទេ។')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const provinceRecord = index ? findProvinceByName(index, addr.province) : undefined
  const districtRecord = index
    ? findGazetteerChildByName(index, provinceRecord?.code, addr.district)
    : undefined
  const communeRecord = index
    ? findGazetteerChildByName(index, districtRecord?.code, addr.commune)
    : undefined

  const districts = index ? getGazetteerChildren(index, provinceRecord?.code) : []
  const communes = index ? getGazetteerChildren(index, districtRecord?.code) : []
  const villages = index ? getGazetteerChildren(index, communeRecord?.code) : []

  function update(patch: Partial<CambodiaAddress>) {
    const next = normalizeCambodiaAddress({ ...addr, ...patch })
    setAddr(next)
    onChange(next)
  }

  function setProvince(nameKm: string) {
    update({ province: nameKm, district: '', commune: '', village: '' })
  }

  function setDistrict(nameKm: string) {
    update({ district: nameKm, commune: '', village: '' })
  }

  function setCommune(nameKm: string) {
    update({ commune: nameKm, village: '' })
  }

  const sel = `${selectClassName} w-full`
  const inp = `${inputClassName} w-full`
  const isDisabled = disabled || loading || Boolean(error)

  return (
    <div className="space-y-3">
      {loading ? (
        <p className="text-xs text-muted">កំពុងផ្ទុកទិន្នន័យអាសយដ្ឋាន...</p>
      ) : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">ខេត្ត / រាជធានី</label>
          <select
            value={addr.province}
            onChange={(event) => setProvince(event.target.value)}
            disabled={isDisabled}
            className={sel}
          >
            <option value="">-- ជ្រើសរើស --</option>
            {(index?.provinces ?? []).map((record) => (
              <option key={record.code} value={record.name_km}>
                {optionLabel(record)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">ស្រុក / ខណ្ឌ</label>
          <select
            value={addr.district}
            onChange={(event) => setDistrict(event.target.value)}
            disabled={isDisabled || !addr.province}
            className={sel}
          >
            <option value="">-- ជ្រើសរើស --</option>
            {districts.map((record) => (
              <option key={record.code} value={record.name_km}>
                {optionLabel(record)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">ឃុំ / សង្កាត់</label>
          <select
            value={addr.commune}
            onChange={(event) => setCommune(event.target.value)}
            disabled={isDisabled || !addr.district}
            className={sel}
          >
            <option value="">-- ជ្រើសរើស --</option>
            {communes.map((record) => (
              <option key={record.code} value={record.name_km}>
                {optionLabel(record)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">ភូមិ</label>
          <select
            value={addr.village}
            onChange={(event) => update({ village: event.target.value })}
            disabled={isDisabled || !addr.commune}
            className={sel}
          >
            <option value="">-- ជ្រើសរើស --</option>
            {villages.map((record) => (
              <option key={record.code} value={record.name_km}>
                {optionLabel(record)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">លេខផ្លូវ</label>
          <input
            type="text"
            value={addr.streetNumber}
            onChange={(event) => update({ streetNumber: event.target.value })}
            disabled={isDisabled}
            placeholder="ឧ. ១២៣"
            className={inp}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">លេខផ្ទះ</label>
          <input
            type="text"
            value={addr.houseNumber}
            onChange={(event) => update({ houseNumber: event.target.value })}
            disabled={isDisabled}
            placeholder="ឧ. ៤៥"
            className={inp}
          />
        </div>
      </div>
    </div>
  )
}

/** Serialise a CambodiaAddress to a single string for storage */
export function formatCambodiaAddress(addr: CambodiaAddress): string {
  return [
    addr.houseNumber,
    addr.streetNumber,
    addr.village,
    addr.commune,
    addr.district,
    addr.province,
  ]
    .filter(Boolean)
    .join(', ')
}

/** Parse a stored address string back (best-effort) */
export function parseCambodiaAddress(raw: string | null | undefined): CambodiaAddress {
  if (!raw) return normalizeCambodiaAddress(EMPTY)

  const parts = raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .reverse()

  if (parts.length <= 4) {
    return normalizeCambodiaAddress({
      province: parts[0] ?? '',
      district: parts[1] ?? '',
      commune: parts[2] ?? '',
      village: parts[3] ?? '',
    })
  }

  return normalizeCambodiaAddress({
    province: parts[0] ?? '',
    district: parts[1] ?? '',
    commune: parts[2] ?? '',
    village: parts[3] ?? '',
    streetNumber: parts[4] ?? '',
    houseNumber: parts[5] ?? '',
  })
}
