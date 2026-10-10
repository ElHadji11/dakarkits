import { formatCfa, type Size } from '@/lib/constants'
import type { PackTier } from '@/lib/pricing'

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
  /** Le barème, trié par taille croissante. Vide quand il n'y a aucun palier. */
  packTiers: PackTier[]
  shippingMode: 'fee' | 'included'
  shippingFee: number
  lowStockThreshold: number
  shopPhone: string | null
  shopWhatsapp: string | null
}

export type Category = 'tous' | 'clubs' | 'selections' | 'retro'

export const CATEGORIES: Array<{ value: Category; label: string; href: string }> = [
  { value: 'tous', label: 'Tous', href: '/' },
  { value: 'clubs', label: 'Clubs', href: '/clubs' },
  { value: 'selections', label: 'Sélections', href: '/selections' },
  { value: 'retro', label: 'Rétro', href: '/retro' },
]

/**
 * Which tab a jersey shows under.
 *
 * Rétro is a mood, not an exclusive bucket: a retro Barcelona shirt belongs in
 * Clubs *and* Rétro. "Clubs" also catches jerseys with no team at all, so that
 * nothing published can end up unreachable — team is an optional field.
 *
 * « Tous » ne filtre rien : c'est l'onglet d'accueil, et le seul endroit où un
 * maillot publié est visible quoi qu'il arrive à son équipe.
 */
export function inCategory(product: ShopProduct, category: Category): boolean {
  if (category === 'tous') return true
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

/**
 * La promesse de livraison, en une seule phrase et en un seul endroit.
 *
 * Le bandeau de l’en-tête, la fiche produit et le panier la récitent tous les
 * trois : s’ils la formulaient chacun de leur côté, un passage en livraison
 * payante en laisserait un qui promet le gratuit alors que `calculatePricing`
 * facture. Un mode « frais » à 0 F est gratuit lui aussi — c’est ce que le
 * client paie qui compte, pas le nom du réglage.
 */
export function deliveryPromise(
  settings: Pick<ShopSettings, 'shippingMode' | 'shippingFee'>,
): string {
  const free = settings.shippingMode === 'included' || settings.shippingFee === 0
  return free
    ? 'Livraison gratuite partout à Dakar'
    : `Livraison à Dakar : ${formatCfa(settings.shippingFee)}`
}

/**
 * Le barème tel qu'il s'annonce : « 2 maillots au choix pour 13 000 F, 3 pour
 * 19 500 F ». Un seul endroit, parce que la fiche produit, le panier et les
 * bannières doivent citer les mêmes paliers — un palier ajouté dans l'admin et
 * oublié dans une phrase, c'est une promesse fausse.
 *
 * Les segments sortent séparés pour que l'appelant mette les montants en
 * `font-display` sans couper la phrase en plusieurs enfants d'un flex.
 */
export function packLadder(
  settings: Pick<ShopSettings, 'packEnabled' | 'packTiers'>,
): Array<{ size: number; lead: string; price: string }> {
  if (!settings.packEnabled) return []

  return settings.packTiers.map((tier, index) => ({
    size: tier.size,
    lead: index === 0 ? `${tier.size} maillots au choix pour ` : `${tier.size} pour `,
    price: formatCfa(tier.price),
  }))
}
