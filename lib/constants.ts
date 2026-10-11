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
