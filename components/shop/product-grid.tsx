'use client'

import { ProductCard } from '@/components/shop/product-card'
import type { ShopProduct } from '@/lib/shop-types'

export function ProductGrid({ products }: { products: ShopProduct[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product, index) => (
        // The first row is above the fold on a phone: load it eagerly so the
        // LCP image is not waiting behind the lazy ones.
        <ProductCard key={product.id} product={product} priority={index < 2} />
      ))}
    </ul>
  )
}
