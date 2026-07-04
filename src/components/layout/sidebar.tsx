import { Link, useLocation } from 'react-router-dom'
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
import { FILES_PAGE_ROUTE, HOME_PAGE_ROUTE, IMAGES_PAGE_ROUTE } from '@/routes'
import { Files, FolderOpen, Image, LogOut, LucideIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { useUser } from '@/contexts'
import { FC, PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

interface SidebarItemConfig {
  label: string
  icon: LucideIcon
  href?: string
  onClick?: () => void
}

const navItems: SidebarItemConfig[] = [
  {
    label: 'Memory Vault',
    icon: FolderOpen,
    href: HOME_PAGE_ROUTE,
  },
  {
    label: 'Files',
    icon: Files,
    href: FILES_PAGE_ROUTE,
  },
  {
    label: 'Images',
    icon: Image,
    href: IMAGES_PAGE_ROUTE,
  },
]

const SidebarNavItem = ({ item }: { item: SidebarItemConfig }) => {
  const location = useLocation()
  const isActive =
    !!item.href &&
    (item.href === HOME_PAGE_ROUTE
      ? location.pathname === HOME_PAGE_ROUTE ||
        location.pathname.startsWith('/folder/')
      : location.pathname === item.href ||
        location.pathname.startsWith(`${item.href}/`))

  if (item.onClick) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={item.onClick}
              className="text-sidebar-foreground"
            >
              <item.icon className="size-4" />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={isActive}>
            <Link
              to={item.href!}
              className={cn(
                'no-underline hover:no-underline',
                isActive && 'font-semibold',
              )}
            >
              <item.icon className="size-4" />
              <span>{item.label}</span>
            </Link>
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
    <SidebarProvider className="h-svh overflow-hidden">
      <SidebarUI
        collapsible="icon"
        className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
      >
        <SidebarHeader className="flex h-16 flex-row items-center justify-center gap-0 border-b border-sidebar-border/80 px-3 py-0">
          <div className="flex h-full w-full items-center justify-center gap-1.5 overflow-hidden px-1 group-data-[collapsible=icon]:px-0">
            <img
              src="/logo-text.png"
              alt=""
              width={72}
              height={28}
              className="block h-7 w-auto max-w-full shrink object-contain object-center opacity-90 group-data-[collapsible=icon]:hidden"
            />
            <img
              src="/logo-color.png"
              alt=""
              width={32}
              height={32}
              className="hidden size-8 shrink-0 object-contain object-center opacity-90 group-data-[collapsible=icon]:block"
            />
          </div>
        </SidebarHeader>
        <SidebarContent className="gap-1 px-2 py-4">
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarNavItem key={item.href} item={item} />
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border/80 p-2">
          <SidebarMenu>
            <SidebarNavItem
              item={{
                icon: LogOut,
                label: 'Log out',
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
