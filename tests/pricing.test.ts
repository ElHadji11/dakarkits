import { describe, expect, it } from 'vitest'

import {
  calculatePricing,
  ladderIssues,
  nextPackStep,
  storedShippingMax,
  usableTiers,
  type PricingLine,
  type PricingSettings,
} from '@/lib/pricing'
import { OUTSIDE_ZONE_FEE } from '@/lib/constants'

/**
 * Le barème en service : 8 000 F le maillot, 13 000 F les deux, 19 500 F les
 * trois. La livraison ne compte pas ici, pour que chaque total lise le barème
 * et rien d'autre.
 */
const launch: PricingSettings = {
  packEnabled: true,
  packTiers: [
    { size: 2, price: 13000 },
    { size: 3, price: 19500 },
  ],
  shippingMode: 'included',
  shippingFee: 0,
}

/** L'ancien pack à un seul palier, celui qui faisait payer le troisième 8 000 F. */
const singleTier: PricingSettings = { ...launch, packTiers: [{ size: 2, price: 13000 }] }

const jerseys = (quantity: number, unitPrice = 8000): PricingLine[] => [
  { productId: 1, unitPrice, quantity, packEligible: true },
]

describe('le barème en service', () => {
  it.each([
    [1, 8000],
    [2, 13000],
    [3, 19500],
    [4, 26000],
    [5, 32500],
    [6, 39000],
    [7, 45500],
  ])('%i maillot(s) coûte %i F', (count, expected) => {
    expect(calculatePricing(jerseys(count), launch).total).toBe(expected)
  })

  /** Le prix au maillot pour 1, 2, 3… maillots identiques. */
  const unitPrices = (settings: PricingSettings, upTo = 9) =>
    Array.from(
      { length: upTo },
      (_, i) => calculatePricing(jerseys(i + 1), settings).total / (i + 1),
    )

  it('ne laisse jamais le prix au maillot remonter', () => {
    // Le reproche exact fait à l'ancien pack, et la seule garantie qui tienne :
    // en prendre un de plus ne doit jamais renchérir ceux qu'on avait déjà.
    //
    // Le coût marginal, lui, ne peut pas être monotone : 8 000, puis 5 000,
    // puis 6 500. La paire à 13 000 F revient à 6 500 F pièce, donc le deuxième
    // maillot absorbe la remise du premier. Aucun barème à prix global n'y
    // échappe, sauf à vendre le maillot seul 6 500 F.
    const unit = unitPrices(launch)
    for (let i = 1; i < unit.length; i += 1) {
      expect(unit[i]!).toBeLessThanOrEqual(unit[i - 1]!)
    }
    expect(unit.slice(1)).toEqual(Array<number>(unit.length - 1).fill(6500))
  })

  it('est exactement ce que l’ancien pack à un seul palier ne faisait pas', () => {
    // 8 000, 6 500, puis 7 000 : le troisième maillot renchérissait les deux
    // premiers. Le bug, écrit noir sur blanc.
    expect(unitPrices(singleTier, 3)).toEqual([8000, 6500, 7000])
    expect(unitPrices(launch, 3)).toEqual([8000, 6500, 6500])
  })
})

describe('ce que corrige le palier de trois', () => {
  it('faisait payer 21 000 F les trois avec un seul palier', () => {
    expect(calculatePricing(jerseys(3), singleTier).total).toBe(21000)
  })

  it('les fait payer 19 500 F avec le barème', () => {
    expect(calculatePricing(jerseys(3), launch).total).toBe(19500)
  })
})

