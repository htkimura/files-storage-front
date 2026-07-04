import { FilePreviewer } from '@/components/preview/FilePreviewer'
import { useFilePreview } from '@/hooks/useFilePreview'
import type { FetchedPreviewFiles } from '@/lib/filePreview'
import { Layout } from '@/components/layout/layout'
import { queryDefaultOptions } from '@/config'
import { useOverlay, useUser } from '@/contexts'
import { useMyFiles } from '@htkimura/files-storage-backend.rest-client'
import { useEffect, useRef, useState } from 'react'
import ImageThumbnail from './components/ImageThumbnail'
import { Skeleton } from '@/components/ui/skeleton'

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
  const size = 20

  const { data: filesDataRaw, isLoading: isLoadingFiles } = useMyFiles(
    { page, size, filterType: ['image'] },
    {
      axios: clientAxiosConfig,
    },
  )

  const { data: filesData } = filesDataRaw || {}

  const files = filesData?.data || []
  const hasMore = filesData?.hasMore || false

  const {
    fileIdToPreview,
    activeFile,
    isLoadingActiveFile,
    openPreview,
    closePreview,
  } = useFilePreview()

  const observerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!hasMore || isLoadingFiles) return

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
  }, [hasMore, isLoadingFiles, setPage])

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
          <div className="flex gap-2 overflow-x-auto p-2 max-h-[15vh]">
            {files.map((item) => (
              <ImageThumbnail
                key={item.id}
                file={item}
                onSelect={openPreview}
                maxHeight={100}
                maxWidth={100}
                highlight={item.id === fileIdToPreview}
              />
            ))}
          </div>
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
          {isLoadingFiles && <SkeletonImageThumbnails />}
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
