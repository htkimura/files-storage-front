import { Button } from '@/components/ui/button'
import classNames from 'classnames'
import {
  Check,
  ChevronDown,
  ChevronUp,
  FileIcon,
  Loader2,
  X,
} from 'lucide-react'
import pluralize from 'pluralize-esm'
import { FC, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export type UploadRowStatus =
  | 'queued'
  | 'uploading'
  | 'complete'
  | 'error'
  | 'cancelled'

export interface UploadRowState {
  id: string
  name: string
  size: number
  progress: number
  status: UploadRowStatus
  errorMessage?: string
}

function formatEta(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return 'Calculating time remaining…'
  }
  if (seconds < 45) {
    return `About ${Math.max(1, Math.ceil(seconds))} seconds remaining`
  }
  if (seconds < 3600) {
    const m = Math.ceil(seconds / 60)
    return `About ${m} ${pluralize('minute', m)} remaining`
  }
  const h = Math.floor(seconds / 3600)
  const m = Math.ceil((seconds % 3600) / 60)
  if (m === 0) {
    return `About ${h} ${pluralize('hour', h)} remaining`
  }
  return `About ${h} ${pluralize('hour', h)} ${m} min remaining`
}

const CircularProgress: FC<{ value: number }> = ({ value }) => {
  const size = 32
  const r = 11
  const c = 2 * Math.PI * r
  const pct = Math.min(100, Math.max(0, Math.round(value)))
  const offset = c - (pct / 100) * c
  const cx = size / 2
  const cy = size / 2

  return (
    <div
      className="relative h-8 w-8 shrink-0"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0"
        aria-hidden
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          className="stroke-slate-200"
          strokeWidth="2.5"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          className="stroke-primary transition-[stroke-dashoffset] duration-200"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[7px] font-semibold tabular-nums leading-none text-slate-600 pointer-events-none">
        {pct}%
      </span>
    </div>
  )
}

const CompleteIndicator: FC<{ onRemove: () => void }> = ({ onRemove }) => (
  <div className="group relative h-7 w-7 shrink-0">
    <div
      className="absolute inset-0 flex items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm transition-opacity duration-150 group-hover:opacity-0 group-hover:pointer-events-none"
      aria-hidden
    >
      <Check
        className="w-3.5 h-3.5 stroke-[3]"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </div>
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onRemove()
      }}
      className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-600 text-white opacity-0 transition-opacity duration-150 hover:bg-slate-700 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
      aria-label="Remove from list"
    >
      <X className="w-3.5 h-3.5 stroke-[2.5]" strokeLinecap="round" />
    </button>
  </div>
)

interface UploadProgressPopupProps {
  items: UploadRowState[]
  collapsed: boolean
  onToggleCollapse: () => void
  onDismiss: () => void
  onCancelAll: () => void
  onRemoveItem?: (id: string) => void
}

