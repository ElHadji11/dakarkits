/**
 * Every amount the shop shows and the order stores comes from here.
 * Francs CFA, integers only — the browser never gets to send a total.
 */
import { formatCfa, OUTSIDE_ZONE_FEE } from '@/lib/constants'

export type PricingLine = {
  productId: number
  unitPrice: number
  quantity: number
  packEligible: boolean
}

/** Un palier du barème : `size` maillots pour `price` francs, ensemble. */
export type PackTier = {
  size: number
  price: number
}

export type PricingSettings = {
  packEnabled: boolean
  /** Le barème. Non trié, doublons et paliers absurdes acceptés en entrée. */
  packTiers: PackTier[]
  shippingMode: 'fee' | 'included'
  shippingFee: number
}

/**
 * Où le client se fait livrer : sur l'axe du BRT, ou en dehors.
 *
 * Ce n'est pas une adresse, c'est une déclaration — celle que le formulaire
 * de commande demande en deux cartes à cocher. Elle change le total, donc elle
 * passe par ici et jamais par un prix envoyé depuis le navigateur.
 */
export type DeliveryZone = 'brt' | 'outside'

export type PricingResult = {
  /** Sum of the unit prices, before any pack discount. */
  subtotal: number
  /** Always positive or zero; subtotal − packDiscount is what the items cost. */
  packDiscount: number
  /** Le plancher de la livraison, et le seul montant que la commande fige. */
  shippingFee: number
  /** Son plafond. Égal à `shippingFee` partout sauf hors zone. */
  shippingFeeMax: number
  total: number
  /** Le total au plafond. Égal à `total` quand la livraison n'est pas un intervalle. */
  totalMax: number
  /** How many complete packs the basket earned, for the wording. */
  packsFormed: number
  zone: DeliveryZone
}

/**
 * Ce que coûte la livraison, des deux bornes.
 *
 * Dans la zone, les deux bornes sont le réglage de la boutique — souvent 0 F,
 * c'est la promesse en vitrine. En dehors, c'est le forfait, pris au plus haut
 * des deux : si la boutique repassait un jour à une livraison payante plus
 * chère que le forfait, sortir de la zone reviendrait moins cher que d'y
 * rester, ce qui n'a aucun sens à annoncer — même raison que le barème des
 * packs, où le prix au maillot ne remonte jamais.
 */
export function shippingRange(
  settings: Pick<PricingSettings, 'shippingMode' | 'shippingFee'>,
  zone: DeliveryZone,
): { min: number; max: number } {
  const base = settings.shippingMode === 'fee' ? settings.shippingFee : 0
  if (zone !== 'outside') return { min: base, max: base }
  return {
    min: Math.max(base, OUTSIDE_ZONE_FEE.min),
    max: Math.max(base, OUTSIDE_ZONE_FEE.max),
  }
}

/**
 * Le plafond d'une commande déjà enregistrée, reconstitué de ce qu'elle stocke.
 *
 * Une commande fige un entier, pas un intervalle : `shipping_fee` porte le
 * plancher et `delivery_zone` dit s'il y en avait un. La page de confirmation
 * et l'admin relisent donc le haut ici, au lieu d'ajouter une colonne pour un
 * montant qui sera de toute façon arrêté au téléphone.
 */
export function storedShippingMax(shippingFee: number, zone: string | null): number {
  return zone === 'outside' ? Math.max(shippingFee, OUTSIDE_ZONE_FEE.max) : shippingFee
}

/**
 * Ce qu'un maillot de plus ferait gagner, tel que le panier le raconte.
 *
 * Volontairement exprimé en « ce que tu paierais » contre « ce que tu paierais
 * sinon » : un pourcentage ou une remise abstraite n'aide personne à décider.
 */
export type PackNudge = {
  /** Combien de maillots ajouter pour y arriver. */
  itemsNeeded: number
  /** Combien de maillots éligibles le panier compterait alors. */
  totalItems: number
  /** Ce que ces maillots coûteraient, barème appliqué. */
  packPrice: number
  /** Ce qu'ils coûteraient en ajoutant au prix affiché. Toujours plus. */
  insteadOf: number
}

