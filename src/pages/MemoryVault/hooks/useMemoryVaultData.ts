import { queryDefaultOptions } from '@/config'
import { useUser } from '@/contexts'
import type { FileListSort } from '@/lib/file-list-sort'
import {
  type FileWithPresignedThumbnailUrl,
  type Folder,
  useListChildren,
} from '@htkimura/files-storage-backend.rest-client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const PAGE_SIZE = 20

export const useMemoryVaultData = (
  folderId: string | null,
  sort: FileListSort,
) => {
  const { token } = useUser()
  const clientAxiosConfig = {
    ...queryDefaultOptions.axios,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }

  const [hiddenFolderIds, setHiddenFolderIds] = useState<string[]>([])
  const [page, setPage] = useState(1)

  const listParams = useMemo(
    () => ({
      page,
      size: PAGE_SIZE,
      sortBy: sort.sortBy,
      sortOrder: sort.sortOrder,
      ...(folderId ? { parentFolderId: folderId } : {}),
    }),
    [folderId, page, sort.sortBy, sort.sortOrder],
  )
  const [allFolders, setAllFolders] = useState<Folder[]>([])
  const [allFiles, setAllFiles] = useState<FileWithPresignedThumbnailUrl[]>([])

  useEffect(() => {
    setHiddenFolderIds([])
    setPage(1)
    setAllFolders([])
    setAllFiles([])
  }, [folderId, sort.sortBy, sort.sortOrder])

  const folders = allFolders.filter(
    (folder) => !hiddenFolderIds.includes(folder.id),
  )

  const removeFolderFromView = (folderIdToHide: string) => {
    setHiddenFolderIds((prev) =>
      prev.includes(folderIdToHide) ? prev : [...prev, folderIdToHide],
    )
  }

  const {
    data: childrenDataRaw,
    isLoading: childrenInitialLoading,
    isFetching: childrenFetching,
    refetch: refetchChildren,
  } = useListChildren(listParams, {
    axios: clientAxiosConfig,
    query: {
      queryKey: ['/children', listParams],
    },
  })

  const childrenPayload = childrenDataRaw?.data
  const hasMore = childrenPayload?.hasMore ?? false

  useEffect(() => {
    if (!childrenPayload?.data) return

    const incomingFolders = childrenPayload.data.folders
    const incomingFiles = childrenPayload.data.files

    if (page === 1) {
      setAllFolders(incomingFolders)
      setAllFiles(incomingFiles)
      return
    }

    setAllFolders((prev) => {
      const ids = new Set(prev.map((folder) => folder.id))
      const next = [...prev]
      for (const folder of incomingFolders) {
        if (!ids.has(folder.id)) next.push(folder)
      }
      return next
    })

    setAllFiles((prev) => {
      const ids = new Set(prev.map((file) => file.id))
      const next = [...prev]
      for (const file of incomingFiles) {
        if (!ids.has(file.id)) next.push(file)
      }
      return next
    })
  }, [childrenPayload, page])

  const observerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!hasMore || childrenFetching) return

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
  }, [hasMore, childrenFetching])

  const loadMoreFiles = useCallback(() => {
    if (!hasMore || childrenFetching) return
    setPage((current) => current + 1)
  }, [hasMore, childrenFetching])

  const refreshFiles = useCallback(async () => {
    setPage(1)
    await refetchChildren()
  }, [refetchChildren])

  const foldersLoading = childrenInitialLoading && page === 1
  const filesInitialLoading = childrenInitialLoading && allFiles.length === 0

  return {
    clientAxiosConfig,
    folders,
    removeFolderFromView,
    foldersLoading,
    allFiles,
    setAllFiles,
    filesInitialLoading,
    filesFetching: childrenFetching,
    hasMore,
    observerRef,
    loadMoreFiles,
    refreshFiles,
  }
}
