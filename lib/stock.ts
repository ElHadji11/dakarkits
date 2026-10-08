import type { Size } from '@/lib/constants'

export type SizeRow = {
  productId: number
  size: Size | null
  available: boolean
  /** Null means no stock tracking at all: never counted, never decremented. */
  quantity: number | null
}

export type OrderLine = {
  productId: number
  size: Size | null
  quantity: number
}

export type StockChange = {
  productId: number
  size: Size
  quantity: number
  available: boolean
}

/**
 * What a status change does to the stock.
 *
 * `direction` is -1 when an order becomes delivered and +1 when that is undone.
 * Only sizes with a quantity are touched — an untracked size has no count, no
 * alert and no decrement, by design. A tracked size that reaches zero unticks
 * itself; restoring it above zero ticks it back, because the only reason it was
 * unticked was the count running out.
 */
export function stockChanges(
  sizes: SizeRow[],
  lines: OrderLine[],
  direction: -1 | 1,
): StockChange[] {
  const changes = new Map<string, StockChange>()

  for (const line of lines) {
    if (line.size === null) continue

    const row = sizes.find((size) => size.productId === line.productId && size.size === line.size)
    if (!row || row.quantity === null || row.size === null) continue

    const key = `${line.productId}:${line.size}`
    const current = changes.get(key)?.quantity ?? row.quantity
    // Never below zero: an admin who marks two orders delivered for one item in
    // stock should end at zero, not at minus one.
    const next = Math.max(0, current + direction * line.quantity)

    changes.set(key, {
      productId: line.productId,
      size: line.size,
      quantity: next,
      available: next > 0,
    })
  }

  return [...changes.values()]
}

/** Stock is held only while an order is delivered. */
export function stockDirection(
  previous: 'new' | 'delivered' | 'cancelled',
  next: 'new' | 'delivered' | 'cancelled',
): -1 | 1 | 0 {
  if (previous === next) return 0
  if (next === 'delivered') return -1
  if (previous === 'delivered') return 1
  return 0
}
