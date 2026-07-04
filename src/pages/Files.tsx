import pluralize from 'pluralize-esm'
import { Layout } from '@/components/layout/layout'
import { queryDefaultOptions } from '@/config'
import { useOverlay, useUser } from '@/contexts'
import { useFileUpload } from '@/hooks/useFileUpload'
import {
  File,
  useDeleteBulkFilesByIds,
  useGetFileById,
  useMyFiles,
  useRenameFile,
} from '@htkimura/files-storage-backend.rest-client'
import type { AxiosRequestConfig } from 'axios'
import { Loader2, TrashIcon } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { filesize } from 'filesize'
import { FC, useEffect, useState } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { FileUploadDropzone } from '@/components/upload/FileUploadDropzone'
import { UploadProgressPopup } from '@/components/upload/UploadProgressPopup'
import toast from 'react-hot-toast'
import { FileItemActions } from '@/components/FileItemActions'
import { RenameFileDialog } from '@/pages/MyDrive/components/RenameFileDialog'

export const Files = () => {
  const { token } = useUser()

  const clientAxiosConfig = {
    ...queryDefaultOptions.axios,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }

  const [page, setPage] = useState(1)
  const size = 20

  const {
    data: filesDataRaw,
    refetch,
    isLoading: isLoadingFiles,
  } = useMyFiles(
    { page, size },
    {
      axios: clientAxiosConfig,
    },
  )

  const {
    uploadItems,
    uploadCollapsed,
    setUploadCollapsed,
    getRootProps,
    getInputProps,
    isDragActive,
    handleCancelAllUploads,
    handleDismissUploadPanel,
    handleRemoveUploadItem,
  } = useFileUpload({
    token,
    onUploadComplete: refetch,
  })

  const { data: filesData } = filesDataRaw || {}

  const files = filesData?.data || []

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
    if (fileData) {
      ;(async () => {
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
    }
  }, [fileData])

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1)
    }
  }

  const totalPages = filesData ? Math.max(filesData.total / size, 1) : 1

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1)
    }
  }

  return (
    <Layout className="p-0">
      <div className="flex flex-col gap-8 p-6 md:p-8 md:pb-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            All files
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload, download, and organize your documents
          </p>
        </div>

        <FileUploadDropzone
          getRootProps={getRootProps}
          getInputProps={getInputProps}
          isDragActive={isDragActive}
        />

        <UploadProgressPopup
          items={uploadItems}
          collapsed={uploadCollapsed}
          onToggleCollapse={() => setUploadCollapsed((c) => !c)}
          onDismiss={handleDismissUploadPanel}
          onCancelAll={handleCancelAllUploads}
          onRemoveItem={handleRemoveUploadItem}
        />

        <FilesTable
          files={files}
          refetch={refetch}
          clientAxiosConfig={clientAxiosConfig}
          handlePreviousPage={handlePreviousPage}
          handleNextPage={handleNextPage}
          handleDownload={handleDownload}
          isLoading={isLoadingFiles}
          totalPages={totalPages}
          page={page}
          size={size}
          setPage={setPage}
        />
      </div>
    </Layout>
  )
}

interface FilesTableProps {
  files: File[]
  isLoading: boolean
  refetch: () => void
  clientAxiosConfig: AxiosRequestConfig<any>
  handlePreviousPage: () => void
  handleNextPage: () => void
  handleDownload: (fileId: string) => void
  totalPages: number
  page: number
  size: number
  setPage: (page: number) => void
}

