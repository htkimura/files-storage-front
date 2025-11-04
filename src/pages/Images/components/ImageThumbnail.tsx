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
  highlight?: boolean
  maxWidth?: number
  maxHeight?: number
}

const ImageThumbnail: FC<Props> = ({
  file,
  addFetchedFile,
  maxHeight = 200,
  maxWidth = 200,
  highlight = false,
}) => {
  const { token } = useUser()
  const [loaded, setLoaded] = useState(false)

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
    const { data: fileDataRaw } = await refetch()
    if (!fileDataRaw) return
    addFetchedFile(fileDataRaw?.data)
  }

  return (
    <button
      onClick={handleClick}
      className={classNames(
        `hover:opacity-60 hover:scale-105 hover:shadow-xl shadow-md transition-transform rounded-md bg-slate-100 overflow-hidden`,
        { 'ring-4 ring-blue-500': !!highlight },
      )}
    >
      {!loaded && (
        <Skeleton
          className={`h-[${maxHeight}px] w-[${maxWidth}px] rounded-md`}
        />
      )}
      <img
        src={file.presignedThumbnailUrl}
        alt={file.name}
        onLoad={() => setLoaded(true)}
        width={maxWidth}
        height={maxHeight}
        className={classNames('object-cover object-center', {
          hidden: !loaded,
        })}
      />
    </button>
  )
}

export default ImageThumbnail
