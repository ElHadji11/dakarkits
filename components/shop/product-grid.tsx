'use client'

import { ProductCard } from '@/components/shop/product-card'
import type { ShopProduct } from '@/lib/shop-types'

export function ProductGrid({
  products,
  shareTransition = true,
}: {
  products: ShopProduct[]
  /** Voir `ProductCard` : `false` pour la seule grille statique. */
  shareTransition?: boolean
}) {
  return (
    /* Une seule valeur, 16 px, horizontale comme verticale : les cartes ont
       maintenant une bordure, et deux gouttières différentes faisaient lire
       la grille comme des colonnes séparées plutôt que comme un damier. */
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product, index) => (
        // The first row is above the fold on a phone: load it eagerly so the
        // LCP image is not waiting behind the lazy ones.
        <ProductCard
          key={product.id}
          product={product}
          priority={index < 2}
          shareTransition={shareTransition}
        />
      ))}
    </ul>
  )
}
