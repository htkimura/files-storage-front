export type FileTypeCategory =
  | 'pdf'
  | 'video'
  | 'audio'
  | 'spreadsheet'
  | 'document'
  | 'presentation'
  | 'archive'
  | 'code'
  | 'image'
  | 'generic'

const EXTENSION_CATEGORY: Record<string, FileTypeCategory> = {
  pdf: 'pdf',
  mp4: 'video',
  webm: 'video',
  mov: 'video',
  mkv: 'video',
  avi: 'video',
  m4v: 'video',
  mp3: 'audio',
  wav: 'audio',
  ogg: 'audio',
  flac: 'audio',
  m4a: 'audio',
  xls: 'spreadsheet',
  xlsx: 'spreadsheet',
  csv: 'spreadsheet',
  ods: 'spreadsheet',
  doc: 'document',
  docx: 'document',
  odt: 'document',
  rtf: 'document',
  txt: 'document',
  ppt: 'presentation',
  pptx: 'presentation',
  odp: 'presentation',
  zip: 'archive',
  rar: 'archive',
  '7z': 'archive',
  tar: 'archive',
  gz: 'archive',
  js: 'code',
  ts: 'code',
  tsx: 'code',
  jsx: 'code',
  py: 'code',
  json: 'code',
  html: 'code',
  htm: 'code',
  css: 'code',
  md: 'code',
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  gif: 'image',
  webp: 'image',
  bmp: 'image',
  svg: 'image',
  heic: 'image',
  heif: 'image',
}

const MIME_CATEGORY: Record<string, FileTypeCategory> = {
  'application/pdf': 'pdf',
  'application/msword': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'document',
  'application/vnd.oasis.opendocument.text': 'document',
  'application/vnd.ms-excel': 'spreadsheet',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    'spreadsheet',
  'text/csv': 'spreadsheet',
  'application/vnd.ms-powerpoint': 'presentation',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    'presentation',
  'application/zip': 'archive',
  'application/x-rar-compressed': 'archive',
  'application/json': 'code',
  'text/plain': 'document',
  'text/html': 'code',
}

export const getFileTypeCategory = (file: {
  name: string
  type: string
}): FileTypeCategory => {
  const mime = file.type.toLowerCase()
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  if (mime.startsWith('image/')) return 'image'

  const mimeCategory = MIME_CATEGORY[mime]
  if (mimeCategory) return mimeCategory

  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension && EXTENSION_CATEGORY[extension]) {
    return EXTENSION_CATEGORY[extension]
  }

  return 'generic'
}

export const FILE_TYPE_ICON_CLASS: Record<FileTypeCategory, string> = {
  pdf: 'text-red-500',
  video: 'text-violet-500',
  audio: 'text-pink-500',
  spreadsheet: 'text-emerald-600',
  document: 'text-blue-600',
  presentation: 'text-orange-500',
  archive: 'text-amber-600',
  code: 'text-slate-500',
  image: 'text-sky-500',
  generic: 'text-muted-foreground',
}
