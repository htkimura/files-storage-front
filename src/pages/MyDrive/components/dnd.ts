const FILE_PREFIX = 'file:'
const FOLDER_PREFIX = 'folder:'

export const driveFileDndId = (fileId: string) => `${FILE_PREFIX}${fileId}`

export const driveFolderDndId = (folderId: string) =>
  `${FOLDER_PREFIX}${folderId}`

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
