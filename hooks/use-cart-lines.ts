'use client'

import { useMemo } from 'react'

import { useCatalog } from '@/components/shop/catalog-provider'
import { useHydrated } from '@/hooks/use-hydrated'
import { calculatePricing, nextPackStep, type PricingLine } from '@/lib/pricing'
import type { ShopProduct } from '@/lib/shop-types'
import { useCart, type CartLine } from '@/stores/cart'

export type ResolvedLine = CartLine & { product: ShopProduct }

/**
 * Joins the stored basket to the live catalogue and prices it with the very
 * same function the server uses at checkout. Lines whose jersey has since been
 * unpublished simply disappear, so nothing can be ordered that is no longer
 * for sale.
 */
export function useCartLines() {
  const hydrated = useHydrated()
  const { byId, products, settings } = useCatalog()
  const stored = useCart((state) => state.lines)

  const lines = useMemo<ResolvedLine[]>(() => {
    if (!hydrated) return []
    return stored.flatMap((line) => {
      const product = byId.get(line.productId)
      return product ? [{ ...line, product }] : []
    })
  }, [hydrated, stored, byId])

  const pricingLines = useMemo<PricingLine[]>(
    () =>
      lines.map((line) => ({
        productId: line.productId,
        unitPrice: line.product.price,
        quantity: line.quantity,
        packEligible: line.product.packEligible,
      })),
    [lines],
  )

  const pricing = useMemo(
    () => calculatePricing(pricingLines, settings),
    [pricingLines, settings],
  )

  const count = lines.reduce((sum, line) => sum + line.quantity, 0)

  /**
   * Ce qu'un maillot de plus ferait gagner. Le maillot ajouté est chiffré au
   * prix du maillot éligible le moins cher en vente : un vrai prix, le plus bas
   * que l'ajout puisse coûter, donc une comparaison que la boutique tient.
   */
  const nudge = useMemo(() => {
    const cheapest = products
      .filter((product) => product.packEligible)
      .reduce<number | null>(
        (min, product) => (min === null ? product.price : Math.min(min, product.price)),
        null,
      )
    return nextPackStep(pricingLines, settings, cheapest)
  }, [pricingLines, products, settings])

  return { hydrated, lines, pricing, count, settings, nudge }
}