const FilesTable: FC<FilesTableProps> = ({
  files,
  isLoading,
  refetch,
  clientAxiosConfig,
  handlePreviousPage,
  handleNextPage,
  handleDownload,
  totalPages,
  page,
  size,
  setPage,
}) => {
  const { setContent } = useOverlay()
  const [fileToDelete, setFileToDelete] = useState<File | null>(null) // saves the file to be deleted when clicked in a table line dropdown
  const [fileToRename, setFileToRename] = useState<File | null>(null)
  const [rowSelection, setRowSelection] = useState({}) // state object for table control
  const selectedFiles = Object.keys(rowSelection).map(
    (key) => files[Number(key)].id,
  ) // array of selected files ids

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [openRenameDialog, setOpenRenameDialog] = useState(false)

  useEffect(() => {
    if (!openDeleteDialog) setFileToDelete(null)
  }, [openDeleteDialog])

  const { mutate: deleteBulkFiles, isPending: isDeletingFiles } =
    useDeleteBulkFilesByIds({
      mutation: {
        onSuccess: () => {
          refetch()
          setOpenDeleteDialog(false)
          if (!fileToDelete) setRowSelection({})
          toast.success(
            `${pluralize('File', fileToDelete ? 1 : selectedFiles.length, true)} deleted successfully`,
          )
        },
        onError: (error: any) => {
          toast.error(
            error.response?.data?.message || 'Error unexpected during deletion',
          )
        },
      },
      axios: clientAxiosConfig,
    })

  const { mutate: renameFile, isPending: isRenamingFile } = useRenameFile({
    axios: clientAxiosConfig,
  })

  const handleRenameOpenChange = (open: boolean) => {
    setOpenRenameDialog(open)
    if (!open) setFileToRename(null)
  }

  const handleRenameConfirm = (name: string) => {
    if (!fileToRename) return

    renameFile(
      { id: fileToRename.id, data: { name } },
      {
        onSuccess: () => {
          refetch()
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

  const rowSelectionKeys = Object.keys(rowSelection)

  const headerCheckboxChecked =
    rowSelectionKeys.length === files.length ||
    (rowSelectionKeys.length > 0 && 'indeterminate')

  const columns: ColumnDef<File>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={headerCheckboxChecked}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <div>{row.getValue('name')}</div>,
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => <div>{row.getValue('type')}</div>,
    },
    {
      accessorKey: 'size',
      header: 'Size',
      cell: ({ row }) => <div>{filesize(row.getValue('size'))}</div>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Uploaded at',
      cell: ({ row }) => (
        <div>{new Date(row.getValue('createdAt')).toLocaleString()}</div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <FileItemActions
          name={row.original.name}
          menuAlign="start"
          onDownload={() => handleDownload(row.original.id)}
          onRename={() => {
            setFileToRename(row.original)
            setOpenRenameDialog(true)
          }}
          onDelete={() => {
            setFileToDelete(row.original)
            setOpenDeleteDialog(true)
          }}
        />
      ),
    },
  ]

  const table = useReactTable({
    data: files,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
    state: {
      pagination: {
        pageIndex: page - 1,
        pageSize: size,
      },
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
  })

  const handleUnselectAll = () => {
    setRowSelection({})
  }

  const handleSelectAll = () => {
    setRowSelection(
      files.reduce(
        (acc, _, index) => {
          acc[index] = true
          return acc
        },
        {} as Record<string, boolean>,
      ),
    )
  }

  const handleDelete = async () => {
    deleteBulkFiles({
      params: { ids: fileToDelete ? [fileToDelete.id] : selectedFiles },
    })
  }

  useEffect(() => {
    if (selectedFiles.length === 0) return setContent(undefined)

    setContent(
      <div className="fixed bottom-6 left-1/2 z-[280] flex -translate-x-1/2 items-center gap-3 rounded-full border border-border bg-card/95 px-4 py-2.5 shadow-lg backdrop-blur-sm">
        <Checkbox
          id="bulk-actions-checkbox"
          checked={headerCheckboxChecked}
          onCheckedChange={
            headerCheckboxChecked === 'indeterminate'
              ? handleSelectAll
              : handleUnselectAll
          }
        />
        <label
          htmlFor="bulk-actions-checkbox"
          className="cursor-pointer text-sm font-medium text-foreground"
        >
          Selected ({selectedFiles.length})
        </label>
        <span className="text-border text-lg leading-none">|</span>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
          onClick={() => setOpenDeleteDialog(true)}
        >
          <TrashIcon width={18} />
          Delete
        </button>
      </div>,
    )
  }, [selectedFiles.length])

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-border/80 bg-muted/40 hover:bg-muted/40"
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isLoading ? (
              <TableRow>
                <TableCell>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              </TableRow>
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {!isLoading && files.length > 0 && (
          <div className="py-2">
            <Pagination>
              <PaginationContent>
                <PaginationItem
                  className={page > 1 ? 'cursor-pointer' : 'cursor-default'}
                >
                  <PaginationPrevious onClick={handlePreviousPage} />
                </PaginationItem>
                {Array.from({
                  length: totalPages,
                }).map((_, index) => {
                  const currentPage = index + 1
                  const isActive = page === currentPage
                  return (
                    <PaginationItem key={index}>
                      <PaginationLink
                        className={
                          !isActive ? 'cursor-pointer' : 'cursor-default'
                        }
                        isActive={isActive}
                        onClick={() => setPage(currentPage)}
                      >
                        {currentPage}
                      </PaginationLink>
                    </PaginationItem>
                  )
                })}
                <PaginationItem
                  className={
                    page < totalPages ? 'cursor-pointer' : 'cursor-default'
                  }
                >
                  <PaginationNext onClick={handleNextPage} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
      {(selectedFiles.length > 0 || fileToDelete) && openDeleteDialog && (
        <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
          <DeleteDialogContent
            files={
              fileToDelete
                ? [fileToDelete]
                : files.filter((file) => selectedFiles.includes(file.id))
            }
            onDelete={handleDelete}
            isLoading={isDeletingFiles}
          />
        </Dialog>
      )}

      <RenameFileDialog
        fileName={fileToRename?.name ?? null}
        open={openRenameDialog}
        onOpenChange={handleRenameOpenChange}
        onConfirm={handleRenameConfirm}
        isLoading={isRenamingFile}
      />
    </>
  )
}

interface DeleteDialogProps {
  files: File[]
  onDelete: () => void
  isLoading: boolean
}
const DeleteDialogContent: FC<DeleteDialogProps> = ({
  files,
  onDelete,
  isLoading,
}) => {
  const isSingleFile = files.length === 1
  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Delete {pluralize('file', files.length)}</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete&nbsp;
          {isSingleFile && <b>{files[0].name}&nbsp;</b>}
          {pluralize('file', files.length, !isSingleFile)}?
        </DialogDescription>
      </DialogHeader>

      <DialogFooter>
        <DialogClose asChild disabled={isLoading}>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button
          type="submit"
          variant="destructive"
          onClick={onDelete}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="animate-spin" /> : <TrashIcon />}
          Delete{isLoading && 'ing'}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
