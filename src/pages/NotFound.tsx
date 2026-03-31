import { Button } from '@/components/ui/button'
import { FILES_PAGE_ROUTE, LOGIN_PAGE_ROUTE } from '@/routes'
import { Link } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'

export const NotFound = () => {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <FileQuestion className="h-8 w-8" strokeWidth={1.5} />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Page not found
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          The page you’re looking for doesn’t exist or was moved.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild variant="default">
          <Link to={FILES_PAGE_ROUTE}>Go to files</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to={LOGIN_PAGE_ROUTE}>Sign in</Link>
        </Button>
      </div>
    </div>
  )
}
