import type { Metadata } from 'next'
import { Suspense } from 'react'

import { CatalogView } from '@/components/shop/catalog-view'
import { StaticGrid } from '@/components/shop/static-grid'

export const metadata: Metadata = {
  title: 'Maillots de clubs',
  description:
    'Maillots de clubs livrés à Dakar, payés à la livraison. Filtre par équipe, ligue, taille et prix.',
}

export default function ClubsPage() {
  return <CatalogPage category="clubs" />
}

/**
 * The interactive grid reads the URL, which is request data, so it waits behind
 * a boundary. Its fallback is the real server-rendered grid rather than a
 * skeleton: the images are then in the HTML from the first byte.
 */
export function CatalogPage({ category }: { category: 'clubs' | 'selections' | 'retro' }) {
  return (
    <Suspense fallback={<CatalogShell category={category} />}>
      <CatalogView category={category} />
    </Suspense>
  )
}

function CatalogShell({ category }: { category: 'clubs' | 'selections' | 'retro' }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-11 w-28 rounded-full bg-muted" />
        ))}
      </div>
      <div className="h-11 w-40 rounded-md bg-muted" aria-hidden />
      <StaticGrid category={category} />
    </div>
  )
}
