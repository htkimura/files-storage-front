import {
  FILE_TYPE_ICON_CLASS,
  getFileTypeCategory,
} from '@/lib/fileTypeIcon'
import { cn } from '@/lib/utils'
import {
  FileArchive,
  FileAudio,
  FileCode,
  FileIcon,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Presentation,
  type LucideIcon,
} from 'lucide-react'

const ICON_BY_CATEGORY: Record<
  ReturnType<typeof getFileTypeCategory>,
  LucideIcon
> = {
  pdf: FileText,
  video: FileVideo,
  audio: FileAudio,
  spreadsheet: FileSpreadsheet,
  document: FileText,
  presentation: Presentation,
  archive: FileArchive,
  code: FileCode,
  image: FileImage,
  generic: FileIcon,
}

interface FileTypeIconProps {
  file: { name: string; type: string }
  className?: string
  strokeWidth?: number
}

export const FileTypeIcon = ({
  file,
  className,
  strokeWidth = 1.25,
}: FileTypeIconProps) => {
  const category = getFileTypeCategory(file)
  const Icon = ICON_BY_CATEGORY[category]

  return (
    <Icon
      className={cn(FILE_TYPE_ICON_CLASS[category], className)}
      strokeWidth={strokeWidth}
      aria-hidden
    />
  )
}
