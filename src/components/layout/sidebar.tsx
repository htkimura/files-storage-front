import { Link } from 'react-router'
import {
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  Sidebar as SidebarUI,
} from '../ui/sidebar'
import { HOME_PAGE_ROUTE } from '@/routes'
import { File, LucideIcon, LogOut } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { useUser } from '@/contexts'
import { FC, PropsWithChildren, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface SidebarItem {
  label: string
  icon: LucideIcon
  href?: string
  onClick?: () => void
}

const items = [
  {
    label: 'Files',
    icon: File,
    href: HOME_PAGE_ROUTE,
  },
]

const SidebarItem = ({ item }: { item: SidebarItem }) => {
  return (
    <Tooltip>
      <TooltipTrigger>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            {item.href ? (
              <Link to={item.href}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            ) : (
              <button onClick={item.onClick}>
                <item.icon />
                <span>{item.label}</span>
              </button>
            )}
          </SidebarMenuButton>
        </SidebarMenuItem>
      </TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  )
}

export const Sidebar: FC<PropsWithChildren> = ({ children }) => {
  const { logout } = useUser()

  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <SidebarProvider>
      <SidebarUI
        collapsible="icon"
        variant="floating"
        className={cn(
          'transition-all duration-200 translate-x-2.5',
          scrolled ? 'h-screen ' : 'h-[calc(100vh_-_4rem)] translate-y-16',
        )}
      >
        <SidebarHeader>
          <SidebarTrigger />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarItem key={item.href} item={item} />
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarItem
              item={{
                icon: LogOut,
                label: 'Logout',
                onClick: logout,
              }}
            />
          </SidebarMenu>
        </SidebarFooter>
      </SidebarUI>
      {children}
    </SidebarProvider>
  )
}