/** Les paliers exploitables, dédoublonnés et triés : le barème utilisable. */
export function usableTiers(settings: PricingSettings): PackTier[] {
  if (!settings.packEnabled) return []

  const bySize = new Map<number, number>()
  for (const tier of settings.packTiers) {
    if (!Number.isInteger(tier.size) || tier.size < 2) continue
    if (!Number.isInteger(tier.price) || tier.price <= 0) continue
    bySize.set(tier.size, tier.price)
  }

  return [...bySize]
    .map(([size, price]) => ({ size, price }))
    .sort((a, b) => a.size - b.size)
}

/**
 * Ce qui cloche dans un barème, un message par palier fautif.
 *
 * Deux règles, et elles disent la même chose de deux façons : un pack plus
 * grand ne peut ni coûter moins cher en tout, ni revenir plus cher au maillot
 * que le pack d'en dessous. Sans la seconde, l'admin peut recréer exactement ce
 * qui n'allait pas — trois maillots à 21 000 F, soit 7 000 F pièce contre
 * 6 500 F dans la paire.
 *
 * `calculatePricing` s'en sortirait : il prend toujours le moins cher pour le
 * client, donc un palier bancal ne serait simplement jamais appliqué. Mais la
 * fiche produit et le panier, eux, l'annonceraient — une offre que personne n'a
 * intérêt à prendre, affichée comme un avantage.
 *
 * Les comparaisons se font en multiplications croisées, jamais en divisions :
 * francs CFA, entiers, pas de flottant.
 */
export function ladderIssues(tiers: PackTier[]): Array<{ size: number; message: string }> {
  const sorted = [...tiers].sort((a, b) => a.size - b.size)
  const issues: Array<{ size: number; message: string }> = []

  for (let i = 1; i < sorted.length; i += 1) {
    const smaller = sorted[i - 1]!
    const bigger = sorted[i]!

    if (bigger.price < smaller.price) {
      issues.push({
        size: bigger.size,
        message:
          `Le pack de ${bigger.size} ne peut pas coûter moins cher que ` +
          `celui de ${smaller.size}.`,
      })
      continue
    }

    if (bigger.price * smaller.size > smaller.price * bigger.size) {
      issues.push({
        size: bigger.size,
        message:
          `Le pack de ${bigger.size} ne doit pas dépasser ` +
          `${formatCfa(Math.floor((smaller.price * bigger.size) / smaller.size))}, sinon le ` +
          `maillot y coûte plus cher que dans celui de ${smaller.size}.`,
      })
    }
  }

  return issues
}

/** Les prix éligibles du panier, un par maillot, du plus cher au moins cher. */
function eligiblePrices(lines: PricingLine[]): number[] {
  return expand(lines, true).sort((a, b) => b - a)
}

function expand(lines: PricingLine[], eligible: boolean): number[] {
  return lines
    .filter((line) => line.packEligible === eligible)
    .flatMap((line) => Array<number>(Math.max(0, line.quantity)).fill(line.unitPrice))
}

/**
 * Le moins cher qu'on puisse facturer ces maillots sous ce barème.
 *
 * Programmation dynamique sur les préfixes de la liste triée décroissante :
 * `best[i]` est le minimum pour les `i` maillots les plus chers, atteint soit
 * en laissant le i-ème payer son prix, soit en refermant derrière lui un
 * palier de `size` maillots — qui paie `min(prix du palier, somme réelle)`,
 * jamais plus que sans lui.
 *
 * Deux raisons de ne regarder que des groupes contigus dans cet ordre. Un
 * palier fait gagner `max(0, somme − prix)`, donc concentrer les maillots les
 * plus chers dans le même groupe maximise le gain ; et échanger deux maillots
 * entre groupes de tailles données ne peut pas faire mieux que l'ordre trié.
 * Ce qui en sort est donc le minimum, pas un choix glouton.
 *
 * Un seul palier de deux redonne exactement l'ancien calcul, paire par paire.
 */
