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

/** Le nombre seul, séparateurs compris : « 8 000 ». */
function amount(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value).replace(/ | /g, ' ')
}

/** Francs CFA, always integers: "8 000 F". */
export function formatCfa(value: number): string {
  return `${amount(value)} F`
}

/**
 * « 2 000 à 3 000 F », et « 3 000 F » tout court quand les deux bornes se
 * rejoignent.
 *
 * Un seul « F », à la fin : « 2 000 F à 3 000 F » se lit comme deux montants
 * sans rapport. Les appelants n'ont donc pas à savoir s'ils tiennent un
 * intervalle ou un montant — la livraison hors zone en est un, celle de la
 * zone n'en est pas un, et c'est la même ligne de récapitulatif qui affiche
 * les deux.
 */
export function formatCfaRange(min: number, max: number): string {
  return min === max ? formatCfa(min) : `${amount(min)} à ${formatCfa(max)}`
}

/**
 * Le délai de livraison, en une seule phrase et en un seul endroit.
 *
 * Il vit ici et pas dans les réglages parce que ce n'est pas un prix : c'est
 * la promesse opérationnelle de la boutique, et elle ne change pas d'un
 * maillot à l'autre. Trois phrases se lisent côte à côte sur la fiche
 * produit, au moment où la taille est choisie : `deliveryPromise` dit
 * *combien* coûte la livraison, celle-ci dit *quand* elle arrive, et
 * `DELIVERY_ZONE` dit *jusqu'où*. Elle ne nomme plus la ville : la zone n'est
 * plus Dakar en entier, et deux phrases qui tracent deux zones différentes,
 * c'est une promesse de trop.
 */
export const DELIVERY_ETA = 'Livré en 24/48h'

/**
 * La zone de livraison : l'axe du BRT, pas Dakar en entier.
 *
 * La boutique livrait « gratuitement partout à Dakar ». Un seul livreur ne
 * tient pas cette promesse à l'échelle de l'agglomération, et une adresse
 * hors de portée se paie à la livraison — au moment où le client a le colis
 * en main et où un refus coûte le trajet. Le **gratuit** s'arrête donc à la
 * ligne du BRT, que tout le monde ici sait situer sans carte : on se repère à
 * sa station. Plus loin, c'est livré aussi, contre `OUTSIDE_ZONE_FEE`.
 *
 * Trois phrases, trois longueurs, et aucune réécrite ailleurs :
 *
 * - `DELIVERY_ZONE` tient dans le bandeau de l'en-tête, où il reste la moitié
 *   d'une ligne de 12 px ;
 * - `DELIVERY_ZONE_NOTICE` est la notice complète — les deux terminus, les 23
 *   stations, le rayon — pour la fiche produit, le panier et la commande ;
 * - `DELIVERY_ZONE_OUTSIDE` dit le prix d'en dehors. Les deux se lisent
 *   ensemble partout, sauf là où le choix de zone affiche déjà le forfait.
 *
 * Le rayon est annoncé « environ » exprès, comme les mesures du guide des
 * tailles : personne ne mesure 500 m au GPS devant un portail, et un chiffre
 * présenté comme exact fabriquerait un motif de dispute à la livraison.
 */
export const DELIVERY_ZONE = 'tout l’axe du BRT'

/**
 * Les 23 stations de la ligne, du terminus central à celui de la banlieue.
 *
 * Écrites une fois, dans l'ordre du trajet. Les CGV les énumèrent et le
 * formulaire de commande les déplie : deux listes recopiées à la main auraient
 * fini par ne plus dire la même chose, et c'est sur celle des CGV qu'on
 * s'appuierait le jour d'un désaccord. Le compte annoncé partout se déduit du
 * tableau, jamais écrit à côté : ajouter une station met à jour la phrase.
 */
export const BRT_STATIONS = [
  'Petersen – Papa Gueye Fall',
  'Place de la Nation',
  'Grande Mosquée',
  'Dial Diop',
  'Grand Dakar',
  'Liberté 1',
  'Sacré-Cœur',
  'Liberté 5',
  'Liberté 6',
  'Khar Yalla',
  'Scat Urbam',
  'Cardinal Hyacinthe Thiandoum',
  'Grand Médine',
  'Police des Parcelles',
  'Croisement 22',
  'Parcelles Assainies',
  'Ndingala',
  'Golf Sud',
  'Dalal Jam',
  'Golf Nord',
  'Gueule Tapée',
  'Fith Mith',
  'Préfecture de Guédiawaye',
] as const

/** Le nombre de stations, déduit de la liste et jamais écrit à la main. */
export const BRT_STATION_COUNT = BRT_STATIONS.length

/**
 * Le forfait hors zone, en intervalle parce que la distance varie.
 *
 * Annoncé des deux bornes, et jamais d'une seule : « à partir de 2 000 F »
 * n'engage à rien et laisse croire au pire, « 3 000 F » fait fuir celui qui
 * habite à deux rues de la ligne. Le montant exact est arrêté pendant l'appel
 * de confirmation, et **jamais au-dessus du maximum annoncé** — c'est ce
 * qu'écrivent les CGV, c'est donc ce que le livreur encaisse.
 *
 * La commande enregistre le plancher (`orders.shipping_fee`) et la zone
 * (`orders.delivery_zone`) : le haut de l'intervalle se recalcule de là, et
 * l'admin sait qu'il reste un montant à arrêter au téléphone.
 */
export const OUTSIDE_ZONE_FEE = { min: 2000, max: 3000 } as const

/** La notice complète : les deux terminus, les 23 stations, le rayon. */
export const DELIVERY_ZONE_NOTICE =
  `Nous livrons gratuitement le long du BRT, de Papa Gueye Fall (Petersen) à la Préfecture de Guédiawaye : les ${BRT_STATION_COUNT} stations de la ligne, et environ 500 m autour de chacune.`

/** Et pour qui habite plus loin : c'est livrable aussi, et voilà le prix. */
export const DELIVERY_ZONE_OUTSIDE =
  `En dehors, nous livrons quand même dans Dakar : ${formatCfaRange(OUTSIDE_ZONE_FEE.min, OUTSIDE_ZONE_FEE.max)} selon la distance, à régler avec le reste à la livraison.`

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
