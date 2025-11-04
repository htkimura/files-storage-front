import { type FC, type PropsWithChildren } from 'react'
import { Header } from './header'
import { Sidebar } from './sidebar'
import { Toaster } from 'react-hot-toast'
import { useOverlay } from '@/contexts'

interface Props extends PropsWithChildren {
  className?: string
}

export const Layout: FC<Props> = ({ children, className }) => {
  const { content } = useOverlay()
  return (
    <>
      <Toaster position="top-center" />
      {content && content}
      <Sidebar>
        <div className="flex flex-col h-screen w-full">
          <Header />
          <main className={`mr-5 ${className}`}>{children}</main>
        </div>
      </Sidebar>
    </>
  )
}
