import { isHeicFile } from '@/lib/filePreview'

const convertedUrlCache = new Map<string, Promise<string>>()

const WEB_SAFE_BLOB_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

const heicBlobToJpegObjectUrl = async (blob: Blob): Promise<string> => {
  const heic2any = (await import('heic2any')).default
  const converted = await heic2any({
    blob,
    toType: 'image/jpeg',
    quality: 0.85,
  })
  const jpegBlob = Array.isArray(converted) ? converted[0] : converted

  return URL.createObjectURL(jpegBlob)
}

const fetchAndConvertHeicUrl = async (url: string): Promise<string> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch HEIC (${response.status})`)
  }

  const blob = await response.blob()
  const blobType = blob.type.toLowerCase()

  if (WEB_SAFE_BLOB_TYPES.has(blobType)) {
    return URL.createObjectURL(blob)
  }

  return heicBlobToJpegObjectUrl(blob)
}

export const resolveDisplayImageUrl = async (
  remoteUrl: string,
  file: { name: string; type: string },
): Promise<string> => {
  if (!isHeicFile(file)) {
    return remoteUrl
  }

  const cached = convertedUrlCache.get(remoteUrl)
  if (cached) {
    return cached
  }

  const pending = fetchAndConvertHeicUrl(remoteUrl)
  convertedUrlCache.set(remoteUrl, pending)

  try {
    return await pending
  } catch (error) {
    convertedUrlCache.delete(remoteUrl)
    throw error
  }
}
