import { Droppable } from '@/components/dnd/droppable'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { vaultBreadcrumbDndId } from './dnd'

interface VaultBreadcrumbItemProps {
  label: string
  to: string
  dropFolderId: string | null
  isDragging?: boolean
}

export const VaultBreadcrumbItem = ({
  label,
  to,
  dropFolderId,
  isDragging = false,
}: VaultBreadcrumbItemProps) => {
  return (
    <Droppable
      id={vaultBreadcrumbDndId(dropFolderId)}
      className={cn(
        'rounded-md transition-all',
        isDragging &&
          'border border-dashed border-primary/35 bg-primary/5 px-0.5',
      )}
      activeClassName={cn(
        'border-solid bg-primary/15 ring-2 ring-primary ring-offset-2 ring-offset-card',
        isDragging && 'scale-[1.02] shadow-sm',
      )}
    >
      <Link
        to={to}
        className={cn(
          'inline-block rounded-md px-1.5 py-0.5 transition-colors hover:text-foreground',
          isDragging && 'font-medium text-foreground',
        )}
      >
        {label}
      </Link>
    </Droppable>
  )
}
