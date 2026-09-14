import { resolveDisplayImageUrl } from '@/lib/heicToDisplayUrl'
import { isHeicFile } from '@/lib/filePreview'
import { useEffect, useState } from 'react'

type DisplayImageState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; src: string }
  | { status: 'failed' }

export const useHeicAwareImageSrc = (
  remoteUrl: string | undefined,
  file: { name: string; type: string },
) => {
  const [state, setState] = useState<DisplayImageState>({ status: 'idle' })

  useEffect(() => {
    if (!remoteUrl) {
      setState({ status: 'idle' })
      return
    }

    if (!isHeicFile(file)) {
      setState({ status: 'ready', src: remoteUrl })
      return
    }

    let cancelled = false
    setState({ status: 'loading' })

    void resolveDisplayImageUrl(remoteUrl, file)
      .then((src) => {
        if (cancelled) return
        setState({ status: 'ready', src })
      })
      .catch(() => {
        if (cancelled) return
        setState({ status: 'failed' })
      })

    return () => {
      cancelled = true
    }
  }, [file.name, file.type, remoteUrl])

  const src = state.status === 'ready' ? state.src : undefined
  const isPending = state.status === 'loading'
  const failed = state.status === 'failed'

  return { src, isPending, failed }
}
