import type { Metadata } from 'next'

import { AdminGuard } from '@/components/admin/admin-guard'

export const metadata: Metadata = { title: 'Administration' }

export default function AdminHomePage() {
  return (
    <AdminGuard>
      <div className="space-y-6 py-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Administration</h1>
          <p className="text-sm text-muted-foreground">Tu es connecté. Le socle est en place.</p>
        </div>

        <section className="rounded-lg border border-border p-4">
          <h2 className="text-sm font-medium">À venir</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>Phase 2 — maillots, équipes, ligues, photos, stock par taille</li>
            <li>Phase 3 — boutique : catalogue, recherche, fiche, panier</li>
            <li>Phase 4 — commandes, email et Telegram</li>
            <li>Phase 5 — suivi des commandes, statistiques, réglages</li>
            <li>Phase 6 — Pixel, référencement, performance, mise en ligne</li>
          </ul>
        </section>
      </div>
    </AdminGuard>
  )
}
