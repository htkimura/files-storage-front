import { useUser } from '@/contexts'
import { Separator } from '../ui/separator'

export const Header = () => {
  const { user } = useUser()

  return (
    <header>
      <div className="h-[56px] flex flex-row justify-end items-center p-5">
        Hi {user?.email.split('@')[0]}!
      </div>
      <Separator />
    </header>
  )
}
