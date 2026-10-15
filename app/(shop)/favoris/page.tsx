import type { Metadata } from 'next'

import { FavoritesPage } from '@/components/shop/favorites-page'
import { PageTransition } from '@/components/shop/page-transition'

export const metadata: Metadata = {
  title: 'Mes favoris',
  robots: { index: false, follow: true },
}

export default function FavorisPage() {
  return (
    <PageTransition>
      <FavoritesPage />
    </PageTransition>
  )
}
