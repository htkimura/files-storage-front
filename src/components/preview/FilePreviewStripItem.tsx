import { Skeleton } from '@/components/ui/skeleton'
import type { FileWithPresignedThumbnailUrl } from '@htkimura/files-storage-backend.rest-client'
import classNames from 'classnames'
import { FileIcon } from 'lucide-react'
import { type FC, useState } from 'react'

interface FilePreviewStripItemProps {
  file: FileWithPresignedThumbnailUrl
  onSelect: (fileId: string) => void
  highlight?: boolean
  maxWidth?: number
  maxHeight?: number
}

export const FilePreviewStripItem: FC<FilePreviewStripItemProps> = ({
  file,
  onSelect,
  highlight = false,
  maxHeight = 100,
  maxWidth = 100,
}) => {
  const [loaded, setLoaded] = useState(false)
  const [thumbFailed, setThumbFailed] = useState(false)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    onSelect(file.id)
  }

  const showThumbnail = Boolean(file.presignedThumbnailUrl) && !thumbFailed

  return (
    <button
      type="button"
      onClick={handleClick}
      className={classNames(
        'shrink-0 overflow-hidden rounded-lg border border-white/10 bg-gray-800 transition-all duration-200',
        'hover:border-white/30',
        { 'ring-2 ring-primary ring-offset-2 ring-offset-gray-900': highlight },
      )}
    >
      {showThumbnail ? (
        <>
          {!loaded && (
            <Skeleton
              className="rounded-lg"
              style={{ width: maxWidth, height: maxHeight }}
            />
          )}
          <img
            src={file.presignedThumbnailUrl}
            alt={file.name}
            onLoad={() => setLoaded(true)}
            onError={() => setThumbFailed(true)}
            width={maxWidth}
            height={maxHeight}
            className={classNames('object-cover object-center', {
              hidden: !loaded,
            })}
          />
        </>
      ) : (
        <div
          className="flex flex-col items-center justify-center gap-1 px-2 text-white/80"
          style={{ width: maxWidth, height: maxHeight }}
        >
          <FileIcon className="size-6" strokeWidth={1.25} aria-hidden />
          <span className="line-clamp-2 w-full text-center text-[10px] leading-tight">
            {file.name}
          </span>
        </div>
      )}
    </button>
  )
}
