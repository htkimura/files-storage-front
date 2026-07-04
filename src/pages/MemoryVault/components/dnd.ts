const FILE_PREFIX = 'file:'
const FOLDER_PREFIX = 'folder:'
const FOLDER_DRAG_PREFIX = 'folder-drag:'
const BREADCRUMB_ROOT_ID = 'breadcrumb:root'
const BREADCRUMB_FOLDER_PREFIX = 'breadcrumb:folder:'

export const vaultFileDndId = (fileId: string) => `${FILE_PREFIX}${fileId}`

export const vaultFolderDndId = (folderId: string) =>
  `${FOLDER_PREFIX}${folderId}`

export const vaultFolderDragDndId = (folderId: string) =>
  `${FOLDER_DRAG_PREFIX}${folderId}`

export const vaultBreadcrumbDndId = (dropFolderId: string | null) =>
  dropFolderId === null
    ? BREADCRUMB_ROOT_ID
    : `${BREADCRUMB_FOLDER_PREFIX}${dropFolderId}`

export const parseVaultFileDndId = (id: string | number) => {
  const value = String(id)
  if (!value.startsWith(FILE_PREFIX)) return null
  return value.slice(FILE_PREFIX.length)
}

export const parseVaultFolderDndId = (id: string | number) => {
  const value = String(id)
  if (!value.startsWith(FOLDER_PREFIX)) return null
  return value.slice(FOLDER_PREFIX.length)
}

export const parseVaultFolderDragDndId = (id: string | number) => {
  const value = String(id)
  if (!value.startsWith(FOLDER_DRAG_PREFIX)) return null
  return value.slice(FOLDER_DRAG_PREFIX.length)
}

/** Returns undefined when the id is not a folder drop target. */
export const parseVaultDropTargetFolderId = (
  id: string | number,
): string | null | undefined => {
  const value = String(id)

  if (value === BREADCRUMB_ROOT_ID) return null

  if (value.startsWith(BREADCRUMB_FOLDER_PREFIX)) {
    return value.slice(BREADCRUMB_FOLDER_PREFIX.length)
  }

  const folderId = parseVaultFolderDndId(value)
  if (folderId) return folderId

  return undefined
}
