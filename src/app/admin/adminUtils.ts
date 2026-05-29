export function money(value: unknown) {
  return `฿${Number(value ?? 0).toLocaleString()}`
}

export function formatDate(value?: string | null) {
  if (!value) return 'មិនកំណត់'
  return new Date(value).toLocaleDateString('km-KH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function relatedMemberName(record: {
  members?: { full_name?: string | null } | { full_name?: string | null }[] | null
}) {
  const member = Array.isArray(record.members) ? record.members[0] : record.members
  return member?.full_name ?? 'សមាជិកមិនស្គាល់'
}

export function relatedMemberEmail(record: {
  members?: { email?: string | null } | { email?: string | null }[] | null
}) {
  const member = Array.isArray(record.members) ? record.members[0] : record.members
  return member?.email ?? 'គ្មានអ៊ីមែល'
}
