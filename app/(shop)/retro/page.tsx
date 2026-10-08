import type { Metadata } from 'next'

import { CatalogPage } from '@/app/(shop)/page'

export const metadata: Metadata = {
  title: 'Maillots rétro',
  description: 'Maillots rétro livrés à Dakar, payés à la livraison.',
}

export default function Page() {
  return <CatalogPage category="retro" />
}
