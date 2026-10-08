import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { LoginForm } from '@/components/admin/login-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getSession } from '@/lib/auth/session'

export const metadata: Metadata = {
  title: 'Connexion',
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">DakarKits</CardTitle>
          <CardDescription>Espace administration</CardDescription>
        </CardHeader>
        <CardContent>
          {/* The session read happens inside the boundary, so the card itself
              still ships in the static shell. */}
          <Suspense fallback={<FormPlaceholder />}>
            <FormOrRedirect />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  )
}

async function FormOrRedirect() {
  if (await getSession()) redirect('/admin')
  return <LoginForm />
}

function FormPlaceholder() {
  return (
    <div className="space-y-5" aria-hidden>
      <div className="space-y-2">
        <div className="h-4 w-12 rounded bg-muted" />
        <div className="h-12 rounded-md bg-muted" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-28 rounded bg-muted" />
        <div className="h-12 rounded-md bg-muted" />
      </div>
      <div className="h-12 rounded-md bg-muted" />
    </div>
  )
}
