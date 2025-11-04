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
import { HOME_PAGE_ROUTE, IMAGES_PAGE_ROUTE } from '@/routes'
import { File, LucideIcon, LogOut, Image } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { useUser } from '@/contexts'
import { FC, PropsWithChildren } from 'react'

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
  {
    label: 'Images',
    icon: Image,
    href: IMAGES_PAGE_ROUTE,
  },
]

const SidebarItem = ({ item }: { item: SidebarItem }) => {
  return (
    <Tooltip>
      <TooltipTrigger>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            {item.href ? (
              <Link to={item.href} className="text-white">
                <item.icon />
                <span>{item.label}</span>
              </Link>
            ) : (
              <button onClick={item.onClick} className="text-white">
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
        <SidebarHeader className="h-[70px] flex justify-center">
          <div className="p-5 ">
            <img src="/logo-text.png" alt="logo" width={70} />
          </div>
        </SidebarHeader>
        <SidebarContent className="mt-5 px-5">
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
