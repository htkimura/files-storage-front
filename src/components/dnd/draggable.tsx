import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { type FC, type ReactNode } from 'react'

interface DraggableProps {
  id: string
  children: ReactNode
  className?: string
  disabled?: boolean
  useDragOverlay?: boolean
}

export const Draggable: FC<DraggableProps> = ({
  children,
  id,
  className,
  disabled = false,
  useDragOverlay = false,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id,
      disabled,
    })

  const style = transform
    ? {
        transform: useDragOverlay
          ? undefined
          : CSS.Translate.toString(transform),
        opacity: useDragOverlay && isDragging ? 0.4 : undefined,
      }
    : useDragOverlay && isDragging
      ? { opacity: 0.4 }
      : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'touch-none cursor-grab active:cursor-grabbing',
        disabled && 'cursor-default',
        className,
      )}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  )
}
