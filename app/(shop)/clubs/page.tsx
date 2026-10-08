import type { Metadata } from 'next'

import { CatalogPage } from '@/app/(shop)/page'

export const metadata: Metadata = {
  title: 'Maillots de clubs',
  description:
    'Maillots de clubs livrés à Dakar, payés à la livraison. Filtre par équipe, ligue, taille et prix.',
}

export default function Page() {
  return <CatalogPage category="clubs" />
}
