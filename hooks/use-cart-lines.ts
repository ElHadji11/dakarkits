'use client'

import { useMemo } from 'react'

import { useCatalog } from '@/components/shop/catalog-provider'
import { useHydrated } from '@/hooks/use-hydrated'
import { calculatePricing, type PricingLine } from '@/lib/pricing'
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

  const pricing = useMemo(() => {
    const pricingLines: PricingLine[] = lines.map((line) => ({
      productId: line.productId,
      unitPrice: line.product.price,
      quantity: line.quantity,
      packEligible: line.product.packEligible,
    }))
    return calculatePricing(pricingLines, settings)
  }, [lines, settings])

  const count = lines.reduce((sum, line) => sum + line.quantity, 0)

  /**
   * What the next complete pack would cost at full price: the eligible items
   * already in the basket that are not yet paired, plus the missing ones at the
   * cheapest eligible price on sale. A real figure, not a guess — it is the
   * least they could pay for those jerseys without the pack.
   */
  const packCompareAt = useMemo(() => {
    if (!settings.packEnabled || pricing.itemsToNextPack === null) return null

    const prices = lines
      .filter((line) => line.product.packEligible)
      .flatMap((line) => Array<number>(line.quantity).fill(line.product.price))
      .sort((a, b) => b - a)

    const unpaired = prices.slice(prices.length - (prices.length % settings.packSize))
    const cheapest = products
      .filter((product) => product.packEligible)
      .reduce<number | null>(
        (min, product) => (min === null ? product.price : Math.min(min, product.price)),
        null,
      )
    if (cheapest === null) return null

    const missing = pricing.itemsToNextPack * cheapest
    return unpaired.reduce((sum, price) => sum + price, 0) + missing
  }, [lines, products, settings, pricing.itemsToNextPack])

  return { hydrated, lines, pricing, count, settings, packCompareAt }
}
