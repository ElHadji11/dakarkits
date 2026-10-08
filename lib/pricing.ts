/**
 * Every amount the shop shows and the order stores comes from here.
 * Francs CFA, integers only — the browser never gets to send a total.
 */

export type PricingLine = {
  productId: number
  unitPrice: number
  quantity: number
  packEligible: boolean
}

export type PricingSettings = {
  packEnabled: boolean
  packSize: number
  packPrice: number
  shippingMode: 'fee' | 'included'
  shippingFee: number
}

export type PricingResult = {
  /** Sum of the unit prices, before any pack discount. */
  subtotal: number
  /** Always positive or zero; subtotal − packDiscount is what the items cost. */
  packDiscount: number
  shippingFee: number
  total: number
  /** How many complete packs the basket earned, for the wording. */
  packsFormed: number
  /**
   * Items needed to complete the pack currently in progress, or null when
   * there is none — packs off, basket empty, or the basket already pairs up
   * exactly. Nudging someone who just completed a pack is noise.
   */
  itemsToNextPack: number | null
}

/**
 * Pack rule: take the eligible items, each quantity counting as that many
 * items, sorted by price descending, cut into groups of `packSize`. A complete
 * group pays the pack price when that is cheaper than the sum of its items.
 * Leftovers pay full price.
 *
 * Descending order is not arbitrary. A group saves `max(0, sum − packPrice)`,
 * so concentrating the highest prices in the same groups maximises the total
 * saving. That makes this optimal, not merely greedy.
 */
export function calculatePricing(
  lines: PricingLine[],
  settings: PricingSettings,
): PricingResult {
  const expand = (filter: (line: PricingLine) => boolean) =>
    lines
      .filter(filter)
      .flatMap((line) => Array<number>(Math.max(0, line.quantity)).fill(line.unitPrice))

  const eligible = expand((line) => line.packEligible).sort((a, b) => b - a)
  const rest = expand((line) => !line.packEligible)

  const subtotal = [...eligible, ...rest].reduce((sum, price) => sum + price, 0)

  const packsUsable = settings.packEnabled && settings.packSize > 1
  let discount = 0
  let packsFormed = 0

  if (packsUsable) {
    for (let i = 0; i + settings.packSize <= eligible.length; i += settings.packSize) {
      const group = eligible.slice(i, i + settings.packSize)
      const full = group.reduce((sum, price) => sum + price, 0)
      if (settings.packPrice < full) {
        discount += full - settings.packPrice
        packsFormed += 1
      }
    }
  }

  const shippingFee = settings.shippingMode === 'fee' ? settings.shippingFee : 0
  const total = subtotal - discount + shippingFee

  const remainder = packsUsable ? eligible.length % settings.packSize : 0
  const itemsToNextPack = packsUsable && remainder > 0 ? settings.packSize - remainder : null

  return { subtotal, packDiscount: discount, shippingFee, total, packsFormed, itemsToNextPack }
}
