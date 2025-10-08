import pluralize from 'pluralize-esm'
import { Layout } from '@/components/layout/layout'
import { config, queryDefaultOptions } from '@/config'
import { useUser } from '@/contexts'
import {
  File,
  useDeleteBulkFilesByIds,
  useGetFileById,
  useMyFiles,
} from '@htkimura/files-storage-backend.rest-client'
import axios, { AxiosRequestConfig } from 'axios'
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
import classNames from 'classnames'
import { useLottie } from 'lottie-react'
import cloudUploadingAnimation from '@/animations/cloud-uploading.json'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

const UploadingAnimation = () => {
  const { View } = useLottie({
    animationData: cloudUploadingAnimation,
    loop: true,
    autoplay: true,
    style: {
      height: 150,
      padding: 0,
      margin: 0,
    },
  })

  return <>{View}</>
}

export const Home = () => {
  const { token } = useUser()

  const [isUploading, setIsUploading] = useState(false)

  const clientAxiosConfig = {
    ...queryDefaultOptions.axios,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    noKeyboard: true,
    onDrop: async (acceptedFiles) => {
      acceptedFiles.forEach(async (file) => {
        setIsUploading(true)
        try {
          const { data } = await axios.get(
            config.apiBaseUrl + '/uploads/presigned-url',
            {
              params: {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
              },
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          )

          const { presignedUploadUrl } = data

          await axios.put(presignedUploadUrl, file, {
            headers: {
              'Content-Type': file.type,
            },
          })

          await refetch()
        } catch (error) {
          console.error('[error]', error)
        } finally {
          setIsUploading(false)
        }
      })
    },
  })

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
    <Layout>
      <button
        className={classNames(
          'border-2 border-dashed max-w-xl  flex items-center justify-center flex-col m-auto mt-10 hover:border-orange-500 hover:bg-orange-50 transition-all duration-75 w-full h-44',
          {
            'border-orange-500 bg-orange-50': isDragActive || isUploading,
            'p-10': !isUploading,
          },
        )}
        {...getRootProps()}
      >
        {isUploading ? (
          <UploadingAnimation />
        ) : (
          <>
            <input {...getInputProps()} />
            <CloudUploadIcon />

            <span>
              {isDragActive
                ? 'Nice! Drop your file to start uploading it'
                : 'Drag & Drop files or click to choose files'}
            </span>
          </>
        )}
      </button>
      <div className="mt-10 p-10">
        <h1>All files</h1>
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
          <DropdownMenuTrigger>
            <EllipsisVerticalIcon />
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

  const handleDelete = async () =>
    deleteBulkFiles({
      params: { ids: fileToDelete ? [fileToDelete.id] : selectedFiles },
    })

  return (
    <>
      <div className="rounded-md border">
        {selectedFiles.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10 bg-white px-4 py-3 rounded-lg shadow-lg border-2 z-10 gap-2 flex  items-center">
            <Checkbox
              id="bulk-actions-checkbox"
              checked={headerCheckboxChecked}
              onCheckedChange={
                headerCheckboxChecked === 'indeterminate'
                  ? handleSelectAll
                  : handleUnselectAll
              }
            />
            <label htmlFor="bulk-actions-checkbox" className="cursor-pointer">
              Selected ({selectedFiles.length})
            </label>
            |
            <button
              className="text-red-500 flex items-center gap-1"
              onClick={() => setOpenDeleteDialog(true)}
            >
              <TrashIcon width={18} />
              Delete
            </button>
          </div>
        )}
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
                  className="w-fit"
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
          className="bg-red-500 hover:bg-red-700"
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
