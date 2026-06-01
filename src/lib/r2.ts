import 'server-only'

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

let client: S3Client | null = null

function requireEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

export function getR2Client() {
  if (client) return client

  const accountId = requireEnv('R2_ACCOUNT_ID')
  const accessKeyId = requireEnv('R2_ACCESS_KEY_ID')
  const secretAccessKey = requireEnv('R2_SECRET_ACCESS_KEY')

  client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  })

  return client
}

export function getR2BucketName() {
  return requireEnv('R2_BUCKET_NAME')
}

export async function getR2SignedDownloadUrl(key: string, expiresInSeconds = 3600) {
  const command = new GetObjectCommand({
    Bucket: getR2BucketName(),
    Key: key,
  })

  return getSignedUrl(getR2Client(), command, { expiresIn: expiresInSeconds })
}
