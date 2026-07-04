import { Draggable } from '@/components/dnd/draggable'
import { Droppable } from '@/components/dnd/droppable'
import { cn } from '@/lib/utils'
import { getFolderPageRoute } from '@/routes'
import type { Folder } from '@htkimura/files-storage-backend.rest-client'
import { FolderIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { vaultFolderDndId, vaultFolderDragDndId } from './dnd'

interface VaultFolderTileProps {
  folder: Folder
  isMoving?: boolean
  isDragActive?: boolean
}

export const VaultFolderTile = ({
  folder,
  isMoving = false,
  isDragActive = false,
}: VaultFolderTileProps) => {
  return (
    <Draggable
      id={vaultFolderDragDndId(folder.id)}
      disabled={isMoving}
      useDragOverlay
      className={cn(isMoving && 'pointer-events-none opacity-50')}
    >
      <Droppable
        id={vaultFolderDndId(folder.id)}
        className={cn(
          'flex min-w-0 items-center gap-2 rounded-xl bg-muted/50 px-3 py-2.5',
          'transition-colors hover:bg-muted/80',
          isDragActive &&
            'border border-dashed border-primary/35 bg-primary/5',
        )}
        activeClassName="border-solid bg-primary/10 ring-2 ring-primary ring-offset-2 ring-offset-card"
      >
        <Link
          to={getFolderPageRoute(folder.id)}
          className="flex min-w-0 flex-1 items-center gap-2 no-underline hover:no-underline"
          onClick={(e) => e.stopPropagation()}
        >
          <FolderIcon
            className="size-5 shrink-0 text-muted-foreground"
            strokeWidth={1.5}
            aria-hidden
          />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
            {folder.name}
          </span>
        </Link>
      </Droppable>
    </Draggable>
  )
}
