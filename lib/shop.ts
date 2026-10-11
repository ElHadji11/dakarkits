import 'server-only'

import { and, asc, desc, eq } from 'drizzle-orm'
import { cacheLife, cacheTag } from 'next/cache'

import { buildHaystack } from '@/lib/search'
import { db } from '@/lib/db'
import {
  leagues,
  packTiers,
  productImages,
  productSizes,
  products,
  settings,
  teams,
} from '@/lib/db/schema'
import { kitTypeLabel } from '@/lib/shop-types'
import type { ShopHero, ShopProduct, ShopProductDetail, ShopSettings } from '@/lib/shop-types'

export type {
  Category,
  ShopHero,
  ShopProduct,
  ShopProductDetail,
  ShopSettings,
  ShopSize,
} from '@/lib/shop-types'

/**
 * The whole published catalogue, cached until an admin mutation calls
 * `updateTag('catalog')`. The pages that use it are prerendered, so a phone on
 * 4G gets HTML straight from the CDN and filters without a round trip.
 */
export async function getCatalog(): Promise<ShopProduct[]> {
  'use cache'
  cacheLife('max')
  cacheTag('catalog')

  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      title: products.title,
      price: products.price,
      compareAtPrice: products.compareAtPrice,
      isRetro: products.isRetro,
      packEligible: products.packEligible,
      season: products.season,
      kitType: products.kitType,
      teamId: products.teamId,
      teamName: teams.name,
      teamType: teams.type,
      teamAliases: teams.aliases,
      leagueId: leagues.id,
      leagueName: leagues.name,
      createdAt: products.createdAt,
    })
    .from(products)
    .leftJoin(teams, eq(products.teamId, teams.id))
    .leftJoin(leagues, eq(teams.leagueId, leagues.id))
    .where(eq(products.status, 'published'))
    .orderBy(desc(products.createdAt))

  if (rows.length === 0) return []

  const [sizes, images] = await Promise.all([
    db.select().from(productSizes).orderBy(asc(productSizes.id)),
    db
      .select()
      .from(productImages)
      .orderBy(asc(productImages.position), asc(productImages.id)),
  ])

  return rows.map((row) => {
    const primary =
      images.find((image) => image.productId === row.id && image.isPrimary) ??
      images.find((image) => image.productId === row.id) ??
      null

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      price: row.price,
      compareAtPrice: row.compareAtPrice,
      isRetro: row.isRetro,
      packEligible: row.packEligible,
      season: row.season,
      kitType: row.kitType,
      teamId: row.teamId,
      teamName: row.teamName,
      teamType: row.teamType,
      leagueId: row.leagueId,
      leagueName: row.leagueName,
      imageUrl: primary?.url ?? null,
      sizes: sizes
        .filter((size) => size.productId === row.id)
        .map((size) => ({ size: size.size, available: size.available, quantity: size.quantity })),
      // `kitTypeLabel` et pas seulement `row.title` : le titre enregistré
      // n'est pas garanti au format (« Barcelona », « Chelsea »), et sans ça
      // une recherche sur « domicile » ou « extérieur » — les deux mots que le
      // nom affiché contient — ne trouvait rien.
      haystack: buildHaystack([
        row.title,
        row.teamName,
        row.leagueName,
        row.season,
        row.teamAliases,
        kitTypeLabel(row.kitType),
      ]),
      createdAt: row.createdAt.toISOString(),
    }
  })
}

export async function getProduct(slug: string): Promise<ShopProductDetail | null> {
  'use cache'
  cacheLife('max')
  cacheTag('catalog')

  const [row] = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.status, 'published')))
    .limit(1)

  if (!row) return null

  const catalog = await getCatalog()
  const summary = catalog.find((product) => product.id === row.id)
  if (!summary) return null

  const images = await db
    .select({ id: productImages.id, url: productImages.url })
    .from(productImages)
    .where(eq(productImages.productId, row.id))
    .orderBy(asc(productImages.position), asc(productImages.id))

  return { ...summary, description: row.description, images }
}

export async function getShopSettings(): Promise<ShopSettings> {
  'use cache'
  cacheLife('max')
  cacheTag('settings')

  const [[row], tiers] = await Promise.all([
    db.select().from(settings).where(eq(settings.id, 1)).limit(1),
    db.select().from(packTiers).orderBy(asc(packTiers.size)),
  ])
  if (!row) throw new Error('Settings row 1 is missing. Run `npm run db:seed`.')

  return {
    packEnabled: row.packEnabled,
    packTiers: tiers,
    shippingMode: row.shippingMode,
    shippingFee: row.shippingFee,
    lowStockThreshold: row.lowStockThreshold,
    shopPhone: row.shopPhone,
    shopWhatsapp: row.shopWhatsapp,
    hero: heroOf(row),
  }
}

/**
 * La bannière, ou `null`.
 *
 * Trois conditions, toutes nécessaires : la case cochée, un titre, un lien.
 * Le reste est facultatif — sans sous-titre la bannière se lit encore, sans
 * photo elle emprunte celle du maillot le plus récent du lien visé (voir
 * `ShopHero`). Rassembler le test ici, et pas dans le composant, évite qu'une
 * page le fasse et une autre l'oublie.
 */
function heroOf(row: {
  heroEnabled: boolean
  heroTitle: string | null
  heroSubtitle: string | null
  heroHref: string | null
  heroImageUrl: string | null
}): ShopHero | null {
  if (!row.heroEnabled || !row.heroTitle || !row.heroHref) return null

  return {
    title: row.heroTitle,
    subtitle: row.heroSubtitle,
    href: row.heroHref,
    imageUrl: row.heroImageUrl,
  }
}
