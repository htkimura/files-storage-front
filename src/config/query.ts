import { QueryClient } from '@tanstack/react-query'
import { config } from './config'

export const queryClient = new QueryClient()

/** Axios omits null params by default; our API uses the literal "null" for nullable filters. */
function serializeParams(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue

    if (value === null) {
      searchParams.append(key, 'null')
      continue
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        searchParams.append(`${key}[]`, String(item))
      }
      continue
    }

    searchParams.append(key, String(value))
  }

  return searchParams.toString()
}

export const queryDefaultOptions = {
  axios: {
    baseURL: config.apiBaseUrl,
    paramsSerializer: serializeParams,
  },
}
