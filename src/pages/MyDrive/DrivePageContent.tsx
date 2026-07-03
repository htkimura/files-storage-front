import { Layout } from '@/components/layout/layout'
import { cn } from '@/lib/utils'
import {
  type FileWithPresignedThumbnailUrl,
  useDeleteBulkFilesByIds,
  useGetFileById,
  useMoveFileToFolder,
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
import { ChevronRightIcon } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { DeleteFileDialog } from './components/DeleteFileDialog'
import { DriveBreadcrumbItem } from './components/DriveBreadcrumbItem'
import {
  parseDriveDropTargetFolderId,
  parseDriveFileDndId,
} from './components/dnd'
import { DriveFileTileDragPreview } from './components/DriveFileTileDragPreview'
import { FilesSection } from './components/FilesSection'
import { FoldersSection } from './components/FoldersSection'
import { useDriveData } from './hooks/useDriveData'

export interface DriveBreadcrumb {
  label: string
  to: string
  dropFolderId: string | null
}

interface DrivePageContentProps {
  folderId: string | null
  title: string
  description: string
  breadcrumbs?: DriveBreadcrumb[]
}

export const DrivePageContent = ({
  folderId,
  title,
  description,
  breadcrumbs = [],
}: DrivePageContentProps) => {
  const {
    clientAxiosConfig,
    folders,
    allFiles,
    setAllFiles,
    foldersLoading,
    filesInitialLoading,
    filesFetching,
    hasMore,
    observerRef,
  } = useDriveData(folderId)

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
      const overId = event.over?.id

      if (!fileId || overId === undefined || movingFileId) return

      const targetFolderId = parseDriveDropTargetFolderId(overId)
      if (targetFolderId === undefined) return

      const file = allFiles.find((item) => item.id === fileId)
      if (!file) return

      const currentFolderId = file.folderId ?? null
      if (currentFolderId === targetFolderId) return

      const destinationName =
        targetFolderId === null
          ? 'My Drive'
          : (folders.find((item) => item.id === targetFolderId)?.name ??
            breadcrumbs.find((item) => item.dropFolderId === targetFolderId)
              ?.label ??
            'folder')

      setMovingFileId(fileId)

      moveFileToFolder(
        { id: fileId, data: { folderId: targetFolderId } },
        {
          onSuccess: () => {
            setAllFiles((prev) => prev.filter((item) => item.id !== fileId))
            toast.success(`Moved "${file.name}" to "${destinationName}"`)
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
    [
      allFiles,
      breadcrumbs,
      folders,
      moveFileToFolder,
      movingFileId,
      setAllFiles,
    ],
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
            {breadcrumbs.length > 0 && (
              <nav
                aria-label="Breadcrumb"
                className={cn(
                  'mb-2 flex flex-wrap items-center gap-1 text-sm text-muted-foreground transition-colors',
                  activeFile && 'rounded-lg bg-muted/40 px-2 py-1.5',
                )}
              >
                {breadcrumbs.map((crumb, index) => (
                  <span key={crumb.to} className="flex items-center gap-1">
                    {index > 0 && (
                      <ChevronRightIcon
                        className={cn(
                          'size-3.5 shrink-0',
                          activeFile && 'text-primary/50',
                        )}
                      />
                    )}
                    <DriveBreadcrumbItem
                      label={crumb.label}
                      to={crumb.to}
                      dropFolderId={crumb.dropFolderId}
                      isDraggingFile={Boolean(activeFile)}
                    />
                  </span>
                ))}
              </nav>
            )}
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              {title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
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
