import { cn } from '@/lib/utils'
import { Loader2Icon } from 'lucide-react'
import {
  type FC,
  type ReactNode,
  useEffect,
  useRef,
} from 'react'

export const PREVIEW_STRIP_ITEM_SIZE = 100

interface FilePreviewStripProps {
  selectedFileId: string | null
  fileIds: string[]
  hasMore?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
  children: ReactNode
}

export const PreviewStripItem = ({
  fileId,
  children,
}: {
  fileId: string
  children: ReactNode
}) => (
  <div
    data-preview-strip-item={fileId}
    className="size-[100px] shrink-0"
  >
    {children}
  </div>
)

const scrollHorizontallyToElement = (
  container: HTMLElement,
  element: HTMLElement,
  align: 'center' | 'end',
) => {
  if (align === 'end') {
    container.scrollLeft = container.scrollWidth - container.clientWidth
    return
  }

  const targetScroll =
    element.offsetLeft - (container.clientWidth - element.offsetWidth) / 2
  const maxScroll = container.scrollWidth - container.clientWidth
  container.scrollLeft = Math.max(0, Math.min(targetScroll, maxScroll))
}

export const FilePreviewStrip: FC<FilePreviewStripProps> = ({
  selectedFileId,
  fileIds,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  children,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastAutoScrolledIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!selectedFileId || !scrollRef.current) return
    if (lastAutoScrolledIdRef.current === selectedFileId) return

    lastAutoScrolledIdRef.current = selectedFileId

    const container = scrollRef.current
    const selectedEl = container.querySelector<HTMLElement>(
      `[data-preview-strip-item="${selectedFileId}"]`,
    )
    if (!selectedEl) return

    const selectedIndex = fileIds.indexOf(selectedFileId)
    const isLastLoaded = selectedIndex === fileIds.length - 1

    requestAnimationFrame(() => {
      scrollHorizontallyToElement(
        container,
        selectedEl,
        isLastLoaded && hasMore ? 'end' : 'center',
      )
    })
  }, [selectedFileId, fileIds, hasMore])

  return (
    <div
      ref={scrollRef}
      className="flex shrink-0 items-stretch gap-2 overflow-x-auto overflow-y-hidden px-2 pb-3 pt-2"
    >
      {children}
      {hasMore && onLoadMore ? (
        <button
          type="button"
          data-load-more
          onClick={onLoadMore}
          disabled={isLoadingMore}
          className={cn(
            'flex shrink-0 flex-col items-center justify-center gap-2 rounded-lg',
            'border border-dashed border-white/25 bg-gray-800/80 text-white/90',
            'transition-colors hover:border-white/40 hover:bg-gray-800',
            'disabled:cursor-not-allowed disabled:opacity-60',
          )}
          style={{
            width: PREVIEW_STRIP_ITEM_SIZE,
            height: PREVIEW_STRIP_ITEM_SIZE,
          }}
        >
          {isLoadingMore ? (
            <Loader2Icon className="size-5 animate-spin" aria-hidden />
          ) : (
            <span className="px-2 text-center text-xs font-medium">
              Load more
            </span>
          )}
        </button>
      ) : null}
    </div>
  )
}