describe('formation des paliers', () => {
  it('groupe les maillots les plus chers ensemble, ce qui fait gagner le plus', () => {
    // 9000+9000 bat le pack de deux (5 000 F gagnés) ; 4000+4000 ne l'atteint pas.
    const lines: PricingLine[] = [
      { productId: 1, unitPrice: 9000, quantity: 2, packEligible: true },
      { productId: 2, unitPrice: 4000, quantity: 2, packEligible: true },
    ]
    const result = calculatePricing(lines, singleTier)
    expect(result.subtotal).toBe(26000)
    expect(result.packDiscount).toBe(5000)
    expect(result.total).toBe(21000)
    expect(result.packsFormed).toBe(1)
  })

  it('combine les paliers quand c’est moins cher que de les répéter', () => {
    // Cinq maillots : 3 + 2 à 32 500 F, mieux que 2 + 2 + 1 à 34 000 F.
    expect(calculatePricing(jerseys(5), launch).total).toBe(32500)
    expect(calculatePricing(jerseys(5), launch).packsFormed).toBe(2)
  })

  it('ne facture jamais un palier plus cher que les maillots qu’il couvre', () => {
    const lines: PricingLine[] = [
      { productId: 1, unitPrice: 5000, quantity: 2, packEligible: true },
    ]
    const result = calculatePricing(lines, launch)
    expect(result.packDiscount).toBe(0)
    expect(result.total).toBe(10000)
  })

  it('choisit le palier le moins cher sur un panier à prix mixtes', () => {
    // 10 000 + 8 000 + 8 000 : les trois au palier (19 500) battent la paire
    // des deux plus chers (13 000) suivie d'un maillot plein (8 000).
    const lines: PricingLine[] = [
      { productId: 1, unitPrice: 10000, quantity: 1, packEligible: true },
      { productId: 2, unitPrice: 8000, quantity: 2, packEligible: true },
    ]
    const result = calculatePricing(lines, launch)
    expect(result.subtotal).toBe(26000)
    expect(result.total).toBe(19500)
  })

  it('laisse les maillots non éligibles entièrement hors du barème', () => {
    const lines: PricingLine[] = [
      { productId: 1, unitPrice: 8000, quantity: 1, packEligible: true },
      { productId: 2, unitPrice: 8000, quantity: 1, packEligible: false },
    ]
    const result = calculatePricing(lines, launch)
    expect(result.packDiscount).toBe(0)
    expect(result.total).toBe(16000)
  })

  it('compte une ligne de quantité 2 exactement comme deux lignes de un', () => {
    const asOneLine = calculatePricing(jerseys(2), launch)
    const asTwoLines = calculatePricing(
      [
        { productId: 1, unitPrice: 8000, quantity: 1, packEligible: true },
        { productId: 2, unitPrice: 8000, quantity: 1, packEligible: true },
      ],
      launch,
    )
    expect(asOneLine.total).toBe(asTwoLines.total)
  })

  it('facture plein tarif quand le pack est éteint', () => {
    const result = calculatePricing(jerseys(4), { ...launch, packEnabled: false })
    expect(result.packDiscount).toBe(0)
    expect(result.total).toBe(32000)
  })
})

describe('les paliers exploitables', () => {
  it('trie, dédoublonne et jette ce qui n’a pas de sens', () => {
    const settings: PricingSettings = {
      ...launch,
      packTiers: [
        { size: 3, price: 19500 },
        { size: 2, price: 13000 },
        { size: 2, price: 12000 },
        { size: 1, price: 7000 },
        { size: 4, price: 0 },
      ],
    }
    expect(usableTiers(settings)).toEqual([
      { size: 2, price: 12000 },
      { size: 3, price: 19500 },
    ])
  })

  it('n’en garde aucun quand le pack est éteint', () => {
    expect(usableTiers({ ...launch, packEnabled: false })).toEqual([])
  })
})

