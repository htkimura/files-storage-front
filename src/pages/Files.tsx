import pluralize from 'pluralize-esm'
import { Layout } from '@/components/layout/layout'
import { config, queryDefaultOptions } from '@/config'
import { useOverlay, useUser } from '@/contexts'
import {
  File,
  useDeleteBulkFilesByIds,
  useGetFileById,
  useMyFiles,
} from '@htkimura/files-storage-backend.rest-client'
import type { AxiosRequestConfig } from 'axios'
import {
  CloudUploadIcon,
  DownloadIcon,
  EllipsisVerticalIcon,
  Loader2,
  TrashIcon,
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { filesize } from 'filesize'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FC, useEffect, useRef, useState } from 'react'
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
import classNames from 'classnames'
import { useLottie } from 'lottie-react'
import cloudUploadingAnimation from '@/animations/cloud-uploading.json'
import { Button } from '@/components/ui/button'
import {
  UploadProgressPopup,
  type UploadRowState,
} from '@/components/upload/UploadProgressPopup'
import { uploadFileToStorage } from '@/lib/chunked-upload'
import toast from 'react-hot-toast'

const DragUploadAnimation = () => {
  const { View } = useLottie({
    animationData: cloudUploadingAnimation,
    loop: true,
    autoplay: true,
    style: {
      height: 130,
      width: '100%',
      maxWidth: 220,
      padding: 0,
      margin: 0,
    },
  })

  return <>{View}</>
}

export const Files = () => {
  const { token } = useUser()

  const [uploadItems, setUploadItems] = useState<UploadRowState[]>([])
  const [uploadCollapsed, setUploadCollapsed] = useState(false)
  const controllersRef = useRef(new Map<string, AbortController>())

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

  const handleCancelAllUploads = () => {
    controllersRef.current.forEach((ac) => ac.abort())
    controllersRef.current.clear()
    setUploadItems((prev) =>
      prev.map((i) =>
        i.status === 'uploading' || i.status === 'queued'
          ? { ...i, status: 'cancelled' }
          : i,
      ),
    )
  }

  const handleDismissUploadPanel = () => {
    controllersRef.current.forEach((ac) => ac.abort())
    controllersRef.current.clear()
    setUploadItems([])
  }

  const handleRemoveUploadItem = (id: string) => {
    setUploadItems((prev) => prev.filter((row) => row.id !== id))
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    noKeyboard: true,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length === 0) return
      const authHeaders = { Authorization: `Bearer ${token}` }

      const pairs = acceptedFiles.map((file) => ({
        file,
        row: {
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          progress: 0,
          status: 'uploading' as const,
        },
      }))

      setUploadCollapsed(false)
      setUploadItems((prev) => [...prev, ...pairs.map((p) => p.row)])

      for (const { file, row } of pairs) {
        const ac = new AbortController()
        controllersRef.current.set(row.id, ac)
        void (async () => {
          try {
            await uploadFileToStorage(file, config.apiBaseUrl, authHeaders, {
              signal: ac.signal,
              onProgress: (p) =>
                setUploadItems((prev) =>
                  prev.map((i) =>
                    i.id === row.id ? { ...i, progress: p } : i,
                  ),
                ),
            })
            setUploadItems((prev) =>
              prev.map((i) =>
                i.id === row.id
                  ? { ...i, status: 'complete', progress: 100 }
                  : i,
              ),
            )
            await refetch()
            toast.success(`Uploaded ${row.name}`)
          } catch (error) {
            if (ac.signal.aborted) {
              setUploadItems((prev) =>
                prev.map((i) =>
                  i.id === row.id ? { ...i, status: 'cancelled' } : i,
                ),
              )
            } else {
              console.error('[upload]', error)
              const message =
                error instanceof Error ? error.message : 'Upload failed'
              setUploadItems((prev) =>
                prev.map((i) =>
                  i.id === row.id
                    ? { ...i, status: 'error', errorMessage: message }
                    : i,
                ),
              )
              toast.error(message)
            }
          } finally {
            controllersRef.current.delete(row.id)
          }
        })()
      }
    },
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

        <button
          type="button"
          className={classNames(
            'group flex max-w-xl flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-200',
            'border-muted-foreground/20 bg-muted/30 text-muted-foreground',
            'hover:border-primary/35 hover:bg-primary/[0.04] hover:text-foreground',
            isDragActive
              ? 'min-h-44 border-primary bg-primary/[0.06] py-5 text-foreground'
              : 'h-44 px-6 py-8',
          )}
          {...getRootProps()}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <>
              <DragUploadAnimation />
              <span className="mt-2 text-sm font-medium text-foreground">
                Drop files to upload
              </span>
            </>
          ) : (
            <>
              <CloudUploadIcon className="mb-3 h-10 w-10 opacity-70 transition-opacity group-hover:opacity-100" />
              <span className="text-center text-sm font-medium text-foreground">
                Drag & drop files here
              </span>
              <span className="mt-1 text-center text-xs text-muted-foreground">
                or click to browse
              </span>
            </>
          )}
        </button>

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
  const [rowSelection, setRowSelection] = useState({}) // state object for table control
  const selectedFiles = Object.keys(rowSelection).map(
    (key) => files[Number(key)].id,
  ) // array of selected files ids

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <EllipsisVerticalIcon className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => handleDownload(row.original.id)}
            >
              <DownloadIcon />
              Download
            </DropdownMenuItem>

            <button
              className="w-full"
              onClick={() => {
                setFileToDelete(row.original)
                setOpenDeleteDialog(true)
              }}
            >
              <DropdownMenuItem className="cursor-pointer text-red-500">
                <TrashIcon className="text-red-500" />
                Delete
              </DropdownMenuItem>
            </button>
          </DropdownMenuContent>
        </DropdownMenu>
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
