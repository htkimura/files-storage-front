import {
  FileSortField,
  SortDirection,
} from '@htkimura/files-storage-backend.rest-client'

export type FileListSort = {
  sortBy: FileSortField
  sortOrder: SortDirection
}

export const FILE_LIST_SORT_STORAGE_KEY = 'file-list-sort'

export const DEFAULT_FILE_LIST_SORT: FileListSort = {
  sortBy: FileSortField.date,
  sortOrder: SortDirection.desc,
}

export type FileListSortOption = {
  value: string
  label: string
  sort: FileListSort
}

export const FILE_LIST_SORT_OPTIONS: FileListSortOption[] = [
  {
    value: 'date-desc',
    label: 'Date (newest first)',
    sort: { sortBy: FileSortField.date, sortOrder: SortDirection.desc },
  },
  {
    value: 'date-asc',
    label: 'Date (oldest first)',
    sort: { sortBy: FileSortField.date, sortOrder: SortDirection.asc },
  },
  {
    value: 'name-asc',
    label: 'Name (A–Z)',
    sort: { sortBy: FileSortField.name, sortOrder: SortDirection.asc },
  },
  {
    value: 'name-desc',
    label: 'Name (Z–A)',
    sort: { sortBy: FileSortField.name, sortOrder: SortDirection.desc },
  },
]

export const fileListSortToOptionValue = (sort: FileListSort): string =>
  `${sort.sortBy}-${sort.sortOrder}`

export const fileListSortFromOptionValue = (value: string): FileListSort => {
  const match = FILE_LIST_SORT_OPTIONS.find((option) => option.value === value)
  return match?.sort ?? DEFAULT_FILE_LIST_SORT
}
