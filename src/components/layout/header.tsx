import { SidebarTrigger } from '@/components/ui/sidebar'
import { useUser } from '@/contexts'
import { cn } from '@/lib/utils'

export const Header = () => {
  const { user } = useUser()
  const display = user?.email?.split('@')[0]?.replace(/\./g, ' ') ?? 'Account'
  const initial = display.charAt(0).toUpperCase()

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border/60 bg-card/80 px-3 backdrop-blur-md md:h-16 md:px-5">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1 shrink-0 text-foreground" />
        <span className="text-sm font-semibold tracking-tight text-foreground">
          My files
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden max-w-[200px] truncate text-sm text-muted-foreground sm:inline">
          {user?.email}
        </span>
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold',
            'bg-primary/10 text-primary ring-2 ring-background',
          )}
          title={user?.email ?? ''}
        >
          {initial}
        </div>
      </div>
    </header>
  )
}
