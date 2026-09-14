import { Skeleton } from '@/components/ui/skeleton'
import { useHeicAwareImageSrc } from '@/hooks/useHeicAwareImageSrc'
import type { FileWithPresignedThumbnailUrl } from '@htkimura/files-storage-backend.rest-client'
import classNames from 'classnames'
import { type FC, useState } from 'react'

interface Props {
  file: FileWithPresignedThumbnailUrl
  onSelect: (fileId: string) => void
  highlight?: boolean
  maxWidth?: number
  maxHeight?: number
  variant?: 'grid' | 'strip'
}

const ImageThumbnail: FC<Props> = ({
  file,
  onSelect,
  maxHeight = 200,
  maxWidth = 200,
  highlight = false,
  variant = 'grid',
}) => {
  const [loaded, setLoaded] = useState(false)
  const [thumbFailed, setThumbFailed] = useState(false)
  const { src, isPending, failed } = useHeicAwareImageSrc(
    file.presignedThumbnailUrl,
    file,
  )
  const canShowThumbnail =
    Boolean(file.presignedThumbnailUrl) && !thumbFailed && !failed

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    onSelect(file.id)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={classNames(
        'overflow-hidden rounded-xl border border-border/80 bg-muted shadow-sm transition-all duration-200',
        variant === 'grid' && 'hover:scale-[1.02] hover:border-primary/25 hover:shadow-md',
        variant === 'strip' && 'block h-full w-full hover:border-primary/25',
        {
          'ring-2 ring-primary ring-offset-2': !!highlight && variant === 'grid',
          'ring-2 ring-primary ring-inset': !!highlight && variant === 'strip',
          'ring-offset-card': !!highlight && variant === 'grid',
        },
      )}
    >
      {canShowThumbnail ? (
        <>
          {(!loaded || isPending) && (
            <Skeleton
              className={classNames('rounded-md', {
                'h-full w-full': variant === 'strip',
              })}
              style={
                variant === 'grid'
                  ? { width: maxWidth, height: maxHeight }
                  : undefined
              }
            />
          )}
          {src ? (
            <img
              src={src}
              alt={file.name}
              onLoad={() => setLoaded(true)}
              onError={() => setThumbFailed(true)}
              width={variant === 'grid' ? maxWidth : undefined}
              height={variant === 'grid' ? maxHeight : undefined}
              className={classNames('object-cover object-center', {
                hidden: !loaded || isPending,
                'h-full w-full': variant === 'strip',
              })}
            />
          ) : null}
        </>
      ) : (
        <div
          className={classNames(
            'flex items-center justify-center bg-muted text-xs text-muted-foreground',
            variant === 'strip' && 'h-full w-full',
          )}
          style={
            variant === 'grid'
              ? { width: maxWidth, height: maxHeight }
              : undefined
          }
        >
          No preview
        </div>
      )}
    </button>
  )
}

export default ImageThumbnail
