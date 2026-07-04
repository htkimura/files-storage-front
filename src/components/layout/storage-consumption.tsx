import { queryDefaultOptions } from '@/config'
import { useUser } from '@/contexts'
import { getStorageUsagePercent } from '@/lib/storage'
import { cn } from '@/lib/utils'
import { FILES_PAGE_ROUTE } from '@/routes'
import {
  useMe,
  getMeQueryKey,
} from '@htkimura/files-storage-backend.rest-client'
import { filesize } from 'filesize'
import { HardDrive } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'

type MeUser = {
  storageConsumedCount?: number
  planDetails?: {
    storageLimit: number
  }
}

function useMeStorage() {
  const { token } = useUser()

  const { data, isLoading } = useMe({
    axios: {
      ...queryDefaultOptions.axios,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
    query: {
      queryKey: getMeQueryKey(),
      enabled: !!token,
    },
  })

  const user = data?.data as MeUser | undefined

  return {
    isLoading: isLoading && !!token,
    usedBytes: user?.storageConsumedCount ?? 0,
    limitBytes: user?.planDetails?.storageLimit,
  }
}

function StorageProgressBar({
  percent,
  className,
}: {
  percent: number
  className?: string
}) {
  return (
    <div
      className={cn(
        'h-1 w-full overflow-hidden rounded-full bg-sidebar-accent',
        className,
      )}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Storage used"
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

export function StorageConsumption() {
  const { isLoading, usedBytes, limitBytes } = useMeStorage()

  if (isLoading || limitBytes == null) {
    return null
  }

  const percent = getStorageUsagePercent(usedBytes, limitBytes)
  const usedLabel = filesize(usedBytes, { standard: 'jedec', round: 1 })
  const maxLabel = filesize(limitBytes, { standard: 'jedec', round: 0 })
  const summary = `${usedLabel} used of ${maxLabel} (${percent}%)`

  return (
    <>
      <div className="mt-auto space-y-2 px-1 py-2 group-data-[collapsible=icon]:hidden">
        <p className="text-sm font-medium text-sidebar-foreground">Storage</p>
        <StorageProgressBar percent={percent} />
        <p className="text-xs leading-snug text-muted-foreground">
          <Link
            to={FILES_PAGE_ROUTE}
            className="font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
          >
            {usedLabel}
          </Link>
          {` used of ${maxLabel} (${percent}%)`}
        </p>
      </div>

      <div className="mt-auto hidden justify-center py-2 group-data-[collapsible=icon]:flex">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to={FILES_PAGE_ROUTE}
              className="relative flex size-8 items-center justify-center rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              aria-label={summary}
            >
              <HardDrive className="size-4" />
              <svg
                className="pointer-events-none absolute inset-0 size-full -rotate-90"
                viewBox="0 0 32 32"
                aria-hidden
              >
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  fill="none"
                  className="stroke-sidebar-accent"
                  strokeWidth="3"
                />
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  fill="none"
                  className="stroke-primary"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${(percent / 100) * 88} 88`}
                />
              </svg>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{summary}</TooltipContent>
        </Tooltip>
      </div>
    </>
  )
}
