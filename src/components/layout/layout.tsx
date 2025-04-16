import { type FC, type PropsWithChildren } from 'react'
import { SidebarProvider } from '../ui/sidebar'
import { Header } from './header'
import { Sidebar } from './sidebar'

export const Layout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <>
      <SidebarProvider>
        <Sidebar>
          <div className="flex flex-col h-screen w-full">
            <Header />
            <main>{children}</main>
          </div>
        </Sidebar>
      </SidebarProvider>
    </>
  )
}
