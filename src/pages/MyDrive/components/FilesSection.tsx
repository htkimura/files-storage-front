import { Skeleton } from '@/components/ui/skeleton'
import type { FileWithPresignedThumbnailUrl } from '@htkimura/files-storage-backend.rest-client'
import type { RefObject } from 'react'
import { DriveFileTile } from './DriveFileTile'

const FILE_TILE_SIZE = 'minmax(9rem, 1fr)'

interface FilesSectionProps {
  files: FileWithPresignedThumbnailUrl[]
  isInitialLoading: boolean
  isFetching: boolean
  hasMore: boolean
  observerRef: RefObject<HTMLDivElement>
  onDownload: (fileId: string) => void
  onRename: (file: FileWithPresignedThumbnailUrl) => void
  onDelete: (file: FileWithPresignedThumbnailUrl) => void
  movingFileId?: string | null
}

export const FilesSection = ({
  files,
  isInitialLoading,
  isFetching,
  hasMore,
  observerRef,
  onDownload,
  onRename,
  onDelete,
  movingFileId = null,
}: FilesSectionProps) => {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Files
      </h2>
      <div
        className="grid w-full gap-3"
        style={{
          gridTemplateColumns: `repeat(auto-fill, ${FILE_TILE_SIZE})`,
        }}
      >
        {files.map((file) => (
          <DriveFileTile
            key={file.id}
            file={file}
            onDownload={onDownload}
            onRename={onRename}
            onDelete={onDelete}
            isMoving={movingFileId === file.id}
          />
        ))}
        {isInitialLoading && files.length === 0 && (
          <>
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </>
        )}
      </div>
      {isFetching && files.length > 0 && (
        <div className="flex justify-center py-2">
          <Skeleton className="h-8 w-32 rounded-full" />
        </div>
      )}
      {!isInitialLoading && files.length === 0 && (
        <p className="text-sm text-muted-foreground">No files yet</p>
      )}
      {hasMore && (
        <div
          ref={observerRef}
          className="flex h-12 w-full items-center justify-center"
          aria-hidden
        />
      )}
    </section>
  )
}
