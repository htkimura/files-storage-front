import { Label } from '@/components/ui/label'
import {
  FILE_LIST_SORT_OPTIONS,
  type FileListSort,
  fileListSortToOptionValue,
  fileListSortFromOptionValue,
} from '@/lib/file-list-sort'
import { cn } from '@/lib/utils'
import { ArrowDownUpIcon } from 'lucide-react'
import { type FC } from 'react'

interface FileSortControlProps {
  value: FileListSort
  onChange: (sort: FileListSort) => void
  className?: string
}

export const FileSortControl: FC<FileSortControlProps> = ({
  value,
  onChange,
  className,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(fileListSortFromOptionValue(event.target.value))
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Label
        htmlFor="file-list-sort"
        className="sr-only"
      >
        Sort list
      </Label>
      <ArrowDownUpIcon
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
      <select
        id="file-list-sort"
        value={fileListSortToOptionValue(value)}
        onChange={handleChange}
        className={cn(
          'h-9 max-w-[min(100%,14rem)] rounded-md border border-input bg-background',
          'px-3 text-sm text-foreground shadow-sm',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        )}
      >
        {FILE_LIST_SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
