import { type FC, type PropsWithChildren } from 'react'
import { Header } from './header'
import { Sidebar } from './sidebar'
import { Toaster } from 'react-hot-toast'
import { useOverlay } from '@/contexts'
import { cn } from '@/lib/utils'

interface Props extends PropsWithChildren {
  className?: string
}

export const Layout: FC<Props> = ({ children, className }) => {
  const { content } = useOverlay()
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          className:
            '!rounded-lg !border !border-border !bg-card !text-card-foreground !shadow-lg',
        }}
      />
      {content && content}
      <Sidebar>
        <div className="flex min-h-svh w-full flex-col bg-transparent">
          <Header />
          <main
            className={cn(
              'mx-3 mb-3 mt-0 flex-1 overflow-auto rounded-2xl border border-border/80 bg-card shadow-sm md:mx-5 md:mb-5 md:mt-1',
              className,
            )}
          >
            {children}
          </main>
        </div>
      </Sidebar>
    </>
  )
}