function cheapest(prices: number[], tiers: PackTier[]): { cost: number; packsFormed: number } {
  const count = prices.length

  // sums[i] = prix des i maillots les plus chers, pour lire une tranche en O(1).
  const sums = Array<number>(count + 1).fill(0)
  for (let i = 1; i <= count; i += 1) sums[i] = sums[i - 1]! + prices[i - 1]!

  const best = Array<number>(count + 1).fill(0)
  const packs = Array<number>(count + 1).fill(0)

  for (let i = 1; i <= count; i += 1) {
    // Ce maillot-là paie son prix, les précédents font ce qu'ils peuvent.
    best[i] = best[i - 1]! + prices[i - 1]!
    packs[i] = packs[i - 1]!

    for (const tier of tiers) {
      if (tier.size > i) continue
      const group = sums[i]! - sums[i - tier.size]!
      // Un palier plus cher que la somme réelle ne s'applique jamais.
      const paid = Math.min(tier.price, group)
      const total = best[i - tier.size]! + paid
      if (total < best[i]!) {
        best[i] = total
        packs[i] = packs[i - tier.size]! + (paid < group ? 1 : 0)
      }
    }
  }

  return { cost: best[count]!, packsFormed: packs[count]! }
}

/**
 * Pack rule: the eligible items, each quantity counting as that many items,
 * are charged at whatever the tier table makes cheapest. Items left over pay
 * full price, and a tier is never applied when it costs more than the jerseys
 * it covers. Non-eligible jerseys stay out of it entirely.
 */
export function calculatePricing(
  lines: PricingLine[],
  settings: PricingSettings,
  zone: DeliveryZone = 'brt',
): PricingResult {
  const eligible = eligiblePrices(lines)
  const rest = expand(lines, false)

  const sum = (prices: number[]) => prices.reduce((total, price) => total + price, 0)
  const eligibleFull = sum(eligible)
  const subtotal = eligibleFull + sum(rest)

  const { cost, packsFormed } = cheapest(eligible, usableTiers(settings))
  const discount = eligibleFull - cost

  const shipping = shippingRange(settings, zone)
  const goods = subtotal - discount

  return {
    subtotal,
    packDiscount: discount,
    shippingFee: shipping.min,
    shippingFeeMax: shipping.max,
    total: goods + shipping.min,
    totalMax: goods + shipping.max,
    packsFormed,
    zone,
  }
}

/**
 * De quoi écrire « Ajoute un maillot : 19 500 F les 3 au lieu de 21 000 F ».
 *
 * Le panier compare ce que coûteraient `n + m` maillots au barème et ce qu'ils
 * coûteraient en payant les `m` ajoutés à leur prix affiché, et retient le plus
 * petit `m` qui fait gagner quelque chose. Tout le barème y passe, pas
 * seulement le palier suivant : avec un seul palier de trois, un panier d'un
 * maillot n'a rien à gagner en en ajoutant un, et tout à gagner en ajoutant
 * deux.
 *
 * Rien n'est inventé : `cheapestEligible` est le vrai prix du maillot éligible
 * le moins cher en vente, donc le minimum que l'ajout puisse coûter. Renvoie
 * `null` quand il n'y a rien à gagner — pousser un panier déjà au mieux est du
 * bruit.
 */
export function nextPackStep(
  lines: PricingLine[],
  settings: PricingSettings,
  cheapestEligible: number | null,
): PackNudge | null {
  const tiers = usableTiers(settings)
  if (tiers.length === 0) return null
  if (cheapestEligible === null || cheapestEligible <= 0) return null

  const eligible = eligiblePrices(lines)
  // Panier vide : la page montre son état vide, pas une offre.
  if (eligible.length === 0) return null

  const current = cheapest(eligible, tiers).cost
  const largest = tiers[tiers.length - 1]!.size

  for (let added = 1; added <= largest; added += 1) {
    const prices = [...eligible, ...Array<number>(added).fill(cheapestEligible)].sort(
      (a, b) => b - a,
    )
    const withMore = cheapest(prices, tiers).cost
    const insteadOf = current + added * cheapestEligible

    if (withMore < insteadOf) {
      return {
        itemsNeeded: added,
        totalItems: prices.length,
        packPrice: withMore,
        insteadOf,
      }
    }
  }

  return null
}
