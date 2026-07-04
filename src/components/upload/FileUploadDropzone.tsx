import cloudUploadingAnimation from '@/animations/cloud-uploading.json'
import { cn } from '@/lib/utils'
import { CloudUploadIcon } from 'lucide-react'
import { useLottie } from 'lottie-react'
import type { DropzoneInputProps, DropzoneRootProps } from 'react-dropzone'

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

interface FileUploadDropzoneProps {
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T
  getInputProps: <T extends DropzoneInputProps>(props?: T) => T
  isDragActive: boolean
  className?: string
}

export const FileUploadDropzone = ({
  getRootProps,
  getInputProps,
  isDragActive,
  className,
}: FileUploadDropzoneProps) => {
  return (
    <button
      type="button"
      className={cn(
        'group flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-200',
        'border-muted-foreground/20 bg-muted/30 text-muted-foreground',
        'hover:border-primary/35 hover:bg-primary/[0.04] hover:text-foreground',
        isDragActive
          ? 'min-h-44 border-primary bg-primary/[0.06] py-5 text-foreground'
          : 'h-44 px-6 py-8',
        className,
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
          <CloudUploadIcon className="mb-3 size-10 opacity-70 transition-opacity group-hover:opacity-100" />
          <span className="text-center text-sm font-medium text-foreground">
            Drag & drop files here
          </span>
          <span className="mt-1 text-center text-xs text-muted-foreground">
            or click to browse
          </span>
        </>
      )}
    </button>
  )
}
