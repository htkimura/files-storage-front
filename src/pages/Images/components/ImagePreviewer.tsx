import {
  FileWithPresignedThumbnailUrl,
  FileWithPresignedUrl,
} from '@htkimura/files-storage-backend.rest-client'
import { FC, useEffect } from 'react'
import { createPortal } from 'react-dom'
import ImageThumbnail from './ImageThumbnail'

export type FetchedFiles = Record<string, FileWithPresignedUrl>

interface ImagePreviewerProps {
  files: FileWithPresignedThumbnailUrl[]
  fetchedFiles: FetchedFiles
  fileIdToPreview: string
  handleClose: () => void
  addFetchedFile: (file: FileWithPresignedUrl) => void
  setFileIdToPreview: (fileId: string) => void
}

const ImagePreviewer: FC<ImagePreviewerProps> = ({
  files,
  fetchedFiles,
  fileIdToPreview,
  handleClose,
  addFetchedFile,
  setFileIdToPreview,
}) => {
  useEffect(() => {
    document.body.style.overflow = fileIdToPreview ? 'hidden' : 'auto'
  }, [fileIdToPreview])
  const file = fetchedFiles[fileIdToPreview]
  if (!file) return null

  const layer = (
    <div
      role="presentation"
      onClick={handleClose}
      className="fixed inset-0 z-[500] flex items-center justify-center bg-gray-950/50"
    >
      <img
        src={file.presignedUrl}
        alt={file.name}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[70vh] shadow-2xl"
      />
      <div className="absolute inset-x-0 bottom-0 flex justify-center pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]">
        <AllImagesPreviewer
          addFetchedFile={addFetchedFile}
          setFileIdToPreview={setFileIdToPreview}
          files={files}
          fetchedFiles={fetchedFiles}
          fileIdToPreview={fileIdToPreview}
        />
      </div>
    </div>
  )

  if (typeof document === 'undefined') {
    return null
  }

  return createPortal(layer, document.body)
}

export default ImagePreviewer

interface AllImagesPreviewerProps {
  files: FileWithPresignedThumbnailUrl[]
  fetchedFiles: FetchedFiles
  addFetchedFile: (file: FileWithPresignedUrl) => void
  fileIdToPreview: string
  setFileIdToPreview: (fileId: string) => void
}
const AllImagesPreviewer: FC<AllImagesPreviewerProps> = ({
  files,
  fetchedFiles,
  addFetchedFile,
  fileIdToPreview,
  setFileIdToPreview,
}) => {
  return (
    <div className="flex gap-2 overflow-x-auto p-2 bg-gray-800 bg-opacity-80 max-h-[15vh] overflow-y-hidden">
      {files.map((file) => (
        <ImageThumbnail
          key={file.id}
          file={file}
          setFileIdToPreview={setFileIdToPreview}
          addFetchedFile={addFetchedFile}
          fileAlreadyFetched={!!fetchedFiles[file.id]}
          maxHeight={100}
          maxWidth={100}
          highlight={file.id === fileIdToPreview}
        />
      ))}
    </div>
  )
}
