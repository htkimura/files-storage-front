import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { DownloadIcon, EllipsisVerticalIcon, TrashIcon } from 'lucide-react'

interface DriveItemActionsProps {
  name: string
  className?: string
  onDownload?: () => void
  onDelete?: () => void
}

export const DriveItemActions = ({
  name,
  className,
  onDownload,
  onDelete,
}: DriveItemActionsProps) => {
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
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <EllipsisVerticalIcon className="size-4" />
          <span className="sr-only">Actions for {name}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-48" align="end">
        <DropdownMenuLabel className="truncate">{name}</DropdownMenuLabel>
        {onDownload && (
          <DropdownMenuItem className="cursor-pointer" onClick={onDownload}>
            <DownloadIcon />
            Download
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem
            className="cursor-pointer text-red-500"
            onClick={onDelete}
          >
            <TrashIcon className="text-red-500" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
