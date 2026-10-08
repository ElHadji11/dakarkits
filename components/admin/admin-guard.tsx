import { Suspense } from 'react'

import { requireAdmin } from '@/lib/auth/session'

/**
 * Wraps the body of every admin page.
 *
 * The layout gate is not enough on its own: with Partial Prefetching, Next
 * prerenders a page segment independently of its layout, so anything the page
 * can render without request data lands in the static shell and is served to
 * anyone — signed in or not. Reading the session inside the page's own tree is
 * what keeps its content out of that shell.
 */
export function AdminGuard({
  children,
  fallback,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  return <Suspense fallback={fallback ?? <PageSkeleton />}>{<Gate>{children}</Gate>}</Suspense>
}

async function Gate({ children }: { children: React.ReactNode }) {
  await requireAdmin()
  return <>{children}</>
}

function PageSkeleton() {
  return (
    <div className="space-y-4 py-4" aria-hidden>
      <div className="h-8 w-48 rounded bg-muted" />
      <div className="h-4 w-full max-w-md rounded bg-muted" />
      <div className="h-4 w-full max-w-sm rounded bg-muted" />
    </div>
  )
}
