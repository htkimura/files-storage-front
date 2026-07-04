import axios from 'axios'

type NestJsErrorBody = {
  message?: string | string[]
}

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong',
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data

    if (typeof data === 'string' && data.trim()) {
      return data.trim()
    }

    if (data && typeof data === 'object') {
      const { message } = data as NestJsErrorBody

      if (typeof message === 'string' && message.trim()) {
        return message.trim()
      }

      if (Array.isArray(message)) {
        const joined = message
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim())
          .filter(Boolean)
          .join(', ')

        if (joined) return joined
      }
    }

    if (error.response?.status === 413) {
      return 'Storage limit exceeded.'
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim()
  }

  return fallback
}
