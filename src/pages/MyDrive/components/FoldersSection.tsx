import { Skeleton } from '@/components/ui/skeleton'
import type { Folder } from '@htkimura/files-storage-backend.rest-client'
import { DriveFolderTile } from './DriveFolderTile'

interface FoldersSectionProps {
  folders: Folder[]
  isLoading: boolean
}

export const FoldersSection = ({ folders, isLoading }: FoldersSectionProps) => {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Folders
      </h2>
      {isLoading ? (
        <div
          className="grid w-full gap-2"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(12rem, 1fr))',
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-xl" />
          ))}
        </div>
      ) : folders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No folders yet</p>
      ) : (
        <div
          className="grid w-full gap-2"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(12rem, 1fr))',
          }}
        >
          {folders.map((folder) => (
            <DriveFolderTile key={folder.id} folder={folder} />
          ))}
        </div>
      )}
    </section>
  )
}
