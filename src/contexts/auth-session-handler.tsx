import { queryClient } from '@/config/query'
import {
  registerUnauthorizedHandler,
  setupAxiosUnauthorizedInterceptor,
} from '@/lib/setup-axios-auth'
import { LOGIN_PAGE_ROUTE } from '@/routes'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

interface AuthSessionHandlerProps {
  logout: () => void
}

export const AuthSessionHandler = ({ logout }: AuthSessionHandlerProps) => {
  const navigate = useNavigate()
  const isHandlingUnauthorizedRef = useRef(false)

  useEffect(() => {
    setupAxiosUnauthorizedInterceptor()

    registerUnauthorizedHandler(() => {
      if (isHandlingUnauthorizedRef.current) {
        return
      }

      isHandlingUnauthorizedRef.current = true
      logout()
      queryClient.clear()
      navigate(LOGIN_PAGE_ROUTE, { replace: true })
    })

    return () => {
      registerUnauthorizedHandler(null)
    }
  }, [logout, navigate])

  return null
}
