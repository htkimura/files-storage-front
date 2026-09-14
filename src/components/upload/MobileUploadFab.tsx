import { cn } from '@/lib/utils'
import { UploadIcon } from 'lucide-react'
import { type FC } from 'react'
import { createPortal } from 'react-dom'

interface MobileUploadFabProps {
  onUpload: () => void
  disabled?: boolean
}

export const MobileUploadFab: FC<MobileUploadFabProps> = ({
  onUpload,
  disabled = false,
}) => {
  const fab = (
    <button
      type="button"
      onClick={onUpload}
      disabled={disabled}
      aria-label="Upload files"
      className={cn(
        'fixed z-[250] flex md:hidden',
        'bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-4',
        'size-14 items-center justify-center rounded-full',
        'bg-primary text-primary-foreground shadow-lg',
        'ring-4 ring-background/90',
        'transition-transform active:scale-95',
        'disabled:pointer-events-none disabled:opacity-50',
      )}
    >
      <UploadIcon className="size-6" strokeWidth={2.25} />
    </button>
  )

  if (typeof document === 'undefined') {
    return null
  }

  return createPortal(fab, document.body)
}
