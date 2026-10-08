import type { Metadata } from 'next'

import { CartPage } from '@/components/shop/cart-page'

export const metadata: Metadata = {
  title: 'Mon panier',
  robots: { index: false, follow: true },
}

export default function PanierPage() {
  return <CartPage />
}
