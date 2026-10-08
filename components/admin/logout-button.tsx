'use client'

import { LogOut } from 'lucide-react'
import { useTransition } from 'react'

import { logout } from '@/app/admin/_actions/auth'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  const [pending, startTransition] = useTransition()

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => logout())}
      className="h-11 gap-2"
    >
      <LogOut className="size-4" aria-hidden />
      <span className="sr-only sm:not-sr-only">Déconnexion</span>
    </Button>
  )
}
