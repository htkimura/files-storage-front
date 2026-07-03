const FILE_PREFIX = 'file:'
const FOLDER_PREFIX = 'folder:'
const BREADCRUMB_ROOT_ID = 'breadcrumb:root'
const BREADCRUMB_FOLDER_PREFIX = 'breadcrumb:folder:'

export const driveFileDndId = (fileId: string) => `${FILE_PREFIX}${fileId}`

export const driveFolderDndId = (folderId: string) =>
  `${FOLDER_PREFIX}${folderId}`

export const driveBreadcrumbDndId = (dropFolderId: string | null) =>
  dropFolderId === null
    ? BREADCRUMB_ROOT_ID
    : `${BREADCRUMB_FOLDER_PREFIX}${dropFolderId}`

export const parseDriveFileDndId = (id: string | number) => {
  const value = String(id)
  if (!value.startsWith(FILE_PREFIX)) return null
  return value.slice(FILE_PREFIX.length)
}

export const parseDriveFolderDndId = (id: string | number) => {
  const value = String(id)
  if (!value.startsWith(FOLDER_PREFIX)) return null
  return value.slice(FOLDER_PREFIX.length)
}

/** Returns undefined when the id is not a folder drop target. */
export const parseDriveDropTargetFolderId = (
  id: string | number,
): string | null | undefined => {
  const value = String(id)

  if (value === BREADCRUMB_ROOT_ID) return null

  if (value.startsWith(BREADCRUMB_FOLDER_PREFIX)) {
    return value.slice(BREADCRUMB_FOLDER_PREFIX.length)
  }

  const folderId = parseDriveFolderDndId(value)
  if (folderId) return folderId

  return undefined
}
