import { Layout } from '@/components/layout/layout'
import { config, queryDefaultOptions } from '@/config'
import { useUser } from '@/contexts'
import {
  File,
  useDeleteFileById,
  useGetFileById,
  useMyFiles,
} from '@htkimura/files-storage-backend.rest-client'
import axios, { AxiosRequestConfig } from 'axios'
import {
  CloudUploadIcon,
  DownloadIcon,
  EllipsisVerticalIcon,
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

  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  const { data: fileData } = useGetFileById(selectedFile!, {
    query: {
      enabled: !!selectedFile,
      queryKey: ['file', selectedFile],
    },
    axios: clientAxiosConfig,
  })

  const handleDownload = (fileId: string) => {
    setSelectedFile(fileId)
  }

  useEffect(() => {
    setSelectedFile(null)
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
  const { mutate: deleteFile } = useDeleteFileById({
    mutation: {
      onSuccess: () => {
        refetch()
      },
    },
    axios: clientAxiosConfig,
  })

  const handleDelete = (fileId: string) => {
    deleteFile({ id: fileId })
  }

  const columns: ColumnDef<File>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
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
            <DropdownMenuItem
              className="cursor-pointer text-red-500"
              onClick={() => handleDelete(row.original.id)}
            >
              <TrashIcon className="text-red-500" />
              Delete
            </DropdownMenuItem>
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
    },
  })

  return (
    <div className="rounded-md border">
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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
              <TableCell colSpan={columns.length} className="h-24 text-center">
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
  )
}
