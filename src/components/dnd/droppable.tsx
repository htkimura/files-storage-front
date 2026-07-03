import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { type FC, type ReactNode } from 'react'

interface DroppableProps {
  id: string
  children: ReactNode
  className?: string
  activeClassName?: string
  disabled?: boolean
}

export const Droppable: FC<DroppableProps> = ({
  id,
  children,
  className,
  activeClassName,
  disabled = false,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
    disabled,
  })

  return (
    <div ref={setNodeRef} className={cn(className, isOver && activeClassName)}>
      {children}
    </div>
  )
}