describe('ce que l’admin a le droit d’enregistrer', () => {
  const sizes = (tiers: Array<{ size: number; price: number }>) =>
    ladderIssues(tiers).map((issue) => issue.size)

  it('accepte le barème en service', () => {
    expect(ladderIssues(launch.packTiers)).toEqual([])
  })

  it('accepte un seul palier, qui n’a rien à contredire', () => {
    expect(ladderIssues([{ size: 3, price: 25000 }])).toEqual([])
    expect(ladderIssues([])).toEqual([])
  })

  it('refuse celui qui a motivé tout ça', () => {
    // 3 à 21 000 F : 7 000 F le maillot contre 6 500 F dans la paire.
    const issues = ladderIssues([
      { size: 2, price: 13000 },
      { size: 3, price: 21000 },
    ])
    expect(issues).toHaveLength(1)
    expect(issues[0]!.size).toBe(3)
    expect(issues[0]!.message).toContain('19 500 F')
  })

  it('refuse un pack plus grand et moins cher', () => {
    expect(
      sizes([
        { size: 2, price: 13000 },
        { size: 3, price: 12000 },
      ]),
    ).toEqual([3])
  })

  it('accepte un palier au même tarif au maillot, et le troisième offert', () => {
    // 19 500 F pile : égalité, pas de renchérissement. Et 13 000 F les trois,
    // soit le troisième offert — une promo, pas une erreur.
    expect(
      ladderIssues([
        { size: 2, price: 13000 },
        { size: 3, price: 19500 },
        { size: 4, price: 26000 },
      ]),
    ).toEqual([])
    expect(
      sizes([
        { size: 2, price: 13000 },
        { size: 3, price: 13000 },
      ]),
    ).toEqual([])
  })

  it('désigne chaque palier fautif, pas seulement le premier', () => {
    expect(
      sizes([
        { size: 2, price: 13000 },
        { size: 3, price: 21000 },
        { size: 4, price: 30000 },
      ]),
    ).toEqual([3, 4])
  })

  it('lit les paliers dans l’ordre même s’ils arrivent mélangés', () => {
    expect(
      sizes([
        { size: 3, price: 21000 },
        { size: 2, price: 13000 },
      ]),
    ).toEqual([3])
  })
})

describe('livraison', () => {
  it('ajoute les frais quand la boutique les facture à part', () => {
    const settings: PricingSettings = { ...launch, shippingMode: 'fee', shippingFee: 1000 }
    const result = calculatePricing(jerseys(2), settings)
    expect(result.shippingFee).toBe(1000)
    expect(result.total).toBe(14000)
  })

  it('n’ajoute rien quand la livraison est incluse', () => {
    const result = calculatePricing(jerseys(2), { ...launch, shippingFee: 1000 })
    expect(result.shippingFee).toBe(0)
    expect(result.total).toBe(13000)
  })

  it('reste gratuite sur l’axe du BRT', () => {
    const result = calculatePricing(jerseys(2), launch, 'brt')
    expect(result.shippingFee).toBe(0)
    expect(result.shippingFeeMax).toBe(0)
    // Pas d'intervalle : les deux bornes du total se rejoignent.
    expect(result.total).toBe(13000)
    expect(result.totalMax).toBe(13000)
  })

  it('facture un intervalle hors zone, ajouté au total', () => {
    const result = calculatePricing(jerseys(2), launch, 'outside')
    expect(result.shippingFee).toBe(OUTSIDE_ZONE_FEE.min)
    expect(result.shippingFeeMax).toBe(OUTSIDE_ZONE_FEE.max)
    expect(result.total).toBe(13000 + OUTSIDE_ZONE_FEE.min)
    expect(result.totalMax).toBe(13000 + OUTSIDE_ZONE_FEE.max)
  })

  it('ne rend jamais la sortie de zone moins chère que la zone', () => {
    const settings: PricingSettings = {
      ...launch,
      shippingMode: 'fee',
      shippingFee: OUTSIDE_ZONE_FEE.max + 500,
    }
    const inside = calculatePricing(jerseys(2), settings, 'brt')
    const outside = calculatePricing(jerseys(2), settings, 'outside')
    expect(outside.shippingFee).toBe(inside.shippingFee)
    expect(outside.total).toBeGreaterThanOrEqual(inside.total)
  })

  it('relit le plafond d’une commande enregistrée depuis sa zone', () => {
    expect(storedShippingMax(OUTSIDE_ZONE_FEE.min, 'outside')).toBe(OUTSIDE_ZONE_FEE.max)
    expect(storedShippingMax(0, 'brt')).toBe(0)
    // Les commandes d'avant le choix de zone n'ont rien dans la colonne.
    expect(storedShippingMax(0, null)).toBe(0)
  })

  it('chiffre le panier dans la zone par défaut', () => {
    expect(calculatePricing(jerseys(2), launch).zone).toBe('brt')
  })
})

