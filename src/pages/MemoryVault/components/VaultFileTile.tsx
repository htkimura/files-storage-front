import { Draggable } from '@/components/dnd/draggable'
import { FileTypeIcon } from '@/components/FileTypeIcon'
import { FileItemActions } from '@/components/FileItemActions'
import { cn } from '@/lib/utils'
import type { FileWithPresignedThumbnailUrl } from '@htkimura/files-storage-backend.rest-client'
import { useState } from 'react'
import { vaultFileDndId } from './dnd'

interface VaultFileTileProps {
  file: FileWithPresignedThumbnailUrl
  onDownload: (fileId: string) => void
  onPreview: (fileId: string) => void
  onRename: (file: FileWithPresignedThumbnailUrl) => void
  onDelete: (file: FileWithPresignedThumbnailUrl) => void
  isMoving?: boolean
}

export const VaultFileTile = ({
  file,
  onDownload,
  onPreview,
  onRename,
  onDelete,
  isMoving = false,
}: VaultFileTileProps) => {
  const [thumbFailed, setThumbFailed] = useState(false)
  const url = file.presignedThumbnailUrl
  const showImage = Boolean(url) && !thumbFailed

  return (
    <Draggable
      id={vaultFileDndId(file.id)}
      disabled={isMoving}
      useDragOverlay
      className={cn(
        'group flex flex-col gap-2 rounded-xl border border-border/80 bg-card p-2.5 shadow-sm',
        'transition-shadow hover:border-primary/20 hover:shadow-md',
        isMoving && 'pointer-events-none opacity-50',
      )}
    >
      <button
        type="button"
        onClick={() => onPreview(file.id)}
        className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-muted/60"
      >
        {showImage ? (
          <img
            src={url}
            alt=""
            className="h-full w-full object-cover"
            draggable={false}
            onError={() => setThumbFailed(true)}
          />
        ) : (
          <FileTypeIcon file={file} className="size-12" />
        )}
      </button>
      <div className="flex min-w-0 items-center gap-0.5">
        <p className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
          {file.name}
        </p>
        <FileItemActions
          name={file.name}
          stopPropagation
          onDownload={() => onDownload(file.id)}
          onRename={() => onRename(file)}
          onDelete={() => onDelete(file)}
          className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
        />
      </div>
    </Draggable>
  )
}
