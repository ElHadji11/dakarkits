import 'server-only'

import { and, asc, desc, eq, ilike, inArray, or, sql, type SQL } from 'drizzle-orm'

import { db } from '@/lib/db'
import { leagues, productImages, productSizes, products, teams } from '@/lib/db/schema'

export type AdminProductRow = Awaited<ReturnType<typeof listProducts>>[number]
export type AdminProduct = NonNullable<Awaited<ReturnType<typeof getProduct>>>

export async function listLeagues() {
  return db.select().from(leagues).orderBy(asc(leagues.name))
}

export async function listTeams() {
  return db
    .select({
      id: teams.id,
      name: teams.name,
      slug: teams.slug,
      type: teams.type,
      leagueId: teams.leagueId,
      leagueName: leagues.name,
      logoUrl: teams.logoUrl,
      aliases: teams.aliases,
    })
    .from(teams)
    .leftJoin(leagues, eq(teams.leagueId, leagues.id))
    .orderBy(asc(teams.name))
}

/** Admin list: search by title or team, filter by status, sizes at a glance. */
export async function listProducts(options: { q?: string; status?: 'draft' | 'published' } = {}) {
  const filters: SQL[] = []

  const q = options.q?.trim()
  if (q) {
    const pattern = `%${q}%`
    filters.push(or(ilike(products.title, pattern), ilike(teams.name, pattern))!)
  }
  if (options.status) {
    filters.push(eq(products.status, options.status))
  }

  const rows = await db
    .select({
      id: products.id,
      title: products.title,
      slug: products.slug,
      price: products.price,
      compareAtPrice: products.compareAtPrice,
      status: products.status,
      isRetro: products.isRetro,
      packEligible: products.packEligible,
      season: products.season,
      kitType: products.kitType,
      createdAt: products.createdAt,
      teamName: teams.name,
    })
    .from(products)
    .leftJoin(teams, eq(products.teamId, teams.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(products.createdAt))

  if (rows.length === 0) return []

  const ids = rows.map((row) => row.id)

  const [sizes, images] = await Promise.all([
    db
      .select()
      .from(productSizes)
      .where(inArray(productSizes.productId, ids))
      .orderBy(asc(productSizes.id)),
    db
      .select()
      .from(productImages)
      .where(inArray(productImages.productId, ids))
      .orderBy(asc(productImages.position), asc(productImages.id)),
  ])

  return rows.map((row) => ({
    ...row,
    sizes: sizes.filter((size) => size.productId === row.id),
    image: images.find((img) => img.productId === row.id && img.isPrimary) ??
      images.find((img) => img.productId === row.id) ??
      null,
  }))
}

export async function getProduct(id: number) {
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1)
  if (!product) return null

  const [sizes, images] = await Promise.all([
    db.select().from(productSizes).where(eq(productSizes.productId, id)),
    db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(asc(productImages.position), asc(productImages.id)),
  ])

  return { ...product, sizes, images }
}

export type StockAlert = {
  productId: number
  title: string
  size: string
  quantity: number
  /** Units promised by orders that are still open. */
  reserved: number
}

/**
 * Sizes that need attention: low on stock, or promised to more open orders
 * than there are items left. Only tracked sizes appear — an untracked one has
 * no count to be low on.
 */
export async function getStockAlerts(lowStockThreshold: number): Promise<StockAlert[]> {
  const result = await db.execute(sql`
    select
      ps.product_id            as "productId",
      p.title                  as title,
      ps.size::text            as size,
      ps.quantity              as quantity,
      coalesce(sum(oi.quantity) filter (where o.status = 'new'), 0)::int as reserved
    from product_sizes ps
    join products p on p.id = ps.product_id
    left join order_items oi
      on oi.product_id = ps.product_id and oi.size = ps.size
    left join orders o on o.id = oi.order_id
    where ps.quantity is not null
    group by ps.product_id, p.title, ps.size, ps.quantity
    having ps.quantity <= ${lowStockThreshold}
        or coalesce(sum(oi.quantity) filter (where o.status = 'new'), 0) > ps.quantity
    order by ps.quantity asc, p.title asc
  `)

  return result.rows as StockAlert[]
}
