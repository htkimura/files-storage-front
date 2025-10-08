import { queryDefaultOptions } from '@/config'
import { useUser } from '@/contexts'
import { useMyFiles } from '@htkimura/files-storage-backend.rest-client'
import { useState } from 'react'

export const Images = () => {
  const { token } = useUser()

  const [isUploading, setIsUploading] = useState(false)

  const clientAxiosConfig = {
    ...queryDefaultOptions.axios,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }

  const [page, setPage] = useState(1)
  const size = 20

  const {
    data: filesDataRaw,
    refetch,
    isLoading: isLoadingFiles,
  } = useMyFiles(
    { page, size },
    {
      axios: clientAxiosConfig,
    },
  )

  const { data: filesData } = filesDataRaw || {}

  const files = filesData?.data || []

  return (
    <>
      {files.map((file) => (
        <div key={file.id}>
          <img src={file.thumbnailPath} alt={file.name} />
        </div>
      ))}
    </>
  )
}
