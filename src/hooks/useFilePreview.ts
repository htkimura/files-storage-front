import { queryDefaultOptions } from '@/config'
import { useUser } from '@/contexts'
import {
  type FetchedPreviewFiles,
  upsertPreviewFiles,
} from '@/lib/filePreview'
import {
  getFileById,
  type FileWithPresignedUrl,
} from '@htkimura/files-storage-backend.rest-client'
import { useCallback, useRef, useState } from 'react'

export const useFilePreview = () => {
  const { token } = useUser()
  const [fileIdToPreview, setFileIdToPreview] = useState<string | null>(null)
  const [fetchedFiles, setFetchedFiles] = useState<FetchedPreviewFiles>({})
  const fetchedFilesRef = useRef(fetchedFiles)
  const pendingFetchIdsRef = useRef(new Set<string>())

  fetchedFilesRef.current = fetchedFiles

  const clientAxiosConfig = {
    ...queryDefaultOptions.axios,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }

  const mergeFetchedFiles = useCallback((nextFiles: FileWithPresignedUrl[]) => {
    setFetchedFiles((prev) => upsertPreviewFiles(prev, nextFiles))
  }, [])

  const fetchPreviewFile = useCallback(
    async (fileId: string) => {
      if (
        !token ||
        pendingFetchIdsRef.current.has(fileId) ||
        fetchedFilesRef.current[fileId]
      ) {
        return
      }

      pendingFetchIdsRef.current.add(fileId)

      try {
        const response = await getFileById(fileId, clientAxiosConfig)
        mergeFetchedFiles([response.data])
      } finally {
        pendingFetchIdsRef.current.delete(fileId)
      }
    },
    [clientAxiosConfig, mergeFetchedFiles, token],
  )

  const openPreview = useCallback(
    (fileId: string) => {
      setFileIdToPreview(fileId)
      void fetchPreviewFile(fileId)
    },
    [fetchPreviewFile],
  )

  const closePreview = useCallback(() => {
    setFileIdToPreview(null)
  }, [])

  const activeFile = fileIdToPreview ? fetchedFiles[fileIdToPreview] : undefined
  const isLoadingActiveFile = Boolean(
    fileIdToPreview && !activeFile,
  )

  return {
    fileIdToPreview,
    activeFile,
    isLoadingActiveFile,
    openPreview,
    closePreview,
  }
}
