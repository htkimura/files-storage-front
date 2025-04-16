import { Link } from 'react-router'
import {
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  Sidebar as SidebarUI,
} from '../ui/sidebar'
import { HOME_PAGE_ROUTE } from '@/routes'
import { File, LucideIcon, LogOut } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { useUser } from '@/contexts'
import { FC, PropsWithChildren } from 'react'
import { Separator } from '../ui/separator'

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

  return (
    <SidebarProvider>
      <SidebarUI collapsible="icon">
        <SidebarHeader>
          <div className="p-1">
            <img src="/logo-text.png" alt="logo" width={70} />
          </div>
        </SidebarHeader>
        <Separator />
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
