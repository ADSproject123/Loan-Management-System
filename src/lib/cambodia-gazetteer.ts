export type GazetteerType = 'province' | 'municipality' | 'district' | 'commune' | 'village'

export type GazetteerRecord = {
  code: string
  name_km: string
  name_en: string
  type: GazetteerType
  type_km: string
  type_en: string
  parent_code?: string
  reference?: string
}

export type GazetteerIndex = {
  records: GazetteerRecord[]
  byCode: Map<string, GazetteerRecord>
  childrenByParent: Map<string, GazetteerRecord[]>
  provinces: GazetteerRecord[]
}

const GAZETTEER_URL = '/province/gazetteer-normalized.json'

let gazetteerPromise: Promise<GazetteerIndex> | null = null

function sortByKhmerName(a: GazetteerRecord, b: GazetteerRecord) {
  return a.name_km.localeCompare(b.name_km, 'km')
}

function buildGazetteerIndex(records: GazetteerRecord[]): GazetteerIndex {
  const byCode = new Map<string, GazetteerRecord>()
  const childrenByParent = new Map<string, GazetteerRecord[]>()

  for (const record of records) {
    byCode.set(record.code, record)

    if (record.parent_code) {
      const siblings = childrenByParent.get(record.parent_code) ?? []
      siblings.push(record)
      childrenByParent.set(record.parent_code, siblings)
    }
  }

  for (const siblings of childrenByParent.values()) {
    siblings.sort(sortByKhmerName)
  }

  const provinces = records
    .filter((record) => record.type === 'province' || record.type === 'municipality')
    .sort(sortByKhmerName)

  return { records, byCode, childrenByParent, provinces }
}

export function loadCambodiaGazetteer(): Promise<GazetteerIndex> {
  if (!gazetteerPromise) {
    gazetteerPromise = fetch(GAZETTEER_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error('មិនអាចផ្ទុកទិន្នន័យអាសយដ្ឋានបានទេ។')
        }
        return response.json() as Promise<GazetteerRecord[]>
      })
      .then(buildGazetteerIndex)
  }

  return gazetteerPromise
}

export function getGazetteerChildren(index: GazetteerIndex, parentCode?: string) {
  if (!parentCode) return []
  return index.childrenByParent.get(parentCode) ?? []
}

export function findGazetteerChildByName(
  index: GazetteerIndex,
  parentCode: string | undefined,
  nameKm: string
) {
  if (!nameKm) return undefined
  return getGazetteerChildren(index, parentCode).find((record) => record.name_km === nameKm)
}

export function findProvinceByName(index: GazetteerIndex, nameKm: string) {
  if (!nameKm) return undefined
  return index.provinces.find((record) => record.name_km === nameKm)
}
