import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  DownloadIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
} from 'lucide-react'

interface FileItemActionsProps {
  name: string
  className?: string
  menuAlign?: 'start' | 'end'
  stopPropagation?: boolean
  onDownload?: () => void
  onRename?: () => void
  onDelete?: () => void
}

const runAfterMenuClose = (action: () => void) => {
  setTimeout(action, 0)
}

export const FileItemActions = ({
  name,
  className,
  menuAlign = 'end',
  stopPropagation = false,
  onDownload,
  onRename,
  onDelete,
}: FileItemActionsProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'size-7 shrink-0 text-muted-foreground hover:text-foreground',
            className,
          )}
          onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
          onPointerDown={
            stopPropagation ? (e) => e.stopPropagation() : undefined
          }
        >
          <EllipsisVerticalIcon className="size-4" />
          <span className="sr-only">Actions for {name}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-48" align={menuAlign}>
        <DropdownMenuLabel className="truncate">{name}</DropdownMenuLabel>
        {onDownload && (
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={() => onDownload()}
          >
            <DownloadIcon />
            Download
          </DropdownMenuItem>
        )}
        {onRename && (
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={() => runAfterMenuClose(onRename)}
          >
            <PencilIcon />
            Rename
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem
            className="cursor-pointer text-red-500"
            onSelect={() => runAfterMenuClose(onDelete)}
          >
            <TrashIcon className="text-red-500" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
