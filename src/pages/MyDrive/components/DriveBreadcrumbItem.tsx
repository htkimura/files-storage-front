import { Droppable } from '@/components/dnd/droppable'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { driveBreadcrumbDndId } from './dnd'

interface DriveBreadcrumbItemProps {
  label: string
  to: string
  dropFolderId: string | null
  isDraggingFile?: boolean
}

export const DriveBreadcrumbItem = ({
  label,
  to,
  dropFolderId,
  isDraggingFile = false,
}: DriveBreadcrumbItemProps) => {
  return (
    <Droppable
      id={driveBreadcrumbDndId(dropFolderId)}
      className={cn(
        'rounded-md transition-all',
        isDraggingFile &&
          'border border-dashed border-primary/35 bg-primary/5 px-0.5',
      )}
      activeClassName={cn(
        'border-solid bg-primary/15 ring-2 ring-primary ring-offset-2 ring-offset-card',
        isDraggingFile && 'scale-[1.02] shadow-sm',
      )}
    >
      <Link
        to={to}
        className={cn(
          'inline-block rounded-md px-1.5 py-0.5 transition-colors hover:text-foreground',
          isDraggingFile && 'font-medium text-foreground',
        )}
      >
        {label}
      </Link>
    </Droppable>
  )
}
