import { cn } from '@/lib/utils'
import type { Folder } from '@htkimura/files-storage-backend.rest-client'
import { FolderIcon } from 'lucide-react'

interface VaultFolderTileDragPreviewProps {
  folder: Folder
}

export const VaultFolderTileDragPreview = ({
  folder,
}: VaultFolderTileDragPreviewProps) => {
  return (
    <div
      className={cn(
        'flex min-w-[12rem] items-center gap-2 rounded-xl border border-primary/30 bg-card px-3 py-2.5 shadow-lg',
        'rotate-1 scale-105',
      )}
    >
      <FolderIcon
        className="size-5 shrink-0 text-muted-foreground"
        strokeWidth={1.5}
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
        {folder.name}
      </span>
    </div>
  )
}
