import type { Metadata } from 'next'

import { CatalogPage } from '@/app/(shop)/page'

export const metadata: Metadata = {
  title: 'Maillots de sélections nationales',
  description: 'Maillots de sélections nationales livrés à Dakar, payés à la livraison.',
}

export default function Page() {
  return <CatalogPage category="selections" />
}
