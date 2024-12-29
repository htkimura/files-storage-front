import { Button } from '@/components/ui/button'
import { Form, FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { apiClient } from '@/config'
import { useUser } from '@/contexts/user-context'
import { useToast } from '@/hooks/use-toast'
import { HOME_PAGE_ROUTE } from '@/routes'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

const formSchema = z.object({
  email: z.string().email('Invalid e-mail'),
  password: z.string(),
})

export const Login = () => {
  const [isLoading, setIsLoading] = useState(false)
  const { setToken, setRefreshToken } = useUser()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })
  const navigate = useNavigate()

  const { toast } = useToast()

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)

    try {
      const { data } = await apiClient.post('/users/login', values)
      const { token, refreshToken } = data

      setToken(token)
      setRefreshToken(refreshToken)

      navigate(HOME_PAGE_ROUTE)
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Unexpected error'

      toast({ title: errorMessage, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="flex flex-col m-auto w-fit shadow-lg p-4 gap-4">
        <h1>Login Page</h1>
        <Form {...form}>
          <form
            className="flex flex-col gap-2"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <Input placeholder="E-mail" type="email" autoFocus {...field} />
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <Input placeholder="Password" type="password" {...field} />
              )}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Login...' : 'Login'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
