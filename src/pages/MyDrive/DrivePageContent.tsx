import { Layout } from '@/components/layout/layout'
import { cn } from '@/lib/utils'
import {
  type FileWithPresignedThumbnailUrl,
  type Folder,
  useDeleteBulkFilesByIds,
  useGetFileById,
  useMoveFileToFolder,
  useUpdateParentFolder,
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
  parseDriveFolderDragDndId,
} from './components/dnd'
import { DriveFileTileDragPreview } from './components/DriveFileTileDragPreview'
import { DriveFolderTileDragPreview } from './components/DriveFolderTileDragPreview'
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

type ActiveDragItem =
  | { type: 'file'; item: FileWithPresignedThumbnailUrl }
  | { type: 'folder'; item: Folder }

export const DrivePageContent = ({
  folderId,
  title,
  description,
  breadcrumbs = [],
}: DrivePageContentProps) => {
  const {
    clientAxiosConfig,
    folders,
    setAllFolders,
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

  const [activeDrag, setActiveDrag] = useState<ActiveDragItem | null>(null)
  const [movingFileId, setMovingFileId] = useState<string | null>(null)
  const [movingFolderId, setMovingFolderId] = useState<string | null>(null)

  const { mutate: moveFileToFolder } = useMoveFileToFolder({
    axios: clientAxiosConfig,
  })

  const { mutate: updateParentFolder } = useUpdateParentFolder({
    axios: clientAxiosConfig,
  })

  const isMoving = Boolean(movingFileId || movingFolderId)
  const isDragging = Boolean(activeDrag)

  const getDestinationName = useCallback(
    (targetFolderId: string | null) => {
      if (targetFolderId === null) return 'My Drive'
      return (
        folders.find((item) => item.id === targetFolderId)?.name ??
        breadcrumbs.find((item) => item.dropFolderId === targetFolderId)
          ?.label ??
        'folder'
      )
    },
    [breadcrumbs, folders],
  )

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const fileId = parseDriveFileDndId(event.active.id)
      if (fileId) {
        const file = allFiles.find((item) => item.id === fileId)
        if (file) setActiveDrag({ type: 'file', item: file })
        return
      }

      const folderId = parseDriveFolderDragDndId(event.active.id)
      if (folderId) {
        const folder = folders.find((item) => item.id === folderId)
        if (folder) setActiveDrag({ type: 'folder', item: folder })
      }
    },
    [allFiles, folders],
  )

  const handleMoveFile = useCallback(
    (fileId: string, targetFolderId: string | null) => {
      const file = allFiles.find((item) => item.id === fileId)
      if (!file) return

      const currentFolderId = file.folderId ?? null
      if (currentFolderId === targetFolderId) return

      const destinationName = getDestinationName(targetFolderId)

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
    [allFiles, getDestinationName, moveFileToFolder, setAllFiles],
  )

  const handleMoveFolder = useCallback(
    (draggedFolderId: string, targetFolderId: string | null) => {
      const folder = folders.find((item) => item.id === draggedFolderId)
      if (!folder) return

      if (draggedFolderId === targetFolderId) return

      const currentParentFolderId = folder.parentFolderId ?? null
      if (currentParentFolderId === targetFolderId) return

      const destinationName = getDestinationName(targetFolderId)

      setMovingFolderId(draggedFolderId)

      updateParentFolder(
        { id: draggedFolderId, data: { parentFolderId: targetFolderId } },
        {
          onSuccess: () => {
            setAllFolders((prev) =>
              prev.filter((item) => item.id !== draggedFolderId),
            )
            toast.success(`Moved "${folder.name}" to "${destinationName}"`)
          },
          onError: (error) => {
            const message =
              (error.response?.data as { message?: string } | undefined)
                ?.message || 'Could not move folder'
            toast.error(message)
          },
          onSettled: () => {
            setMovingFolderId(null)
          },
        },
      )
    },
    [folders, getDestinationName, setAllFolders, updateParentFolder],
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDrag(null)

      const overId = event.over?.id
      if (overId === undefined || isMoving) return

      const targetFolderId = parseDriveDropTargetFolderId(overId)
      if (targetFolderId === undefined) return

      const fileId = parseDriveFileDndId(event.active.id)
      if (fileId) {
        handleMoveFile(fileId, targetFolderId)
        return
      }

      const draggedFolderId = parseDriveFolderDragDndId(event.active.id)
      if (draggedFolderId) {
        handleMoveFolder(draggedFolderId, targetFolderId)
      }
    },
    [handleMoveFile, handleMoveFolder, isMoving],
  )

  const handleDragCancel = useCallback(() => {
    setActiveDrag(null)
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
                  isDragging && 'rounded-lg bg-muted/40 px-2 py-1.5',
                )}
              >
                {breadcrumbs.map((crumb, index) => (
                  <span key={crumb.to} className="flex items-center gap-1">
                    {index > 0 && (
                      <ChevronRightIcon
                        className={cn(
                          'size-3.5 shrink-0',
                          isDragging && 'text-primary/50',
                        )}
                      />
                    )}
                    <DriveBreadcrumbItem
                      label={crumb.label}
                      to={crumb.to}
                      dropFolderId={crumb.dropFolderId}
                      isDragging={isDragging}
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

          <FoldersSection
            folders={folders}
            isLoading={foldersLoading}
            movingFolderId={movingFolderId}
            isDragActive={isDragging}
          />

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
          {activeDrag?.type === 'file' ? (
            <DriveFileTileDragPreview file={activeDrag.item} />
          ) : activeDrag?.type === 'folder' ? (
            <DriveFolderTileDragPreview folder={activeDrag.item} />
          ) : null}
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
