import { useState, useEffect } from 'react'

export const useStoredState = <T>(key: string, initialValue: T) => {
  const isClient = typeof window !== 'undefined'

  const [value, setValue] = useState(() => {
    if (isClient) {
      try {
        const storedValue = localStorage.getItem(key)
        return storedValue !== null
          ? (JSON.parse(storedValue) as T)
          : initialValue
      } catch {
        return initialValue
      }
    }
    return initialValue
  })

  useEffect(() => {
    if (isClient) {
      localStorage.setItem(key, JSON.stringify(value))
    }
  }, [key, value, isClient])

  return [value, setValue] as const
}
