import 'server-only'

import { randomUUID } from 'crypto'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getR2BucketName, getR2Client, getR2SignedDownloadUrl } from '@/lib/r2'

export type UploadBucket = 'member-documents' | 'payment-evidence' | 'loan-documents'

function extensionFor(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName

  if (file.type === 'application/pdf') return 'pdf'
  if (file.type.startsWith('image/')) return file.type.split('/')[1] || 'jpg'
  return 'bin'
}

function objectKey(bucket: UploadBucket, authUserId: string, folder: string, file: File) {
  return `${bucket}/${authUserId}/${folder}/${randomUUID()}.${extensionFor(file)}`
}

export async function uploadPrivateFile(
  bucket: UploadBucket,
  authUserId: string,
  folder: string,
  file: File | null
) {
  if (!file || file.size === 0) return null

  const key = objectKey(bucket, authUserId, folder, file)
  const body = Buffer.from(await file.arrayBuffer())

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: getR2BucketName(),
      Key: key,
      Body: body,
      ContentType: file.type || 'application/octet-stream',
    })
  )

  return key
}

export async function getPrivateFileUrl(key: string | null | undefined, expiresInSeconds = 3600) {
  if (!key) return null
  return getR2SignedDownloadUrl(key, expiresInSeconds)
}
