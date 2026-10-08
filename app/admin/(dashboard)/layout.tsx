import type { Metadata } from 'next'
import { Suspense } from 'react'

import { AdminShell } from '@/components/admin/admin-shell'
import { requireAdmin } from '@/lib/auth/session'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

/**
 * The admin deliberately produces no static shell: every page defers to
 * AdminGuard so nothing can be prerendered and served to a stranger. Placed
 * here, and no higher, so the shop keeps its static-shell validation.
 */
export const instant = false

/**
 * Every page under this layout is gated. The check lives here and in each admin
 * Server Action — a layout alone does not protect an action.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ShellPlaceholder />}>
      <Gate>{children}</Gate>
    </Suspense>
  )
}

async function Gate({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin()
  return <AdminShell email={session.email}>{children}</AdminShell>
}

function ShellPlaceholder() {
  return (
    <div className="min-h-dvh" aria-hidden>
      <div className="h-14 border-b border-border" />
    </div>
  )
}
