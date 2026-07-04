import type { FileWithPresignedUrl } from '@htkimura/files-storage-backend.rest-client'
import type { IDocument } from '@cyntler/react-doc-viewer'

const MIME_TO_EXTENSION: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/bmp': 'bmp',
  'image/tiff': 'tiff',
  'text/plain': 'txt',
  'text/html': 'html',
  'text/csv': 'csv',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    'pptx',
}

export const getPreviewFileType = (file: {
  name: string
  type: string
}): string => {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension) return extension

  return MIME_TO_EXTENSION[file.type.toLowerCase()] ?? 'txt'
}

export const toPreviewDocument = (file: FileWithPresignedUrl): IDocument => ({
  uri: file.presignedUrl,
  fileName: file.name,
  fileType: getPreviewFileType(file),
})

const IMAGE_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'bmp',
  'svg',
  'tif',
  'tiff',
  'heic',
  'heif',
])

export const isImagePreviewFile = (file: {
  name: string
  type: string
}): boolean => {
  if (file.type.toLowerCase().startsWith('image/')) return true

  const extension = file.name.split('.').pop()?.toLowerCase()
  return extension ? IMAGE_EXTENSIONS.has(extension) : false
}

export type FetchedPreviewFiles = Record<string, FileWithPresignedUrl>

export const upsertPreviewFiles = (
  prev: FetchedPreviewFiles,
  nextFiles: FileWithPresignedUrl[],
): FetchedPreviewFiles => {
  let changed = false
  const next = { ...prev }

  for (const file of nextFiles) {
    const existing = next[file.id]
    if (
      existing?.presignedUrl === file.presignedUrl &&
      existing.name === file.name &&
      existing.type === file.type
    ) {
      continue
    }

    next[file.id] = file
    changed = true
  }

  return changed ? next : prev
}
