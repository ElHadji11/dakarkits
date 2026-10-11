/**
 * Plain values shared by the schema, the Zod validators and client components.
 * Kept free of imports so a client bundle never pulls Drizzle in behind them.
 */

export const SIZES = ['S', 'M', 'L', 'XL', 'XXL'] as const
export type Size = (typeof SIZES)[number]

export const KIT_TYPES = [
  { value: 'home', label: 'Domicile' },
  { value: 'away', label: 'Extérieur' },
  { value: 'third', label: 'Third' },
] as const

export const TEAM_TYPES = [
  { value: 'club', label: 'Club' },
  { value: 'national', label: 'Sélection' },
] as const

/**
 * Les tailles de pack réglables dans l'admin. Le barème est un prix global par
 * nombre de maillots : 2 pour 13 000, 3 pour 19 500. Au-delà de six maillots,
 * le panier n'existe pas dans la vraie vie — et une ligne de plus au formulaire
 * est une ligne de plus à scroller sur un téléphone.
 */
export const PACK_TIER_SIZES = [2, 3, 4, 5, 6] as const

/** Le champ du formulaire de réglages qui porte le prix du pack de `size`. */
export function packPriceField(size: number): string {
  return `packPrice${size}`
}

/**
 * `+221774354688` -> `+221 77 435 46 88`.
 *
 * Partagé plutôt que recopié : le pied de page, la fiche produit et la page de
 * confirmation affichent le même numéro, et un numéro affiché de trois façons
 * différentes sur un même site n'inspire pas confiance quand c'est celui sur
 * lequel on demande d'envoyer de l'argent.
 */
export function formatPhone(value: string): string {
  const groups = value.replace(/\D/g, '').match(/^221(\d{2})(\d{3})(\d{2})(\d{2})$/)
  return groups ? `+221 ${groups[1]} ${groups[2]} ${groups[3]} ${groups[4]}` : value
}

export const PRODUCT_STATUSES = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'published', label: 'Publié' },
] as const

/**
 * Canonical origin, without a trailing slash. Used by `metadataBase`, the
 * sitemap and robots.txt — three places that must never disagree, or a shared
 * link points at one host and its canonical tag at another.
 */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://louyomb.com').replace(/\/+$/, '')
}

/** Francs CFA, always integers: "8 000 F". */
export function formatCfa(amount: number): string {
  return `${new Intl.NumberFormat('fr-FR').format(amount).replace(/ | /g, ' ')} F`
}

/**
 * Le délai de livraison, en une seule phrase et en un seul endroit.
 *
 * Il vit ici et pas dans les réglages parce que ce n'est pas un prix : c'est
 * la promesse opérationnelle de la boutique, et elle ne change pas d'un
 * maillot à l'autre. `deliveryPromise` dit *combien* coûte la livraison,
 * celle-ci dit *quand* elle arrive — les deux se lisent côte à côte sur la
 * fiche produit, au moment où la taille est choisie.
 */
export const DELIVERY_ETA = 'Livré en 24/48h à Dakar'

/**
 * Le guide des tailles, mesures à plat en centimètres.
 *
 * **Volontairement annoncé comme indicatif.** Ce sont des répliques venues de
 * plusieurs fournisseurs : deux maillots marqués « L » ne tombent pas au même
 * centimètre. Annoncer une mesure au centimètre près qu'on ne contrôle pas,
 * c'est fabriquer un motif de refus à la livraison — exactement ce que la
 * règle sur les photos cherche déjà à éviter.
 *
 * `chest` est la largeur d'une aisselle à l'autre, maillot posé à plat, donc
 * la moitié du tour de poitrine. `length` part de la base du col.
 */
export const SIZE_GUIDE = [
  { size: 'S', chest: '48–50', length: '68' },
  { size: 'M', chest: '51–53', length: '71' },
  { size: 'L', chest: '54–56', length: '74' },
  { size: 'XL', chest: '57–59', length: '76' },
  { size: 'XXL', chest: '60–62', length: '79' },
] as const
