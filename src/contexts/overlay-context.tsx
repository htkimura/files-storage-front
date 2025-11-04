import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState,
} from 'react'

interface OverlayContextType {
  content?: React.ReactNode | undefined
  setContent: Dispatch<SetStateAction<React.ReactNode | undefined>>
}

const OverlayContext = createContext<OverlayContextType>({
  setContent: () => {},
})

export const OverlayProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [content, setContent] = useState<OverlayContextType['content']>()

  return (
    <OverlayContext.Provider
      value={{
        content,
        setContent,
      }}
    >
      {children}
    </OverlayContext.Provider>
  )
}

export const useOverlay = () => {
  const context = useContext(OverlayContext)
  if (context === undefined) {
    throw new Error('useOverlay must be used within a OverlayProvider')
  }
  return context
}
