import axios from 'axios'

const AUTH_EXEMPT_URL_PATTERN = /\/users\/(?:login|refresh-token)(?:\?|$|\/)/

let unauthorizedHandler: (() => void) | null = null
let interceptorRegistered = false

export const registerUnauthorizedHandler = (handler: (() => void) | null) => {
  unauthorizedHandler = handler
}

export const setupAxiosUnauthorizedInterceptor = () => {
  if (interceptorRegistered) {
    return
  }

  interceptorRegistered = true

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (!axios.isAxiosError(error) || error.response?.status !== 401) {
        return Promise.reject(error)
      }

      const requestUrl = error.config?.url ?? ''
      if (AUTH_EXEMPT_URL_PATTERN.test(requestUrl)) {
        return Promise.reject(error)
      }

      unauthorizedHandler?.()

      return Promise.reject(error)
    },
  )
}
