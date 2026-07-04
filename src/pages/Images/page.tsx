import { FilePreviewer } from '@/components/preview/FilePreviewer'
import {
  FilePreviewStrip,
  PreviewStripItem,
} from '@/components/preview/FilePreviewStrip'
import { useFilePreview } from '@/hooks/useFilePreview'
import type { FetchedPreviewFiles } from '@/lib/filePreview'
import { Skeleton } from '@/components/ui/skeleton'
import { Layout } from '@/components/layout/layout'
import { queryDefaultOptions } from '@/config'
import { useOverlay, useUser } from '@/contexts'
import {
  type FileWithPresignedThumbnailUrl,
  useMyFiles,
} from '@htkimura/files-storage-backend.rest-client'
import { useCallback, useEffect, useRef, useState } from 'react'
import ImageThumbnail from './components/ImageThumbnail'

export type { FetchedPreviewFiles as FetchedFiles }

export const Images = () => {
  const { token } = useUser()

  const clientAxiosConfig = {
    ...queryDefaultOptions.axios,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }

  const [page, setPage] = useState(1)
  const [allFiles, setAllFiles] = useState<FileWithPresignedThumbnailUrl[]>([])
  const size = 20

  const {
    data: filesDataRaw,
    isLoading: isLoadingFiles,
    isFetching: isFetchingFiles,
  } = useMyFiles(
    { page, size, filterType: ['image'] },
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

  const files = allFiles
  const fileIds = files.map((file) => file.id)

  const loadMoreFiles = useCallback(() => {
    if (!hasMore || isFetchingFiles) return
    setPage((current) => current + 1)
  }, [hasMore, isFetchingFiles])

  const {
    fileIdToPreview,
    activeFile,
    isLoadingActiveFile,
    openPreview,
    closePreview,
  } = useFilePreview()

  const observerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!hasMore || isFetchingFiles) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1)
        }
      },
      { threshold: 0.1 },
    )

    const ref = observerRef.current
    if (ref) observer.observe(ref)

    return () => {
      if (ref) observer.unobserve(ref)
    }
  }, [hasMore, isFetchingFiles])

  const { setContent } = useOverlay()

  useEffect(() => {
    if (!fileIdToPreview) {
      setContent(undefined)
      return
    }

    setContent(
      <FilePreviewer
        key={fileIdToPreview}
        file={activeFile ?? null}
        isLoading={isLoadingActiveFile}
        onClose={closePreview}
        strip={
          <FilePreviewStrip
            selectedFileId={fileIdToPreview}
            fileIds={fileIds}
            hasMore={hasMore}
            isLoadingMore={isFetchingFiles}
            onLoadMore={loadMoreFiles}
          >
            {files.map((item) => (
              <PreviewStripItem key={item.id} fileId={item.id}>
                <ImageThumbnail
                  file={item}
                  onSelect={openPreview}
                  highlight={item.id === fileIdToPreview}
                  variant="strip"
                />
              </PreviewStripItem>
            ))}
          </FilePreviewStrip>
        }
      />,
    )

    return () => setContent(undefined)
  }, [
    activeFile,
    closePreview,
    fileIdToPreview,
    files,
    isLoadingActiveFile,
    fileIds,
    hasMore,
    isFetchingFiles,
    loadMoreFiles,
    openPreview,
    setContent,
  ])

  return (
    <Layout className="p-0">
      <div className="flex flex-col gap-8 p-6 md:p-8 md:pb-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Images
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Open any thumbnail to preview in full screen
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {files.map((file) => (
            <ImageThumbnail
              file={file}
              onSelect={openPreview}
              key={file.id}
            />
          ))}
          {isLoadingFiles && files.length === 0 && <SkeletonImageThumbnails />}
          {isFetchingFiles && files.length > 0 && (
            <Skeleton className="h-[200px] w-[200px] rounded-xl" />
          )}
          {hasMore && (
            <div
              ref={observerRef}
              className="flex h-10 w-full items-center justify-center"
            />
          )}
        </div>
      </div>
    </Layout>
  )
}

const SkeletonImageThumbnails = () => {
  return Array.from({ length: 15 }).map((_, index) => (
    <Skeleton key={index} className="h-[200px] w-[200px] rounded-xl" />
  ))
}
