import { Button } from '@/components/ui/button'
import { Form, FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUser } from '@/contexts/user-context'
import { useToast } from '@/hooks/use-toast'
import { HOME_PAGE_ROUTE } from '@/routes'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useLogin } from '@htkimura/files-storage-backend.rest-client'
import { queryDefaultOptions } from '@/config'
import { Loader2 } from 'lucide-react'

const formSchema = z.object({
  email: z.string().email('Invalid e-mail'),
  password: z.string().min(1, 'Password is required'),
})

export const Login = () => {
  const { mutateAsync: login } = useLogin(queryDefaultOptions)
  const [isLoading, setIsLoading] = useState(false)
  const { setToken, setRefreshToken, setUser } = useUser()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })
  const navigate = useNavigate()
  const { toast } = useToast()

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    try {
      const {
        data: { token, refreshToken, user },
      } = await login({ data: values })

      setUser(user)
      setToken(token)
      setRefreshToken(refreshToken)
      navigate(HOME_PAGE_ROUTE)
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || 'Unexpected error'
      toast({ title: errorMessage, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-12">
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-40"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -20%, hsl(var(--primary) / 0.15), transparent)',
        }}
      />
      <div className="w-full max-w-[400px] space-y-8">
        <div className="text-center">
          <img
            src="/logo-text.png"
            alt="My files"
            width={100}
            height={36}
            className="mx-auto h-9 w-auto object-contain"
          />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to access your library
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
          <Form {...form}>
            <form
              className="flex flex-col gap-5"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      placeholder="you@example.com"
                      type="email"
                      autoComplete="email"
                      autoFocus
                      className="h-11"
                      {...field}
                    />
                  </div>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      placeholder="••••••••"
                      type="password"
                      autoComplete="current-password"
                      className="h-11"
                      {...field}
                    />
                  </div>
                )}
              />
              <Button
                type="submit"
                className="mt-2 h-11 w-full font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}
