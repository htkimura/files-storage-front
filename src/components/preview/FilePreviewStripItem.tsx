import { FileTypeIcon } from '@/components/FileTypeIcon'
import { Skeleton } from '@/components/ui/skeleton'
import type { FileWithPresignedThumbnailUrl } from '@htkimura/files-storage-backend.rest-client'
import classNames from 'classnames'
import { type FC, useState } from 'react'

interface FilePreviewStripItemProps {
  file: FileWithPresignedThumbnailUrl
  onSelect: (fileId: string) => void
  highlight?: boolean
}

export const FilePreviewStripItem: FC<FilePreviewStripItemProps> = ({
  file,
  onSelect,
  highlight = false,
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
        'block h-full w-full overflow-hidden rounded-lg border border-white/10 bg-gray-800 transition-all duration-200',
        'hover:border-white/30',
        { 'ring-2 ring-primary ring-inset': highlight },
      )}
    >
      {showThumbnail ? (
        <>
          {!loaded && <Skeleton className="h-full w-full rounded-lg" />}
          <img
            src={file.presignedThumbnailUrl}
            alt={file.name}
            onLoad={() => setLoaded(true)}
            onError={() => setThumbFailed(true)}
            className={classNames('h-full w-full object-cover object-center', {
              hidden: !loaded,
            })}
          />
        </>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-white/80">
          <FileTypeIcon file={file} className="size-6 shrink-0" />
          <span className="line-clamp-2 w-full text-center text-[10px] leading-tight">
            {file.name}
          </span>
        </div>
      )}
    </button>
  )
}
