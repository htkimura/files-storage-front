import { useUser } from '@/contexts'

export const Header = () => {
  const { user } = useUser()

  return (
    <header>
      <div className="h-[70px] flex flex-row justify-end items-center p-5">
        Hi {user?.email.split('@')[0]}!
      </div>
    </header>
  )
}
