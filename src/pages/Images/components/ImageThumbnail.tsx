import { Skeleton } from '@/components/ui/skeleton'
import { queryDefaultOptions } from '@/config'
import { useUser } from '@/contexts'
import {
  FileWithPresignedThumbnailUrl,
  FileWithPresignedUrl,
  useGetFileById,
} from '@htkimura/files-storage-backend.rest-client'
import classNames from 'classnames'
import { FC, useState } from 'react'

interface Props {
  file: FileWithPresignedThumbnailUrl
  addFetchedFile: (file: FileWithPresignedUrl) => void
  setFileIdToPreview: (fileId: string) => void
  fileAlreadyFetched?: boolean
  highlight?: boolean
  maxWidth?: number
  maxHeight?: number
}

const ImageThumbnail: FC<Props> = ({
  file,
  addFetchedFile,
  setFileIdToPreview,
  fileAlreadyFetched = false,
  maxHeight = 200,
  maxWidth = 200,
  highlight = false,
}) => {
  const { token } = useUser()
  const [loaded, setLoaded] = useState(false)
  const [thumbFailed, setThumbFailed] = useState(false)

  const clientAxiosConfig = {
    ...queryDefaultOptions.axios,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }

  const { refetch } = useGetFileById(file.id, {
    axios: clientAxiosConfig,
    query: { queryKey: ['file', file.id], enabled: false },
  })

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (fileAlreadyFetched) return setFileIdToPreview(file.id)
    const { data: fileDataRaw } = await refetch()
    if (!fileDataRaw) return
    addFetchedFile(fileDataRaw?.data)
  }

  return (
    <button
      onClick={handleClick}
      className={classNames(
        'overflow-hidden rounded-xl border border-border/80 bg-muted shadow-sm transition-all duration-200',
        'hover:scale-[1.02] hover:border-primary/25 hover:shadow-md',
        { 'ring-2 ring-primary ring-offset-2 ring-offset-card': !!highlight },
      )}
    >
      {file.presignedThumbnailUrl && !thumbFailed ? (
        <>
          {!loaded && (
            <Skeleton className="h-[200px] w-[200px] rounded-md" />
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
          className="flex items-center justify-center bg-muted text-xs text-muted-foreground"
          style={{ width: maxWidth, height: maxHeight }}
        >
          No preview
        </div>
      )}
    </button>
  )
}

export default ImageThumbnail
