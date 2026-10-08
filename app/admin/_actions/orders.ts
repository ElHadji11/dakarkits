'use server'

import { and, eq, inArray } from 'drizzle-orm'
import { refresh, updateTag } from 'next/cache'
import { z } from 'zod'

import type { ActionState } from '@/lib/action-state'
import { requireAdmin } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { orderItems, orders, productSizes } from '@/lib/db/schema'
import { stockChanges, stockDirection, type SizeRow } from '@/lib/stock'

const schema = z.object({
  id: z.coerce.number().int().positive(),
  status: z.enum(['new', 'delivered', 'cancelled']),
  reason: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
    z.string().trim().max(300).nullable(),
  ),
})

/**
 * Moves an order and its stock together, in one transaction. Either both land
 * or neither does — a delivered order that failed to decrement would quietly
 * oversell the next customer.
 */
export async function changeOrderStatus(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin()

  const parsed = schema.safeParse({
    id: formData.get('id'),
    status: formData.get('status'),
    reason: formData.get('reason'),
  })
  if (!parsed.success) return { ok: false, error: 'Requête invalide.' }

  const { id, status, reason } = parsed.data
  if (status === 'cancelled' && !reason) {
    return { ok: false, error: 'Indique le motif de l’annulation.' }
  }

  try {
    const touched = await db.transaction(async (tx) => {
      const [order] = await tx.select().from(orders).where(eq(orders.id, id)).limit(1)
      if (!order) throw new Error('Order not found')
      if (order.status === status) return []

      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, id))
      const direction = stockDirection(order.status, status)

      let changed: number[] = []
      if (direction !== 0) {
        const productIds = [...new Set(items.map((item) => item.productId))]
        const rows = await tx
          .select()
          .from(productSizes)
          .where(inArray(productSizes.productId, productIds))

        const sizes: SizeRow[] = rows.map((row) => ({
          productId: row.productId,
          size: row.size,
          available: row.available,
          quantity: row.quantity,
        }))

        const changes = stockChanges(
          sizes,
          items.map((item) => ({
            productId: item.productId,
            size: item.size,
            quantity: item.quantity,
          })),
          direction,
        )

        for (const change of changes) {
          await tx
            .update(productSizes)
            .set({ quantity: change.quantity, available: change.available })
            .where(
              and(
                eq(productSizes.productId, change.productId),
                eq(productSizes.size, change.size),
              ),
            )
        }

        changed = changes.map((change) => change.productId)
      }

      await tx
        .update(orders)
        .set({
          status,
          cancelReason: status === 'cancelled' ? reason : null,
          deliveredAt: status === 'delivered' ? new Date() : null,
          cancelledAt: status === 'cancelled' ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, id))

      return changed
    })

    // A size that just unticked itself has to grey out in the shop now, not in
    // thirty days: the catalogue and every product page are cached under this tag.
    if (touched.length > 0) updateTag('catalog')
    refresh()
    return { ok: true, error: null }
  } catch (error) {
    console.error('[orders] status change failed', error)
    return { ok: false, error: 'Impossible de changer le statut. Réessaie.' }
  }
}
