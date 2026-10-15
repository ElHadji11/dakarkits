import type { Metadata } from 'next'

import { CatalogPage } from '@/app/(shop)/page'
import { PageTransition } from '@/components/shop/page-transition'

export const metadata: Metadata = {
  title: 'Maillots de clubs',
  description:
    'Maillots de clubs livrés sur l’axe du BRT à Dakar, payés à la livraison. Filtre par équipe, ligue, taille et prix.',
}

export default function Page() {
  return (
    <PageTransition>
      <CatalogPage category="clubs" />
    </PageTransition>
  )
}
