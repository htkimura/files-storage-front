import { QueryClient } from '@tanstack/react-query'
import { config } from './config'

export const queryClient = new QueryClient()

export const queryDefaultOptions = {
  axios: { baseURL: config.apiBaseUrl },
}
