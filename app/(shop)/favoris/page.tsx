import type { Metadata } from 'next'

import { FavoritesPage } from '@/components/shop/favorites-page'

export const metadata: Metadata = {
  title: 'Mes favoris',
  robots: { index: false, follow: true },
}

export default function FavorisPage() {
  return <FavoritesPage />
}
