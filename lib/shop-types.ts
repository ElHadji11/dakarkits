import type { Size } from '@/lib/constants'

/**
 * Shapes shared by the server queries and the client components.
 * Kept out of `lib/shop.ts` so a client bundle never reaches a `server-only`
 * module just to borrow a type.
 */

export type ShopSize = {
  size: Size
  available: boolean
  quantity: number | null
}

export type ShopProduct = {
  id: number
  slug: string
  title: string
  price: number
  compareAtPrice: number | null
  isRetro: boolean
  packEligible: boolean
  season: string | null
  kitType: 'home' | 'away' | 'third' | null
  teamId: number | null
  teamName: string | null
  teamType: 'club' | 'national' | null
  leagueId: number | null
  leagueName: string | null
  imageUrl: string | null
  sizes: ShopSize[]
  /** Normalised once on the server; powers both search and filtering. */
  haystack: string
  createdAt: string
}

export type ShopProductDetail = ShopProduct & {
  description: string | null
  images: Array<{ id: number; url: string }>
}

export type ShopSettings = {
  packEnabled: boolean
  packSize: number
  packPrice: number
  shippingMode: 'fee' | 'included'
  shippingFee: number
  lowStockThreshold: number
  shopPhone: string | null
  shopWhatsapp: string | null
}

export type Category = 'clubs' | 'selections' | 'retro'

export const CATEGORIES: Array<{ value: Category; label: string; href: string }> = [
  { value: 'clubs', label: 'Clubs', href: '/' },
  { value: 'selections', label: 'Sélections', href: '/selections' },
  { value: 'retro', label: 'Rétro', href: '/retro' },
]

/**
 * Which tab a jersey shows under.
 *
 * Rétro is a mood, not an exclusive bucket: a retro Barcelona shirt belongs in
 * Clubs *and* Rétro. "Clubs" also catches jerseys with no team at all, so that
 * nothing published can end up unreachable — team is an optional field.
 */
export function inCategory(product: ShopProduct, category: Category): boolean {
  if (category === 'retro') return product.isRetro
  if (category === 'selections') return product.teamType === 'national'
  return product.teamType !== 'national'
}

/** A jersey with sizes but none ticked is sold out; with no sizes at all it is not. */
export function isSoldOut(product: ShopProduct): boolean {
  return product.sizes.length > 0 && product.sizes.every((size) => !size.available)
}

export function orderableSizes(product: ShopProduct): ShopSize[] {
  return product.sizes.filter((size) => size.available)
}

export function isOnSale(product: ShopProduct): boolean {
  return product.compareAtPrice !== null && product.compareAtPrice > product.price
}

/**
 * Remise en pourcentage entier, arrondie au plus proche. Renvoie `null` si le
 * maillot n'est pas en promotion — et aussi si la remise tombe à 0 % après
 * arrondi, parce qu'un badge « -0 % » est pire que pas de badge.
 */
export function discountPercent(product: ShopProduct): number | null {
  if (!isOnSale(product)) return null
  const percent = Math.round(
    ((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100,
  )
  return percent > 0 ? percent : null
}
