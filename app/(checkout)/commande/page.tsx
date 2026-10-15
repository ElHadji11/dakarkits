import type { Metadata } from 'next'

import { OrderForm } from '@/components/shop/order-form'
import { PageTransition } from '@/components/shop/page-transition'

export const metadata: Metadata = {
  title: 'Commander',
  robots: { index: false, follow: false },
}

export default function CommandePage() {
  return (
    <PageTransition>
      <OrderForm />
    </PageTransition>
  )
}
