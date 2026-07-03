import { Droppable } from '@/components/dnd/droppable'
import { cn } from '@/lib/utils'
import type { Folder } from '@htkimura/files-storage-backend.rest-client'
import { FolderIcon } from 'lucide-react'
import { driveFolderDndId } from './dnd'

interface DriveFolderTileProps {
  folder: Folder
}

export const DriveFolderTile = ({ folder }: DriveFolderTileProps) => {
  return (
    <Droppable
      id={driveFolderDndId(folder.id)}
      className={cn(
        'flex min-w-0 items-center gap-2 rounded-xl bg-muted/50 px-3 py-2.5',
        'transition-colors hover:bg-muted/80',
      )}
      activeClassName="bg-primary/10 ring-2 ring-primary ring-offset-2 ring-offset-card"
    >
      <FolderIcon
        className="size-5 shrink-0 text-muted-foreground"
        strokeWidth={1.5}
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
        {folder.name}
      </span>
    </Droppable>
  )
}
