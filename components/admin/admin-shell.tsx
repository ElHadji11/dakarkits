import Link from 'next/link'

import { AdminNavLink } from '@/components/admin/admin-nav-link'
import { LogoutButton } from '@/components/admin/logout-button'
import { Toaster } from '@/components/ui/sonner'

/** Sections grow phase by phase; only what exists is linked. */
const SECTIONS = [
  { href: '/admin/commandes', label: 'Commandes' },
  { href: '/admin/produits', label: 'Produits' },
  { href: '/admin/equipes', label: 'Équipes' },
  { href: '/admin/stats', label: 'Stats' },
  { href: '/admin/reglages', label: 'Réglages' },
  { href: '/admin/profil', label: 'Profil' },
]

export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4">
          <Link href="/admin" className="font-semibold tracking-tight">
            DakarKits
          </Link>
          <nav className="flex items-center gap-1 overflow-x-auto" aria-label="Sections">
            {SECTIONS.map((section) => (
              <AdminNavLink key={section.href} href={section.href}>
                {section.label}
              </AdminNavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">{email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-4">{children}</main>
      <Toaster position="top-center" richColors />
    </div>
  )
}
