import DocViewer, { DocViewerRenderers } from '@cyntler/react-doc-viewer'
import '@cyntler/react-doc-viewer/dist/index.css'
import {
  isImagePreviewFile,
  isPdfPreviewFile,
  toPreviewDocument,
} from '@/lib/filePreview'
import type { FileWithPresignedUrl } from '@htkimura/files-storage-backend.rest-client'
import { Loader2Icon, XIcon } from 'lucide-react'
import { type FC, type ReactNode, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'

interface FilePreviewerProps {
  file: FileWithPresignedUrl | null
  isLoading?: boolean
  onClose: () => void
  strip?: ReactNode
}

export const FilePreviewer: FC<FilePreviewerProps> = ({
  file,
  isLoading = false,
  onClose,
  strip,
}) => {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  const previewDocument = useMemo(
    () => (file ? toPreviewDocument(file) : null),
    [file],
  )

  const showImage = file ? isImagePreviewFile(file) : false
  const showPdf = file ? isPdfPreviewFile(file) : false

  const documentPanelClassName =
    'h-[min(75vh,calc(100vh-10rem))] w-full max-w-5xl overflow-hidden rounded-lg bg-background shadow-2xl'

  const layer = (
    <div className="fixed inset-0 z-[500] flex flex-col bg-gray-950/80">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-black/40 p-2 text-white transition-colors hover:bg-black/60"
        aria-label="Close preview"
      >
        <XIcon className="size-5" />
      </button>

      <div
        role="presentation"
        className="flex min-h-0 flex-1 items-center justify-center px-4 pb-4 pt-12"
        onClick={onClose}
      >
        {isLoading || !file ? (
          <div className="flex items-center justify-center text-white/80">
            <Loader2Icon className="size-10 animate-spin" aria-hidden />
            <span className="sr-only">Loading preview</span>
          </div>
        ) : showImage ? (
          <img
            key={file.id}
            src={file.presignedUrl}
            alt={file.name}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[calc(100vh-10rem)] max-w-[min(95vw,72rem)] w-auto h-auto object-contain shadow-2xl"
          />
        ) : showPdf ? (
          <iframe
            key={file.id}
            src={file.presignedUrl}
            title={file.name}
            onClick={(e) => e.stopPropagation()}
            className={documentPanelClassName}
          />
        ) : previewDocument ? (
          <div
            key={file.id}
            className={documentPanelClassName}
            onClick={(e) => e.stopPropagation()}
          >
            <DocViewer
              documents={[previewDocument]}
              activeDocument={previewDocument}
              pluginRenderers={DocViewerRenderers}
              prefetchMethod="GET"
              className="h-full"
              config={{
                header: { disableHeader: true },
                pdfVerticalScrollByDefault: true,
                noRenderer: {
                  overrideComponent: ({ fileName, document: doc }) => (
                    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                      <p className="text-sm text-muted-foreground">
                        Preview is not available for this file type.
                      </p>
                      {doc?.uri ? (
                        <a
                          href={doc.uri}
                          download={fileName}
                          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                        >
                          Download {fileName}
                        </a>
                      ) : null}
                    </div>
                  ),
                },
              }}
              theme={{
                primary: '#ffffff',
                secondary: '#f4f4f5',
                textPrimary: '#18181b',
                textSecondary: '#71717a',
              }}
            />
          </div>
        ) : null}
      </div>

      {strip ? (
        <div className="shrink-0 border-t border-white/10 bg-gray-900/90">
          {strip}
        </div>
      ) : null}
    </div>
  )

  if (typeof document === 'undefined') {
    return null
  }

  return createPortal(layer, document.body)
}
