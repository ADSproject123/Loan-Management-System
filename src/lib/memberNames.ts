const FULL_NAME_SEPARATOR = ' | '

export type MemberNameFields = {
  full_name?: string | null
  full_name_kh?: string | null
}

export type MemberSearchFields = MemberNameFields & {
  full_name_en?: string | null
}

function appendNamePart(parts: Set<string>, value?: string | null) {
  const trimmed = value?.trim()
  if (trimmed) parts.add(trimmed)
}

export function memberKhmerName(
  member?: MemberNameFields | null,
  fallback = 'សមាជិកមិនស្គាល់'
): string {
  if (!member) return fallback

  const khmerName = member.full_name_kh?.trim()
  if (khmerName) return khmerName

  const fullName = member.full_name?.trim()
  if (!fullName) return fallback

  const separatorIndex = fullName.indexOf(FULL_NAME_SEPARATOR)
  if (separatorIndex !== -1) {
    const parsedKhmer = fullName.slice(0, separatorIndex).trim()
    return parsedKhmer || fallback
  }

  return fullName
}

export function memberSearchText(member?: MemberSearchFields | null): string {
  if (!member) return ''

  const parts = new Set<string>()

  appendNamePart(parts, member.full_name_kh)
  appendNamePart(parts, member.full_name_en)

  const fullName = member.full_name?.trim()
  if (fullName) {
    appendNamePart(parts, fullName)
    const separatorIndex = fullName.indexOf(FULL_NAME_SEPARATOR)
    if (separatorIndex !== -1) {
      appendNamePart(parts, fullName.slice(0, separatorIndex))
      appendNamePart(parts, fullName.slice(separatorIndex + FULL_NAME_SEPARATOR.length))
    }
  }

  return Array.from(parts).join(' ').toLowerCase()
}

export function memberMatchesSearch(
  member: MemberSearchFields | null | undefined,
  query: string
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return memberSearchText(member).includes(q)
}