export const UploadProgressPopup: FC<UploadProgressPopupProps> = ({
  items,
  collapsed,
  onToggleCollapse,
  onDismiss,
  onCancelAll,
  onRemoveItem,
}) => {
  const speedRef = useRef<{ t: number; loaded: number } | null>(null)
  const [etaText, setEtaText] = useState('Calculating time remaining…')

  const { activeCount, showCancelAll } = useMemo(() => {
    const uploading = items.filter(
      (i) => i.status === 'uploading' || i.status === 'queued',
    )
    const activeCount = uploading.length
    const showCancelAll = items.some(
      (i) => i.status === 'uploading' || i.status === 'queued',
    )
    return { activeCount, showCancelAll }
  }, [items])

  useEffect(() => {
    const uploading = items.filter(
      (i) => i.status === 'uploading' || i.status === 'queued',
    )
    if (uploading.length === 0) {
      return
    }
    const totalBytes = uploading.reduce((s, i) => s + i.size, 0)
    const loadedBytes = uploading.reduce(
      (s, i) =>
        s +
        i.size * (i.status === 'queued' ? 0 : Math.min(100, i.progress)) * 0.01,
      0,
    )
    const remaining = Math.max(0, totalBytes - loadedBytes)
    const now = performance.now()
    const prev = speedRef.current
    let nextEta = 'Calculating time remaining…'
    if (prev && totalBytes > 0) {
      const dt = (now - prev.t) / 1000
      if (dt > 0.25) {
        const dLoaded = loadedBytes - prev.loaded
        const instSpeed = dLoaded / dt
        if (instSpeed > 512) {
          nextEta = formatEta(remaining / instSpeed)
        }
      }
    }
    speedRef.current = { t: now, loaded: loadedBytes }
    setEtaText(nextEta)
  }, [items])

  if (items.length === 0) {
    return null
  }

  const doneCount = items.filter((i) => i.status === 'complete').length
  const title =
    activeCount > 0
      ? `Uploading ${items.length} ${pluralize('item', items.length)}`
      : doneCount === items.length
        ? `Finished uploading ${items.length} ${pluralize('item', items.length)}`
        : `Uploads`

  const panel = (
    <div
      className={classNames(
        'fixed z-[300] flex flex-col bg-white rounded-xl shadow-lg border border-slate-200/80 text-slate-900 pointer-events-auto',
        'right-6 bottom-6 w-[min(100vw-2rem,22rem)] overflow-hidden',
        collapsed ? 'max-h-14' : 'max-h-[min(70vh,24rem)]',
      )}
      role="dialog"
      aria-label="Upload progress"
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-slate-100 bg-white">
        <span className="text-sm font-medium truncate pr-2">{title}</span>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600"
            aria-expanded={!collapsed}
            aria-label={
              collapsed ? 'Expand upload list' : 'Collapse upload list'
            }
          >
            {collapsed ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600"
            aria-label="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {showCancelAll && (
            <div className="flex items-center justify-between gap-2 border-b border-primary/10 bg-primary/[0.06] px-3 py-2">
              <p className="mb-0 flex-1 min-w-0 text-xs leading-snug text-foreground">
                {etaText}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 shrink-0 text-xs text-foreground hover:bg-primary/10"
                onClick={onCancelAll}
              >
                Cancel
              </Button>
            </div>
          )}

          <ul className="overflow-y-auto overscroll-contain divide-y divide-slate-100 max-h-[min(50vh,18rem)]">
            {items.map((row) => (
              <li
                key={row.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 px-3 py-2 hover:bg-slate-50/80"
              >
                <span className="inline-flex h-8 w-5 shrink-0 items-center justify-center self-center">
                  <FileIcon className="h-5 w-5 text-slate-400" />
                </span>
                <div className="flex min-h-8 min-w-0 flex-col justify-center gap-0.5 self-center">
                  <p
                    className="mb-0 text-xs font-medium text-slate-900 truncate leading-snug"
                    title={row.name}
                  >
                    {row.name}
                  </p>
                  <p className="mb-0 text-[10px] text-slate-500 truncate leading-snug">
                    {row.status === 'complete' && 'Upload complete'}
                    {row.status === 'uploading' && 'Uploading…'}
                    {row.status === 'queued' && 'Waiting…'}
                    {row.status === 'cancelled' && 'Upload canceled'}
                    {row.status === 'error' &&
                      (row.errorMessage || 'Upload failed')}
                  </p>
                </div>
                <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center self-center">
                  {row.status === 'complete' ? (
                    onRemoveItem ? (
                      <CompleteIndicator
                        onRemove={() => onRemoveItem(row.id)}
                      />
                    ) : (
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm"
                        aria-label="Upload complete"
                      >
                        <Check
                          className="w-3.5 h-3.5 stroke-[3]"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </div>
                    )
                  ) : row.status === 'uploading' ? (
                    <CircularProgress value={row.progress} />
                  ) : row.status === 'queued' ? (
                    <Loader2 className="h-6 w-6 shrink-0 animate-spin text-primary" />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center">
                      <span className="text-sm leading-none text-slate-300">
                        —
                      </span>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )

  if (typeof document === 'undefined') {
    return null
  }

  return createPortal(panel, document.body)
}
