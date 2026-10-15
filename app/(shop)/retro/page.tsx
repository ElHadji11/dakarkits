import type { Metadata } from 'next'

import { CatalogPage } from '@/app/(shop)/page'
import { PageTransition } from '@/components/shop/page-transition'

export const metadata: Metadata = {
  title: 'Maillots rétro',
  description: 'Maillots rétro livrés sur l’axe du BRT à Dakar, payés à la livraison.',
}

export default function Page() {
  return (
    <PageTransition>
      <CatalogPage category="retro" />
    </PageTransition>
  )
}
