import 'server-only'

import { and, asc, count, desc, eq, gte, ilike, lte, or, sum, type SQL } from 'drizzle-orm'

import { db } from '@/lib/db'
import { orderItems, orders, products, teams } from '@/lib/db/schema'
import type { OrderStatus } from '@/lib/db/schema'

export type OrderWithItems = Awaited<ReturnType<typeof getOrderByToken>>

async function withItems(order: typeof orders.$inferSelect) {
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id))
    .orderBy(asc(orderItems.id))
  return { ...order, items }
}

/** Confirmation page: reached by an unguessable token, never by order number. */
export async function getOrderByToken(token: string) {
  if (!/^[a-f0-9]{32}$/.test(token)) return null

  const [order] = await db.select().from(orders).where(eq(orders.publicToken, token)).limit(1)
  if (!order) return null
  return withItems(order)
}

export async function getOrderByNumber(number: string) {
  const [order] = await db.select().from(orders).where(eq(orders.number, number)).limit(1)
  if (!order) return null
  return withItems(order)
}

/** Admin list: newest first, filterable by status, searchable by number, name or phone. */
export async function listOrders(options: { q?: string; status?: OrderStatus } = {}) {
  const filters: SQL[] = []

  const q = options.q?.trim()
  if (q) {
    const pattern = `%${q}%`
    filters.push(
      or(
        ilike(orders.number, pattern),
        ilike(orders.customerName, pattern),
        ilike(orders.phone, pattern),
      )!,
    )
  }
  if (options.status) filters.push(eq(orders.status, options.status))

  return db
    .select({
      id: orders.id,
      number: orders.number,
      customerName: orders.customerName,
      phone: orders.phone,
      status: orders.status,
      total: orders.total,
      createdAt: orders.createdAt,
      itemCount: count(orderItems.id),
    })
    .from(orders)
    .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(filters.length ? and(...filters) : undefined)
    .groupBy(orders.id)
    .orderBy(desc(orders.createdAt))
    .limit(200)
}

export type StatsRange = { from: Date; to: Date }

/** Everything the statistics screen shows, in one place. */
export async function getStats({ from, to }: StatsRange) {
  const inRange = and(gte(orders.createdAt, from), lte(orders.createdAt, to))!

  const [byStatus, revenue, topProducts, topTeams, byCampaign] = await Promise.all([
    db
      .select({ status: orders.status, orders: count(orders.id), amount: sum(orders.total) })
      .from(orders)
      .where(inRange)
      .groupBy(orders.status),

    db
      .select({ amount: sum(orders.total) })
      .from(orders)
      .where(and(inRange, eq(orders.status, 'delivered'))),

    db
      .select({
        title: orderItems.title,
        quantity: sum(orderItems.quantity),
        amount: sum(orderItems.unitPrice),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(inRange, eq(orders.status, 'delivered')))
      .groupBy(orderItems.title)
      .orderBy(desc(sum(orderItems.quantity)))
      .limit(10),

    db
      .select({
        team: teams.name,
        quantity: sum(orderItems.quantity),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .innerJoin(teams, eq(products.teamId, teams.id))
      .where(and(inRange, eq(orders.status, 'delivered')))
      .groupBy(teams.name)
      .orderBy(desc(sum(orderItems.quantity)))
      .limit(10),

    db
      .select({
        source: orders.utmSource,
        campaign: orders.utmCampaign,
        content: orders.utmContent,
        orders: count(orders.id),
        delivered: sum(orders.total),
      })
      .from(orders)
      .where(inRange)
      .groupBy(orders.utmSource, orders.utmCampaign, orders.utmContent)
      .orderBy(desc(count(orders.id)))
      .limit(20),
  ])

  const counts = { new: 0, delivered: 0, cancelled: 0 }
  for (const row of byStatus) counts[row.status] = Number(row.orders)

  const closed = counts.delivered + counts.cancelled

  return {
    counts,
    revenue: Number(revenue[0]?.amount ?? 0),
    /** Share of closed orders that actually got delivered. */
    deliveryRate: closed === 0 ? null : counts.delivered / closed,
    refusalRate: closed === 0 ? null : counts.cancelled / closed,
    topProducts: topProducts.map((row) => ({
      title: row.title,
      quantity: Number(row.quantity ?? 0),
      amount: Number(row.amount ?? 0),
    })),
    topTeams: topTeams.map((row) => ({ team: row.team, quantity: Number(row.quantity ?? 0) })),
    byCampaign: byCampaign.map((row) => ({
      source: row.source,
      campaign: row.campaign,
      content: row.content,
      orders: Number(row.orders),
      amount: Number(row.delivered ?? 0),
    })),
  }
}
