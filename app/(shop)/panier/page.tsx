import type { Metadata } from 'next'

import { CartPage } from '@/components/shop/cart-page'
import { PageTransition } from '@/components/shop/page-transition'

export const metadata: Metadata = {
  title: 'Mon panier',
  robots: { index: false, follow: true },
}

export default function PanierPage() {
  return (
    <PageTransition>
      <CartPage />
    </PageTransition>
  )
}
