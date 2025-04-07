import { type FC, type PropsWithChildren } from 'react'
import { SidebarProvider } from '../ui/sidebar'
import { Header } from './header'
import { Sidebar } from './sidebar'

export const Layout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <>
      <Header />
      <SidebarProvider>
        <Sidebar>
          <div className="flex flex-col h-screen">
            <main>{children}</main>
          </div>
        </Sidebar>
      </SidebarProvider>
    </>
  )
}