describe('la relance du panier', () => {
  it('propose la paire à qui n’a qu’un maillot', () => {
    expect(nextPackStep(jerseys(1), launch, 8000)).toEqual({
      itemsNeeded: 1,
      totalItems: 2,
      packPrice: 13000,
      insteadOf: 16000,
    })
  })

  it('propose encore le troisième à qui en a deux', () => {
    // Ce que l'ancien pack ne pouvait pas faire : la paire étant complète, il
    // n'avait plus rien à proposer, et le troisième maillot coûtait plein tarif.
    expect(nextPackStep(jerseys(2), launch, 8000)).toEqual({
      itemsNeeded: 1,
      totalItems: 3,
      packPrice: 19500,
      insteadOf: 21000,
    })
    // L'ancien pack ne savait pas proposer ce troisième maillot : la paire
    // était complète, le palier suivant n'existait pas, et il ne pouvait que
    // viser la paire d'après — deux maillots de plus.
    expect(nextPackStep(jerseys(2), singleTier, 8000)).toMatchObject({
      itemsNeeded: 2,
      totalItems: 4,
      packPrice: 26000,
      insteadOf: 29000,
    })
  })

  it('va chercher plus loin qu’un maillot quand un seul ne suffit pas', () => {
    const threeOnly: PricingSettings = { ...launch, packTiers: [{ size: 3, price: 19500 }] }
    expect(nextPackStep(jerseys(1), threeOnly, 8000)).toMatchObject({
      itemsNeeded: 2,
      totalItems: 3,
      packPrice: 19500,
    })
  })

  it('se tait quand il n’y a rien à gagner', () => {
    expect(nextPackStep([], launch, 8000)).toBeNull()
    expect(nextPackStep(jerseys(1), { ...launch, packEnabled: false }, 8000)).toBeNull()
    expect(nextPackStep(jerseys(1), launch, null)).toBeNull()
    // Un maillot à 5 000 F : la paire à 13 000 F ne fait rien gagner.
    expect(nextPackStep(jerseys(1, 5000), launch, 5000)).toBeNull()
  })

  it('ne promet jamais plus que ce que le panier paierait vraiment', () => {
    for (let count = 1; count <= 8; count += 1) {
      const step = nextPackStep(jerseys(count), launch, 8000)
      if (step === null) continue
      const after = calculatePricing(jerseys(count + step.itemsNeeded), launch)
      expect(step.packPrice).toBe(after.subtotal - after.packDiscount)
      expect(step.packPrice).toBeLessThan(step.insteadOf)
    }
  })
})

describe('cas limites', () => {
  it('renvoie des zéros pour un panier vide', () => {
    const result = calculatePricing([], launch)
    expect(result).toMatchObject({ subtotal: 0, packDiscount: 0, total: 0, packsFormed: 0 })
  })

  it('ignore une ligne de quantité nulle ou négative', () => {
    const lines: PricingLine[] = [{ productId: 1, unitPrice: 8000, quantity: 0, packEligible: true }]
    expect(calculatePricing(lines, launch).total).toBe(0)
  })

  it('ne produit jamais que des entiers', () => {
    const settings: PricingSettings = {
      ...launch,
      packTiers: [
        { size: 2, price: 13333 },
        { size: 3, price: 19999 },
      ],
    }
    const result = calculatePricing(jerseys(5, 8333), settings)
    for (const value of [result.subtotal, result.packDiscount, result.shippingFee, result.total]) {
      expect(Number.isInteger(value)).toBe(true)
    }
  })

  it('tient un gros panier sans exploser', () => {
    expect(calculatePricing(jerseys(60), launch).total).toBe(60 * 6500)
  })
})
