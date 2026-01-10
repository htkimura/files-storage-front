import { useDroppable } from '@dnd-kit/core'
import { FC, ReactNode } from 'react'

export const Droppable: FC<{ id: string; children: ReactNode }> = ({
  id,
  children,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
  })
  const style = {
    color: isOver ? 'green' : undefined,
  }

  return (
    <div ref={setNodeRef} style={style}>
      {children}
    </div>
  )
}
