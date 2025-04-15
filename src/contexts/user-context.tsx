import { useStoredState } from '@/hooks/use-stored-state'
import { User } from '@htkimura/files-storage-backend.rest-client'
import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
} from 'react'

interface UserContextType {
  user: User | null
  setUser: Dispatch<SetStateAction<UserContextType['user']>>
  token: string | null
  setToken: Dispatch<SetStateAction<UserContextType['token']>>
  refreshToken: string | null
  setRefreshToken: Dispatch<SetStateAction<UserContextType['refreshToken']>>
  logout: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useStoredState<User | null>('user', null)
  const [token, setToken] = useStoredState<string | null>('token', null)
  const [refreshToken, setRefreshToken] = useStoredState<string | null>(
    'refresh_token',
    null,
  )

  const logout = () => {
    setToken(null)
    setRefreshToken(null)
  }

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        token,
        setToken,
        refreshToken,
        setRefreshToken,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
