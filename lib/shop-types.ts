import { DELIVERY_ZONE, formatCfa, formatPhone, KIT_TYPES, type Size } from '@/lib/constants'
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
  /**
   * Les photos, dans l'ordre d'affichage. `blurDataURL` n'est rempli que sur
   * la première : c'est la seule qu'on attend, les autres restent hors écran
   * jusqu'au premier balayage. Voir `blurDataUrl` dans `lib/imagekit.ts`.
   */
  images: Array<{ id: number; url: string; blurDataURL: string | null }>
}

/**
 * La bannière d'accueil, telle que la boutique la rend.
 *
 * `null` dès qu'il manque quelque chose — case décochée, titre vide, lien
 * vide. Le composant n'a donc aucun cas partiel à gérer : il y a une bannière
 * ou il n'y en a pas. Une bannière à moitié remplie en haut de la page
 * d'accueil est pire que pas de bannière du tout.
 */
export type ShopHero = {
  title: string
  subtitle: string | null
  /** Chemin interne, garanti par la validation côté action. */
  href: string
  /** `null` : la bannière prend la photo du maillot le plus récent du lien. */
  imageUrl: string | null
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
  hero: ShopHero | null
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

/** « Domicile », « Extérieur », « Third » — ou null quand le type est absent. */
export function kitTypeLabel(kitType: ShopProduct['kitType']): string | null {
  return KIT_TYPES.find((option) => option.value === kitType)?.label ?? null
}

/** Ce qu'il faut savoir d'un maillot pour le nommer. */
export type NameableProduct = Pick<ShopProduct, 'title' | 'teamName' | 'kitType' | 'season'>

/**
 * Le nom d'un maillot, dans un seul format : « FC Barcelone · Domicile 2026/27 ».
 *
 * **Composé à l'affichage, jamais lu depuis `products.title`.** Le titre
 * enregistré a été saisi à la main ou proposé par l'IA sur des mois, et il
 * porte les traces de chaque passage : « Barcelona » sur une carte dont
 * l'équipe liée s'appelle « FC Barcelone », « Chelsea » répété deux fois parce
 * que le titre et le nom d'équipe disaient la même chose, « Aston villa third »
 * en minuscules et en anglais. Reconstruire le nom à partir de l'équipe liée,
 * du type de maillot et de la saison rend ces trois cas impossibles à
 * l'écran — et le jour où un titre est corrigé en base, l'affichage ne change
 * pas, parce qu'il n'en dépendait pas.
 *
 * Le titre enregistré reste le filet : un maillot sans équipe liée n'a pas de
 * nom à reconstruire. C'est aussi pour ça qu'il ne faut pas le supprimer de la
 * base — et que les lignes de commande continuent de le figer, puisqu'une
 * facture doit dire ce qui a été vendu ce jour-là, pas ce que le catalogue
 * raconte aujourd'hui.
 *
 * Le séparateur est un point médian et non un tiret : « Sénégal - Extérieur »
 * se lit comme un score.
 */
export function productName(product: NameableProduct): string {
  return composeName(product.teamName, product.kitType, product.season) ?? product.title
}

/**
 * Le format lui-même, à partir de trois valeurs brutes — donc utilisable là où
 * il n'y a pas encore de produit : `composeTitle` dans `lib/ai/suggest` s'en
 * sert pour que le titre proposé par l'IA naisse déjà au bon format, et le
 * script de reprise pour réécrire les titres déjà en base. Un seul endroit
 * décide de la forme, sinon l'IA et l'affichage divergent au premier
 * changement.
 */
export function composeName(
  team: string | null,
  kitType: ShopProduct['kitType'],
  season: string | null,
): string | null {
  if (!team) return null

  const qualifier = [kitTypeLabel(kitType), season].filter(Boolean).join(' ')
  return qualifier ? `${team} · ${qualifier}` : team
}

/**
 * Le sous-titre d'une carte : la ligue, et rien d'autre.
 *
 * Il portait le nom de l'équipe, que `productName` annonce déjà — d'où les
 * cartes « Chelsea / Chelsea ». La ligue est la seule information qui ajoute
 * quelque chose à ce moment-là, et elle est absente sur une sélection
 * nationale : une carte sans sous-titre est donc normale, pas un oubli.
 */
export function productSubtitle(
  product: Pick<ShopProduct, 'leagueName' | 'teamName'>,
): string | null {
  if (!product.leagueName) return null
  return product.leagueName === product.teamName ? null : product.leagueName
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
 *
 * La zone vient de `DELIVERY_ZONE` et non d’un « partout à Dakar » écrit ici :
 * elle se détaille dans `DELIVERY_ZONE_NOTICE`, et les deux doivent nommer la
 * même ligne. Cette phrase-ci dit *combien*, la notice dit *jusqu’où*.
 */
export function deliveryPromise(
  settings: Pick<ShopSettings, 'shippingMode' | 'shippingFee'>,
): string {
  const free = settings.shippingMode === 'included' || settings.shippingFee === 0
  return free
    ? `Livraison gratuite sur ${DELIVERY_ZONE}`
    : `Livraison sur ${DELIVERY_ZONE} : ${formatCfa(settings.shippingFee)}`
}

/**
 * La promesse de paiement, en une seule phrase et en un seul endroit.
 *
 * Même raison que `deliveryPromise` : la fiche produit, la page de
 * confirmation et les pages juridiques doivent dire la même chose. Wave est
 * cité en premier parce que c'est le moyen mis en avant ; Orange Money et les
 * espèces restent acceptés, et les taire ferait perdre les clients qui n'ont
 * pas Wave.
 *
 * Le numéro vient du réglage, jamais d'une constante : le jour où la boutique
 * change de ligne, elle le fait dans l'admin, pas dans un déploiement.
 */
export function paymentPromise(
  settings: Pick<ShopSettings, 'shopPhone'>,
  options: { withNumber?: boolean } = {},
): string {
  const number = settings.shopPhone ? formatPhone(settings.shopPhone) : null
  const wave = options.withNumber && number ? `Wave au ${number}` : 'Wave'
  return `${wave}, Orange Money ou espèces`
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
