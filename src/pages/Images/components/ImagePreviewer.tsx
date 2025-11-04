import {
  FileWithPresignedThumbnailUrl,
  FileWithPresignedUrl,
} from '@htkimura/files-storage-backend.rest-client'
import { FC, useEffect } from 'react'
import ImageThumbnail from './ImageThumbnail'

export type FetchedFiles = Record<string, FileWithPresignedUrl>

interface ImagePreviewerProps {
  files: FileWithPresignedThumbnailUrl[]
  fetchedFiles: FetchedFiles
  fileIdToPreview: string
  handleClose: () => void
  addFetchedFile: (file: FileWithPresignedUrl) => void
}

const ImagePreviewer: FC<ImagePreviewerProps> = ({
  files,
  fetchedFiles,
  fileIdToPreview,
  handleClose,
  addFetchedFile,
}) => {
  useEffect(() => {
    document.body.style.overflow = fileIdToPreview ? 'hidden' : 'auto'
  }, [fileIdToPreview])
  const file = fetchedFiles[fileIdToPreview]
  if (!file) return null
  return (
    <div
      onClick={handleClose}
      className="z-10 top-0 left-0 absolute w-[100vw] h-[100vh] bg-gray-950 bg-opacity-50 items-center justify-center flex"
    >
      <img
        src={file.presignedUrl}
        alt={file.name}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[70vh] shadow-2xl"
      />
      <div className="absolute bottom-0">
        <AllImagesPreviewer
          addFetchedFile={addFetchedFile}
          files={files}
          fileIdToPreview={fileIdToPreview}
        />
      </div>
    </div>
  )
}

export default ImagePreviewer

interface AllImagesPreviewerProps {
  files: FileWithPresignedThumbnailUrl[]
  addFetchedFile: (file: FileWithPresignedUrl) => void
  fileIdToPreview: string
}
const AllImagesPreviewer: FC<AllImagesPreviewerProps> = ({
  files,
  addFetchedFile,
  fileIdToPreview,
}) => {
  return (
    <div className="flex gap-2 overflow-x-auto p-2 bg-gray-800 bg-opacity-80 max-h-[15vh] overflow-y-hidden">
      {files.map((file) => (
        <ImageThumbnail
          key={file.id}
          file={file}
          addFetchedFile={addFetchedFile}
          maxHeight={100}
          maxWidth={100}
          highlight={file.id === fileIdToPreview}
        />
      ))}
    </div>
  )
}
