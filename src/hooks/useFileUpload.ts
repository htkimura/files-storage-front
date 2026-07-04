import { config, queryDefaultOptions } from '@/config'
import { uploadFileToStorage } from '@/lib/chunked-upload'
import { moveFileToFolder } from '@htkimura/files-storage-backend.rest-client'
import { useCallback, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import type { UploadRowState } from '@/components/upload/UploadProgressPopup'

interface UseFileUploadOptions {
  token: string | null | undefined
  folderId?: string | null
  onUploadComplete?: () => void | Promise<unknown>
  /** When true, only drag-and-drop uploads — clicks won't open the file picker. */
  noClick?: boolean
}

export const useFileUpload = ({
  token,
  folderId = null,
  onUploadComplete,
  noClick = false,
}: UseFileUploadOptions) => {
  const [uploadItems, setUploadItems] = useState<UploadRowState[]>([])
  const [uploadCollapsed, setUploadCollapsed] = useState(false)
  const controllersRef = useRef(new Map<string, AbortController>())

  const handleCancelAllUploads = useCallback(() => {
    controllersRef.current.forEach((ac) => ac.abort())
    controllersRef.current.clear()
    setUploadItems((prev) =>
      prev.map((item) =>
        item.status === 'uploading' || item.status === 'queued'
          ? { ...item, status: 'cancelled' }
          : item,
      ),
    )
  }, [])

  const handleDismissUploadPanel = useCallback(() => {
    controllersRef.current.forEach((ac) => ac.abort())
    controllersRef.current.clear()
    setUploadItems([])
  }, [])

  const handleRemoveUploadItem = useCallback((id: string) => {
    setUploadItems((prev) => prev.filter((row) => row.id !== id))
  }, [])

  const uploadFiles = useCallback(
    (files: File[]) => {
      if (!token || files.length === 0) return

      const authHeaders = { Authorization: `Bearer ${token}` }
      const axiosConfig = {
        ...queryDefaultOptions.axios,
        headers: authHeaders,
      }

      const pairs = files.map((file) => ({
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
      setUploadItems((prev) => [...prev, ...pairs.map((pair) => pair.row)])

      for (const { file, row } of pairs) {
        const ac = new AbortController()
        controllersRef.current.set(row.id, ac)
        void (async () => {
          try {
            const fileId = await uploadFileToStorage(
              file,
              config.apiBaseUrl,
              authHeaders,
              {
                signal: ac.signal,
                onProgress: (progress) =>
                  setUploadItems((prev) =>
                    prev.map((item) =>
                      item.id === row.id ? { ...item, progress } : item,
                    ),
                  ),
              },
            )

            if (folderId) {
              await moveFileToFolder(fileId, { folderId }, axiosConfig)
            }

            setUploadItems((prev) =>
              prev.map((item) =>
                item.id === row.id
                  ? { ...item, status: 'complete', progress: 100 }
                  : item,
              ),
            )
            await onUploadComplete?.()
            toast.success(`Uploaded ${row.name}`)
          } catch (error) {
            if (ac.signal.aborted) {
              setUploadItems((prev) =>
                prev.map((item) =>
                  item.id === row.id ? { ...item, status: 'cancelled' } : item,
                ),
              )
            } else {
              console.error('[upload]', error)
              const message =
                error instanceof Error ? error.message : 'Upload failed'
              setUploadItems((prev) =>
                prev.map((item) =>
                  item.id === row.id
                    ? { ...item, status: 'error', errorMessage: message }
                    : item,
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
    [folderId, onUploadComplete, token],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    noKeyboard: true,
    noClick,
    disabled: !token,
    onDrop: (acceptedFiles) => {
      uploadFiles(acceptedFiles)
    },
  })

  return {
    uploadItems,
    uploadCollapsed,
    setUploadCollapsed,
    getRootProps,
    getInputProps,
    isDragActive,
    handleCancelAllUploads,
    handleDismissUploadPanel,
    handleRemoveUploadItem,
  }
}
