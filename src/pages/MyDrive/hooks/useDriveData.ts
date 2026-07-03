import { queryDefaultOptions } from '@/config'
import { useUser } from '@/contexts'
import {
  type FileWithPresignedThumbnailUrl,
  useListMyFolders,
  useMyFiles,
} from '@htkimura/files-storage-backend.rest-client'
import { useEffect, useRef, useState } from 'react'

const PAGE_SIZE = 20

export const useDriveData = (folderId: string | null) => {
  const { token } = useUser()
  const clientAxiosConfig = {
    ...queryDefaultOptions.axios,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }

  const foldersQueryParams = { parentFolderId: folderId ?? null }

  const { data: foldersRes, isLoading: foldersLoading } = useListMyFolders({
    axios: {
      ...clientAxiosConfig,
      params: foldersQueryParams,
    },
    query: {
      queryKey: ['/folders', foldersQueryParams],
    },
  })
  const folders = foldersRes?.data ?? []

  const [page, setPage] = useState(1)
  const [allFiles, setAllFiles] = useState<FileWithPresignedThumbnailUrl[]>([])

  useEffect(() => {
    setPage(1)
    setAllFiles([])
  }, [folderId])

  const {
    data: filesDataRaw,
    isLoading: filesInitialLoading,
    isFetching: filesFetching,
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

  return {
    clientAxiosConfig,
    folders,
    foldersLoading,
    allFiles,
    setAllFiles,
    filesInitialLoading,
    filesFetching,
    hasMore,
    observerRef,
  }
}
