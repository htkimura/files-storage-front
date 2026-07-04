import { queryDefaultOptions } from '@/config'
import { useUser } from '@/contexts'
import {
  type FileWithPresignedThumbnailUrl,
  useListMyFolders,
  useMyFiles,
} from '@htkimura/files-storage-backend.rest-client'
import { useCallback, useEffect, useRef, useState } from 'react'

const PAGE_SIZE = 20

export const useMemoryVaultData = (folderId: string | null) => {
  const { token } = useUser()
  const clientAxiosConfig = {
    ...queryDefaultOptions.axios,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }

  const foldersQueryParams = { parentFolderId: folderId ?? null }

  const { data: foldersRes, isLoading: foldersLoading } = useListMyFolders(
    foldersQueryParams,
    {
      axios: clientAxiosConfig,
      query: {
        queryKey: ['/folders', foldersQueryParams],
      },
    },
  )

  const queryFolders = Array.isArray(foldersRes?.data) ? foldersRes!.data : []
  const [hiddenFolderIds, setHiddenFolderIds] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [allFiles, setAllFiles] = useState<FileWithPresignedThumbnailUrl[]>([])

  useEffect(() => {
    setHiddenFolderIds([])
    setPage(1)
    setAllFiles([])
  }, [folderId])

  const folders = queryFolders.filter(
    (folder) => !hiddenFolderIds.includes(folder.id),
  )

  const removeFolderFromView = (folderIdToHide: string) => {
    setHiddenFolderIds((prev) =>
      prev.includes(folderIdToHide) ? prev : [...prev, folderIdToHide],
    )
  }

  const {
    data: filesDataRaw,
    isLoading: filesInitialLoading,
    isFetching: filesFetching,
    refetch: refetchFiles,
  } = useMyFiles(
    { page, size: PAGE_SIZE, folderId },
    {
      axios: clientAxiosConfig,
    },
  )

  const filesPayload = filesDataRaw?.data
  const hasMore = filesPayload?.hasMore ?? false

  useEffect(() => {
    if (!filesPayload?.data) return
    const incoming = filesPayload.data
    if (page === 1) {
      setAllFiles(incoming)
      return
    }
    setAllFiles((prev) => {
      const ids = new Set(prev.map((f) => f.id))
      const next = [...prev]
      for (const f of incoming) {
        if (!ids.has(f.id)) next.push(f)
      }
      return next
    })
  }, [filesPayload, page])

  const observerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!hasMore || filesFetching) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setPage((p) => p + 1)
        }
      },
      { threshold: 0.1 },
    )

    const el = observerRef.current
    if (el) observer.observe(el)

    return () => {
      if (el) observer.unobserve(el)
    }
  }, [hasMore, filesFetching])

  const loadMoreFiles = useCallback(() => {
    if (!hasMore || filesFetching) return
    setPage((current) => current + 1)
  }, [hasMore, filesFetching])

  const refreshFiles = useCallback(async () => {
    setPage(1)
    await refetchFiles()
  }, [refetchFiles])

  return {
    clientAxiosConfig,
    folders,
    removeFolderFromView,
    foldersLoading,
    allFiles,
    setAllFiles,
    filesInitialLoading,
    filesFetching,
    hasMore,
    observerRef,
    loadMoreFiles,
    refreshFiles,
  }
}
