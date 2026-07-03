import { Layout } from '@/components/layout/layout'
import { queryDefaultOptions } from '@/config'
import { useUser } from '@/contexts'
import {
  type FileWithPresignedThumbnailUrl,
  useDeleteBulkFilesByIds,
  useGetFileById,
  useListMyFolders,
  useMoveFileToFolder,
  useMyFiles,
} from '@htkimura/files-storage-backend.rest-client'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { DeleteFileDialog } from './components/DeleteFileDialog'
import { parseDriveFileDndId, parseDriveFolderDndId } from './components/dnd'
import { DriveFileTileDragPreview } from './components/DriveFileTileDragPreview'
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

  const [activeFile, setActiveFile] =
    useState<FileWithPresignedThumbnailUrl | null>(null)
  const [movingFileId, setMovingFileId] = useState<string | null>(null)

  const { mutate: moveFileToFolder } = useMoveFileToFolder({
    axios: clientAxiosConfig,
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const fileId = parseDriveFileDndId(event.active.id)
      if (!fileId) return

      const file = allFiles.find((item) => item.id === fileId)
      if (file) setActiveFile(file)
    },
    [allFiles],
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveFile(null)

      const fileId = parseDriveFileDndId(event.active.id)
      const folderId = event.over ? parseDriveFolderDndId(event.over.id) : null

      if (!fileId || !folderId || movingFileId) return

      const folder = folders.find((item) => item.id === folderId)
      const file = allFiles.find((item) => item.id === fileId)

      if (!folder || !file) return

      setMovingFileId(fileId)

      moveFileToFolder(
        { id: fileId, data: { folderId } },
        {
          onSuccess: () => {
            setAllFiles((prev) => prev.filter((item) => item.id !== fileId))
            toast.success(`Moved "${file.name}" to "${folder.name}"`)
          },
          onError: (error) => {
            const message =
              (error.response?.data as { message?: string } | undefined)
                ?.message || 'Could not move file to folder'
            toast.error(message)
          },
          onSettled: () => {
            setMovingFileId(null)
          },
        },
      )
    },
    [allFiles, folders, moveFileToFolder, movingFileId],
  )

  const handleDragCancel = useCallback(() => {
    setActiveFile(null)
  }, [])

  return (
    <Layout className="p-0">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex flex-col gap-10 p-6 md:p-8 md:pb-10">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              My Drive
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Folders and every file in your memory vault. Drag files onto a
              folder to move them.
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
            movingFileId={movingFileId}
          />
        </div>

        <DragOverlay dropAnimation={null}>
          {activeFile ? <DriveFileTileDragPreview file={activeFile} /> : null}
        </DragOverlay>
      </DndContext>

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
