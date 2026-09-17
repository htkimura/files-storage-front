import { config, queryDefaultOptions } from '@/config'
import { getApiErrorMessage } from '@/lib/api-error'
import { uploadFileToStorage } from '@/lib/chunked-upload'
import { UPLOAD_CONCURRENCY_LIMIT } from '@/lib/upload-concurrency'
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

interface PendingUpload {
  id: string
  file: File
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
  const pendingRef = useRef<PendingUpload[]>([])
  const activeCountRef = useRef(0)
  const tokenRef = useRef(token)
  const folderIdRef = useRef(folderId)
  const onUploadCompleteRef = useRef(onUploadComplete)

  tokenRef.current = token
  folderIdRef.current = folderId
  onUploadCompleteRef.current = onUploadComplete

  const updateRow = useCallback(
    (id: string, patch: Partial<UploadRowState>) => {
      setUploadItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      )
    },
    [],
  )

  const runUpload = useCallback(
    async (pending: PendingUpload) => {
      const currentToken = tokenRef.current
      if (!currentToken) {
        return
      }

      const authHeaders = { Authorization: `Bearer ${currentToken}` }
      const axiosConfig = {
        ...queryDefaultOptions.axios,
        headers: authHeaders,
      }

      const ac = new AbortController()
      controllersRef.current.set(pending.id, ac)

      updateRow(pending.id, { status: 'uploading', progress: 0 })

      try {
        const fileId = await uploadFileToStorage(
          pending.file,
          config.apiBaseUrl,
          authHeaders,
          {
            signal: ac.signal,
            onProgress: (progress) =>
              updateRow(pending.id, { progress }),
          },
        )

        const targetFolderId = folderIdRef.current
        if (targetFolderId) {
          await moveFileToFolder(fileId, { folderId: targetFolderId }, axiosConfig)
        }

        updateRow(pending.id, { status: 'complete', progress: 100 })
        await onUploadCompleteRef.current?.()
        toast.success(`Uploaded ${pending.file.name}`)
      } catch (error) {
        if (ac.signal.aborted) {
          updateRow(pending.id, { status: 'cancelled' })
        } else {
          console.error('[upload]', error)
          const message = getApiErrorMessage(error, 'Upload failed')
          updateRow(pending.id, { status: 'error', errorMessage: message })
          toast.error(message)
        }
      } finally {
        controllersRef.current.delete(pending.id)
      }
    },
    [updateRow],
  )

  const pumpQueueRef = useRef<() => void>(() => {})

  pumpQueueRef.current = () => {
    while (
      activeCountRef.current < UPLOAD_CONCURRENCY_LIMIT &&
      pendingRef.current.length > 0
    ) {
      const next = pendingRef.current.shift()
      if (!next) {
        return
      }

      activeCountRef.current += 1

      void runUpload(next).finally(() => {
        activeCountRef.current -= 1
        pumpQueueRef.current()
      })
    }
  }

  const pumpQueue = useCallback(() => {
    pumpQueueRef.current()
  }, [])

  const handleCancelAllUploads = useCallback(() => {
    pendingRef.current = []
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
    pendingRef.current = []
    controllersRef.current.forEach((ac) => ac.abort())
    controllersRef.current.clear()
    activeCountRef.current = 0
    setUploadItems([])
  }, [])

  const handleRemoveUploadItem = useCallback((id: string) => {
    setUploadItems((prev) => prev.filter((row) => row.id !== id))
  }, [])

  const uploadFiles = useCallback(
    (files: File[]) => {
      if (!token || files.length === 0) {
        return
      }

      const pairs = files.map((file) => ({
        file,
        row: {
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          progress: 0,
          status: 'queued' as const,
        },
      }))

      setUploadCollapsed(false)
      setUploadItems((prev) => [...prev, ...pairs.map((pair) => pair.row)])

      for (const pair of pairs) {
        pendingRef.current.push({ id: pair.row.id, file: pair.file })
      }

      pumpQueue()
    },
    [pumpQueue, token],
  )

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
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
    openFilePicker: open,
    handleCancelAllUploads,
    handleDismissUploadPanel,
    handleRemoveUploadItem,
  }
}
