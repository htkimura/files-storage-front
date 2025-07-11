import { Layout } from '@/components/layout/layout'
import { config, queryDefaultOptions } from '@/config'
import { useUser } from '@/contexts'
import {
  useGetFileById,
  useMyFiles,
} from '@htkimura/files-storage-backend.rest-client'
import axios from 'axios'
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
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { filesize } from 'filesize'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useEffect, useState } from 'react'

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import classNames from 'classnames'

export const Home = () => {
  const { token } = useUser()
  const { getRootProps, getInputProps } = useDropzone({
    noKeyboard: true,
    onDrop: async (acceptedFiles) => {
      acceptedFiles.forEach(async (file) => {
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

          const { url } = data

          await axios.put(url, file, {
            headers: {
              'Content-Type': file.type,
            },
          })

          await refetch()
        } catch (error) {
          console.error('[error]', error)
        }
      })
    },
  })

  const [page, setPage] = useState(1)
  const size = 20

  const { data: filesDataRaw, refetch } = useMyFiles(
    { page, size },
    {
      axios: {
        ...queryDefaultOptions.axios,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
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
    axios: {
      ...queryDefaultOptions.axios,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  })

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

  const handleDownload = (fileId: string) => {
    setSelectedFile(fileId)
  }

  const totalPages = filesData ? Math.max(filesData.total / size, 1) : 1

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1)
    }
  }
  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1)
    }
  }

  return (
    <Layout>
      <button
        className="border-2 border-dashed max-w-xl  p-10 flex items-center justify-center flex-col m-auto mt-10 hover:border-orange-500 hover:bg-orange-50 transition-all duration-75"
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon />
        <span>Drag & Drop files or click to choose files</span>
      </button>
      <div className="mt-10 p-10">
        <h1>All files</h1>

        <Table>
          <TableCaption>
            No {filesData?.data.length === 0 ? '' : 'more'} files to load.
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Uploaded at</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.id}>
                <TableCell className="font-medium">{file.name}</TableCell>
                <TableCell>{file.type}</TableCell>
                <TableCell>{filesize(file.size)}</TableCell>
                <TableCell>
                  {new Date(file.createdAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <EllipsisVerticalIcon />
                    </DropdownMenuTrigger>

                    <DropdownMenuContent className="w-56" align="start">
                      <DropdownMenuItem onClick={() => handleDownload(file.id)}>
                        <DownloadIcon />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(file.id)}>
                        <TrashIcon />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <Pagination>
              <PaginationContent>
                <PaginationItem
                  className={classNames({
                    'cursor-pointer': page > 1,
                  })}
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
                        className={classNames({
                          'cursor-pointer': !isActive,
                        })}
                        isActive={isActive}
                        onClick={() => setPage(currentPage)}
                      >
                        {currentPage}
                      </PaginationLink>
                    </PaginationItem>
                  )
                })}
                <PaginationItem
                  className={classNames({
                    'cursor-pointer': page !== totalPages,
                  })}
                >
                  <PaginationNext onClick={handleNextPage} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </TableFooter>
        </Table>
      </div>
    </Layout>
  )
}
