export const HOME_PAGE_ROUTE = '/'
export const LOGIN_PAGE_ROUTE = '/login'
export const FILES_PAGE_ROUTE = '/files'
export const IMAGES_PAGE_ROUTE = '/images'
export const FOLDER_PAGE_ROUTE = '/folder/:folderId'

export const getFolderPageRoute = (folderId: string) => `/folder/${folderId}`
