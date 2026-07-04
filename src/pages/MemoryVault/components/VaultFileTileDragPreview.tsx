import { FileTypeIcon } from '@/components/FileTypeIcon'
import { cn } from '@/lib/utils'
import type { FileWithPresignedThumbnailUrl } from '@htkimura/files-storage-backend.rest-client'

interface VaultFileTileDragPreviewProps {
  file: FileWithPresignedThumbnailUrl
}

export const VaultFileTileDragPreview = ({
  file,
}: VaultFileTileDragPreviewProps) => {
  const url = file.presignedThumbnailUrl

  return (
    <div
      className={cn(
        'flex w-[9rem] flex-col gap-2 rounded-xl border border-primary/30 bg-card p-2.5 shadow-lg',
        'rotate-1 scale-105',
      )}
    >
      <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-muted/60">
        {url ? (
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <FileTypeIcon file={file} className="size-12" />
        )}
      </div>
      <p className="truncate text-xs font-medium text-foreground">
        {file.name}
      </p>
    </div>
  )
}
