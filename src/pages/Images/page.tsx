import { Layout } from '@/components/layout/layout'
import { queryDefaultOptions } from '@/config'
import { useOverlay, useUser } from '@/contexts'
import {
  FileWithPresignedUrl,
  useMyFiles,
} from '@htkimura/files-storage-backend.rest-client'
import { useEffect, useRef, useState } from 'react'
import ImageThumbnail from './components/ImageThumbnail'
import ImagePreviewer, { FetchedFiles } from './components/ImagePreviewer'
import { Skeleton } from '@/components/ui/skeleton'

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

  const [fileIdToPreview, setFileIdToPreview] = useState<string | null>(null)
  const [fetchedFiles, setFetchedFiles] = useState<FetchedFiles>({})

  const addFetchedFile = (file: FileWithPresignedUrl) => {
    const fileId = file.id
    setFetchedFiles((prev) => {
      if (prev[fileId]) return prev
      return { ...prev, [fileId]: file }
    })
    setFileIdToPreview(fileId)
  }

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
      <ImagePreviewer
        files={files}
        fetchedFiles={fetchedFiles}
        fileIdToPreview={fileIdToPreview}
        handleClose={() => setFileIdToPreview(null)}
        addFetchedFile={addFetchedFile}
        setFileIdToPreview={setFileIdToPreview}
      />,
    )

    return () => setContent(undefined)
  }, [fileIdToPreview, setContent, fetchedFiles, files])

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
              addFetchedFile={addFetchedFile}
              setFileIdToPreview={setFileIdToPreview}
              fileAlreadyFetched={!!fetchedFiles[file.id]}
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
  return Array.from({ length: 15 }).map(() => (
    <Skeleton className="h-[200px] w-[200px] rounded-xl" />
  ))
}
