import { Layout } from '@/components/layout/layout'
import { FilePreviewer } from '@/components/preview/FilePreviewer'
import { FilePreviewStripItem } from '@/components/preview/FilePreviewStripItem'
import { UploadProgressPopup } from '@/components/upload/UploadProgressPopup'
import { useOverlay, useUser } from '@/contexts'
import { useFilePreview } from '@/hooks/useFilePreview'
import { useFileUpload } from '@/hooks/useFileUpload'
import { cn } from '@/lib/utils'
import {
  type FileWithPresignedThumbnailUrl,
  type Folder,
  useDeleteBulkFilesByIds,
  useGetFileById,
  useMoveFileToFolder,
  useRenameFile,
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
import { DriveFileTileDragPreview } from './components/DriveFileTileDragPreview'
import { DriveFolderTileDragPreview } from './components/DriveFolderTileDragPreview'
import { FilesSection } from './components/FilesSection'
import { FoldersSection } from './components/FoldersSection'
import { RenameFileDialog } from './components/RenameFileDialog'
import { useDriveData } from './hooks/useDriveData'
import {
  parseDriveDropTargetFolderId,
  parseDriveFileDndId,
  parseDriveFolderDragDndId,
} from './components/dnd'

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
  const { token } = useUser()
  const { setContent } = useOverlay()
  const {
    clientAxiosConfig,
    folders,
    removeFolderFromView,
    allFiles,
    setAllFiles,
    foldersLoading,
    filesInitialLoading,
    filesFetching,
    hasMore,
    observerRef,
    refreshFiles,
  } = useDriveData(folderId)

  const {
    uploadItems,
    uploadCollapsed,
    setUploadCollapsed,
    getRootProps,
    getInputProps,
    isDragActive: isUploadDragActive,
    handleCancelAllUploads,
    handleDismissUploadPanel,
    handleRemoveUploadItem,
  } = useFileUpload({
    token,
    folderId,
    onUploadComplete: refreshFiles,
    noClick: true,
  })

  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)

  const {
    fileIdToPreview,
    activeFile,
    isLoadingActiveFile,
    openPreview,
    closePreview,
  } = useFilePreview()

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
            {allFiles.map((item) => (
              <FilePreviewStripItem
                key={item.id}
                file={item}
                onSelect={openPreview}
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
    allFiles,
    closePreview,
    fileIdToPreview,
    isLoadingActiveFile,
    openPreview,
    setContent,
  ])

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

  const [fileToRename, setFileToRename] =
    useState<FileWithPresignedThumbnailUrl | null>(null)
  const [openRenameDialog, setOpenRenameDialog] = useState(false)

  const { mutate: renameFile, isPending: isRenamingFile } = useRenameFile({
    axios: clientAxiosConfig,
  })

  const handleRenameOpenChange = (open: boolean) => {
    setOpenRenameDialog(open)
    if (!open) setFileToRename(null)
  }

  const handleRenameRequest = (file: FileWithPresignedThumbnailUrl) => {
    setFileToRename(file)
    setOpenRenameDialog(true)
  }

  const handleRenameConfirm = (name: string) => {
    if (!fileToRename) return

    renameFile(
      { id: fileToRename.id, data: { name } },
      {
        onSuccess: (response) => {
          const updatedName = response.data.name
          setAllFiles((prev) =>
            prev.map((file) =>
              file.id === fileToRename.id
                ? { ...file, name: updatedName }
                : file,
            ),
          )
          setOpenRenameDialog(false)
          toast.success('File renamed successfully')
        },
        onError: (error) => {
          const message =
            (error.response?.data as { message?: string } | undefined)
              ?.message || 'Could not rename file'
          toast.error(message)
        },
      },
    )
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
            removeFolderFromView(draggedFolderId)
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
    [folders, getDestinationName, removeFolderFromView, updateParentFolder],
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
        <div
          {...getRootProps({
            className: cn(
              'relative flex flex-col gap-10 p-6 md:p-8 md:pb-10',
              isUploadDragActive &&
                'rounded-xl bg-primary/[0.03] ring-2 ring-inset ring-primary/25',
            ),
          })}
        >
          <input {...getInputProps()} className="sr-only" tabIndex={-1} />

          {isUploadDragActive && (
            <div className="pointer-events-none absolute inset-x-6 top-6 z-10 flex justify-center md:inset-x-8 md:top-8">
              <span className="rounded-full border border-primary/30 bg-card/95 px-3 py-1 text-xs font-medium text-foreground shadow-sm">
                Drop to upload here
              </span>
            </div>
          )}

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

          <UploadProgressPopup
            items={uploadItems}
            collapsed={uploadCollapsed}
            onToggleCollapse={() => setUploadCollapsed((c) => !c)}
            onDismiss={handleDismissUploadPanel}
            onCancelAll={handleCancelAllUploads}
            onRemoveItem={handleRemoveUploadItem}
          />

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
            onPreview={openPreview}
            onRename={handleRenameRequest}
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

      <RenameFileDialog
        fileName={fileToRename?.name ?? null}
        open={openRenameDialog}
        onOpenChange={handleRenameOpenChange}
        onConfirm={handleRenameConfirm}
        isLoading={isRenamingFile}
      />
    </Layout>
  )
}
