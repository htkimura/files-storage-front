import { Layout } from '@/components/layout/layout'
import { queryDefaultOptions } from '@/config'
import { useUser } from '@/contexts'
import {
  type FileWithPresignedThumbnailUrl,
  useDeleteBulkFilesByIds,
  useGetFileById,
  useListMyFolders,
  useMyFiles,
} from '@htkimura/files-storage-backend.rest-client'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { DeleteFileDialog } from './components/DeleteFileDialog'
import { FilesSection } from './components/FilesSection'
import { FoldersSection } from './components/FoldersSection'

export const MyDrive = () => {
  const { token } = useUser()
  const clientAxiosConfig = {
    ...queryDefaultOptions.axios,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }

  const { data: foldersRes, isLoading: foldersLoading } = useListMyFolders({
    axios: clientAxiosConfig,
  })
  const folders = foldersRes?.data ?? []

  const [page, setPage] = useState(1)
  const size = 20
  const {
    data: filesDataRaw,
    isLoading: filesInitialLoading,
    isFetching: filesFetching,
  } = useMyFiles(
    { page, size, folderId: null },
    {
      axios: clientAxiosConfig,
    },
  )

  const filesPayload = filesDataRaw?.data
  const hasMore = filesPayload?.hasMore ?? false
  const [allFiles, setAllFiles] = useState<FileWithPresignedThumbnailUrl[]>([])

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

  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const { data: fileData } = useGetFileById(selectedFileId!, {
    query: {
      enabled: !!selectedFileId,
      queryKey: ['file', selectedFileId],
    },
    axios: clientAxiosConfig,
  })

  const handleDownload = (fileId: string) => {
    setSelectedFileId(fileId)
  }

  useEffect(() => {
    setSelectedFileId(null)
    if (!fileData) return

    void (async () => {
      const response = await fetch(fileData.data.presignedUrl)
      const blob = await response.blob()

      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = fileData.data.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    })()
  }, [fileData])

  const [fileToDelete, setFileToDelete] =
    useState<FileWithPresignedThumbnailUrl | null>(null)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)

  useEffect(() => {
    if (!openDeleteDialog) setFileToDelete(null)
  }, [openDeleteDialog])

  const { mutate: deleteBulkFiles, isPending: isDeletingFile } =
    useDeleteBulkFilesByIds({
      mutation: {
        onSuccess: () => {
          if (fileToDelete) {
            setAllFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id))
          }
          setOpenDeleteDialog(false)
          toast.success('File deleted successfully')
        },
        onError: (error: { response?: { data?: { message?: string } } }) => {
          toast.error(
            error.response?.data?.message || 'Error unexpected during deletion',
          )
        },
      },
      axios: clientAxiosConfig,
    })

  const handleDeleteRequest = (file: FileWithPresignedThumbnailUrl) => {
    setFileToDelete(file)
    setOpenDeleteDialog(true)
  }

  const handleDeleteConfirm = () => {
    if (!fileToDelete) return
    deleteBulkFiles({ params: { ids: [fileToDelete.id] } })
  }

  return (
    <Layout className="p-0">
      <div className="flex flex-col gap-10 p-6 md:p-8 md:pb-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            My Drive
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Folders and every file in your memory vault
          </p>
        </div>

        <FoldersSection folders={folders} isLoading={foldersLoading} />

        <FilesSection
          files={allFiles}
          isInitialLoading={filesInitialLoading}
          isFetching={filesFetching}
          hasMore={hasMore}
          observerRef={observerRef}
          onDownload={handleDownload}
          onDelete={handleDeleteRequest}
        />
      </div>

      <DeleteFileDialog
        fileName={fileToDelete?.name ?? null}
        open={openDeleteDialog}
        onOpenChange={setOpenDeleteDialog}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeletingFile}
      />
    </Layout>
  )
}
