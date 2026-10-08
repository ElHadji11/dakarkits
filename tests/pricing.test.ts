import { describe, expect, it } from 'vitest'

import { calculatePricing, type PricingLine, type PricingSettings } from '@/lib/pricing'

/** Launch settings: 8 000 F a jersey, 2 for 13 000 F, no delivery fee counted. */
const launch: PricingSettings = {
  packEnabled: true,
  packSize: 2,
  packPrice: 13000,
  shippingMode: 'included',
  shippingFee: 0,
}

const jerseys = (quantity: number, unitPrice = 8000): PricingLine[] => [
  { productId: 1, unitPrice, quantity, packEligible: true },
]

describe('the four launch examples from the brief', () => {
  it.each([
    [1, 8000],
    [2, 13000],
    [3, 21000],
    [4, 26000],
  ])('%i jersey(s) costs %i F', (count, expected) => {
    expect(calculatePricing(jerseys(count), launch).total).toBe(expected)
  })
})

describe('pack formation', () => {
  it('pairs the most expensive items together, which is what saves most', () => {
    // 9000+9000 beats the pack (saves 5000); 4000+4000 does not reach it.
    const lines: PricingLine[] = [
      { productId: 1, unitPrice: 9000, quantity: 2, packEligible: true },
      { productId: 2, unitPrice: 4000, quantity: 2, packEligible: true },
    ]
    const result = calculatePricing(lines, launch)
    expect(result.subtotal).toBe(26000)
    expect(result.packDiscount).toBe(5000)
    expect(result.total).toBe(21000)
    expect(result.packsFormed).toBe(1)
  })

  it('never charges a pack that costs more than paying full price', () => {
    const lines: PricingLine[] = [
      { productId: 1, unitPrice: 5000, quantity: 2, packEligible: true },
    ]
    const result = calculatePricing(lines, launch)
    expect(result.packDiscount).toBe(0)
    expect(result.total).toBe(10000)
  })

  it('leaves non-eligible jerseys out of the pack entirely', () => {
    const lines: PricingLine[] = [
      { productId: 1, unitPrice: 8000, quantity: 1, packEligible: true },
      { productId: 2, unitPrice: 8000, quantity: 1, packEligible: false },
    ]
    const result = calculatePricing(lines, launch)
    expect(result.packDiscount).toBe(0)
    expect(result.total).toBe(16000)
  })

  it('counts one line of quantity 2 exactly like two lines of one', () => {
    const asOneLine = calculatePricing(jerseys(2), launch)
    const asTwoLines = calculatePricing(
      [
        { productId: 1, unitPrice: 8000, quantity: 1, packEligible: true },
        { productId: 2, unitPrice: 8000, quantity: 1, packEligible: true },
      ],
      launch,
    )
    expect(asOneLine.total).toBe(asTwoLines.total)
  })

  it('honours a pack size of three', () => {
    const settings = { ...launch, packSize: 3, packPrice: 18000 }
    expect(calculatePricing(jerseys(3), settings).total).toBe(18000)
    expect(calculatePricing(jerseys(4), settings).total).toBe(26000)
    expect(calculatePricing(jerseys(6), settings).total).toBe(36000)
  })

  it('charges full price when the pack is switched off', () => {
    const result = calculatePricing(jerseys(4), { ...launch, packEnabled: false })
    expect(result.packDiscount).toBe(0)
    expect(result.total).toBe(32000)
    expect(result.itemsToNextPack).toBeNull()
  })
})

describe('delivery', () => {
  it('adds the fee when the shop charges separately', () => {
    const settings: PricingSettings = { ...launch, shippingMode: 'fee', shippingFee: 1000 }
    const result = calculatePricing(jerseys(2), settings)
    expect(result.shippingFee).toBe(1000)
    expect(result.total).toBe(14000)
  })

  it('adds nothing when delivery is included', () => {
    const result = calculatePricing(jerseys(2), { ...launch, shippingFee: 1000 })
    expect(result.shippingFee).toBe(0)
    expect(result.total).toBe(13000)
  })
})

describe('the nudge in the cart', () => {
  it('says one more jersey completes a pack', () => {
    expect(calculatePricing(jerseys(1), launch).itemsToNextPack).toBe(1)
    expect(calculatePricing(jerseys(3), launch).itemsToNextPack).toBe(1)
  })

  it('stays quiet when the basket already pairs up exactly', () => {
    expect(calculatePricing(jerseys(2), launch).itemsToNextPack).toBeNull()
    expect(calculatePricing(jerseys(4), launch).itemsToNextPack).toBeNull()
  })

  it('stays quiet on an empty basket', () => {
    expect(calculatePricing([], launch).itemsToNextPack).toBeNull()
  })
})

describe('edge cases', () => {
  it('returns zeroes for an empty basket', () => {
    const result = calculatePricing([], launch)
    expect(result).toMatchObject({ subtotal: 0, packDiscount: 0, total: 0, packsFormed: 0 })
  })

  it('ignores a line with a zero or negative quantity', () => {
    const lines: PricingLine[] = [{ productId: 1, unitPrice: 8000, quantity: 0, packEligible: true }]
    expect(calculatePricing(lines, launch).total).toBe(0)
  })

  it('only ever produces integers', () => {
    const result = calculatePricing(jerseys(3, 8333), { ...launch, packPrice: 13333 })
    for (const value of [result.subtotal, result.packDiscount, result.shippingFee, result.total]) {
      expect(Number.isInteger(value)).toBe(true)
    }
  })
})
