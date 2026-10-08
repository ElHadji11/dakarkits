import { describe, expect, it } from 'vitest'

import { stockChanges, stockDirection, type SizeRow } from '@/lib/stock'

const sizes: SizeRow[] = [
  { productId: 1, size: 'M', available: true, quantity: 3 },
  { productId: 1, size: 'L', available: true, quantity: 1 },
  // No quantity: untracked, must never be touched.
  { productId: 1, size: 'XL', available: true, quantity: null },
  { productId: 2, size: 'M', available: true, quantity: 0 },
]

describe('which way the stock moves', () => {
  it('only moves when delivery starts or is undone', () => {
    expect(stockDirection('new', 'delivered')).toBe(-1)
    expect(stockDirection('cancelled', 'delivered')).toBe(-1)
    expect(stockDirection('delivered', 'new')).toBe(1)
    expect(stockDirection('delivered', 'cancelled')).toBe(1)
    expect(stockDirection('new', 'cancelled')).toBe(0)
    expect(stockDirection('cancelled', 'new')).toBe(0)
    expect(stockDirection('new', 'new')).toBe(0)
  })
})

describe('delivering an order', () => {
  it('decrements the tracked size', () => {
    const changes = stockChanges(sizes, [{ productId: 1, size: 'M', quantity: 2 }], -1)
    expect(changes).toEqual([{ productId: 1, size: 'M', quantity: 1, available: true }])
  })

  it('unticks a size that reaches zero', () => {
    const changes = stockChanges(sizes, [{ productId: 1, size: 'L', quantity: 1 }], -1)
    expect(changes).toEqual([{ productId: 1, size: 'L', quantity: 0, available: false }])
  })

  it('never goes below zero', () => {
    const changes = stockChanges(sizes, [{ productId: 1, size: 'L', quantity: 5 }], -1)
    expect(changes[0]!.quantity).toBe(0)
  })

  it('leaves an untracked size alone', () => {
    expect(stockChanges(sizes, [{ productId: 1, size: 'XL', quantity: 2 }], -1)).toEqual([])
  })

  it('leaves a jersey sold without sizes alone', () => {
    expect(stockChanges(sizes, [{ productId: 1, size: null, quantity: 1 }], -1)).toEqual([])
  })

  it('adds up several lines of the same size', () => {
    const changes = stockChanges(
      sizes,
      [
        { productId: 1, size: 'M', quantity: 1 },
        { productId: 1, size: 'M', quantity: 1 },
      ],
      -1,
    )
    expect(changes).toEqual([{ productId: 1, size: 'M', quantity: 1, available: true }])
  })

  it('ignores a size that does not belong to the product', () => {
    expect(stockChanges(sizes, [{ productId: 99, size: 'M', quantity: 1 }], -1)).toEqual([])
  })
})

describe('correcting a delivered order', () => {
  it('puts the stock back', () => {
    const changes = stockChanges(sizes, [{ productId: 1, size: 'M', quantity: 2 }], 1)
    expect(changes).toEqual([{ productId: 1, size: 'M', quantity: 5, available: true }])
  })

  it('reticks a size that had unticked itself at zero', () => {
    const changes = stockChanges(sizes, [{ productId: 2, size: 'M', quantity: 1 }], 1)
    expect(changes).toEqual([{ productId: 2, size: 'M', quantity: 1, available: true }])
  })

  it('round-trips: deliver then undo returns the original count', () => {
    const afterDelivery = stockChanges(sizes, [{ productId: 1, size: 'M', quantity: 2 }], -1)
    const restoredRows: SizeRow[] = sizes.map((row) => {
      const change = afterDelivery.find((c) => c.productId === row.productId && c.size === row.size)
      return change ? { ...row, quantity: change.quantity, available: change.available } : row
    })
    const afterUndo = stockChanges(restoredRows, [{ productId: 1, size: 'M', quantity: 2 }], 1)
    expect(afterUndo).toEqual([{ productId: 1, size: 'M', quantity: 3, available: true }])
  })
})
