import 'server-only'

import { randomUUID } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

export type UploadBucket = 'member-documents' | 'payment-evidence' | 'loan-documents'

function extensionFor(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName

  if (file.type === 'application/pdf') return 'pdf'
  if (file.type.startsWith('image/')) return file.type.split('/')[1] || 'jpg'
  return 'bin'
}

export async function uploadPrivateFile(
  bucket: UploadBucket,
  authUserId: string,
  folder: string,
  file: File | null
) {
  if (!file || file.size === 0) return null

  const admin = createAdminClient()
  const path = `${authUserId}/${folder}/${randomUUID()}.${extensionFor(file)}`

  const { error } = await admin.storage
    .from(bucket)
    .upload(path, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (error) throw error

  return path
}
