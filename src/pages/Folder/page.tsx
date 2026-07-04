import { queryDefaultOptions } from '@/config'
import { useUser } from '@/contexts'
import { useListMyFolders } from '@htkimura/files-storage-backend.rest-client'
import { Navigate, useParams } from 'react-router-dom'
import { DrivePageContent } from '@/pages/MyDrive/DrivePageContent'
import { getFolderPageRoute, HOME_PAGE_ROUTE } from '@/routes'

export const FolderPage = () => {
  const { folderId } = useParams<{ folderId: string }>()
  const { token } = useUser()

  const { data: foldersRes, isLoading } = useListMyFolders(undefined, {
    axios: {
      ...queryDefaultOptions.axios,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  })

  if (!folderId) {
    return <Navigate to={HOME_PAGE_ROUTE} replace />
  }

  const allFolders = foldersRes?.data ?? []
  const currentFolder = allFolders.find((folder) => folder.id === folderId)

  if (!isLoading && !currentFolder) {
    return <Navigate to={HOME_PAGE_ROUTE} replace />
  }

  const parentFolder = currentFolder?.parentFolderId
    ? allFolders.find((folder) => folder.id === currentFolder.parentFolderId)
    : null

  const breadcrumbs = [
    { label: 'My Drive', to: HOME_PAGE_ROUTE, dropFolderId: null },
    ...(parentFolder
      ? [
          {
            label: parentFolder.name,
            to: getFolderPageRoute(parentFolder.id),
            dropFolderId: parentFolder.id,
          },
        ]
      : []),
  ]

  return (
    <DrivePageContent
      folderId={folderId}
      title={currentFolder?.name ?? 'Folder'}
      description="Folders and files inside this folder. Drag items onto a folder or breadcrumb to move them."
      breadcrumbs={breadcrumbs}
    />
  )
}
