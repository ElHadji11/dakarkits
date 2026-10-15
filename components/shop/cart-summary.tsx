'use client'

import { Tag } from 'lucide-react'

import { formatCfa, formatCfaRange } from '@/lib/constants'
import type { PackNudge as PackNudgeOffer, PricingResult } from '@/lib/pricing'

/**
 * Always shows the four lines the brief asks for: sous-total, remise pack,
 * livraison, total à payer à la livraison.
 *
 * `outsideFee` n'est passé que là où la zone n'a pas été déclarée : le panier
 * et son panneau, qui ne posent pas la question. Le récapitulatif y chiffre
 * donc la livraison au tarif de l'axe, et **la ligne doit le dire** — « Gratuite »
 * tout seul se lit comme un acquis, au-dessus d'un total que l'adresse peut
 * encore faire monter de 2 000 à 3 000 F. Sur le formulaire de commande, où la
 * zone est déclarée en deux cartes, la question est tranchée : rien à qualifier,
 * `pricing` porte déjà l'intervalle s'il y en a un.
 */
export function CartSummary({
  pricing,
  nudge,
  outsideFee,
}: {
  pricing: PricingResult
  nudge: PackNudgeOffer | null
  outsideFee?: { min: number; max: number }
}) {
  return (
    <div className="space-y-4">
      <PackNudge pricing={pricing} nudge={nudge} />

      <dl className="space-y-2 text-sm">
        <Row label="Sous-total" value={formatCfa(pricing.subtotal)} />
        {pricing.packDiscount > 0 ? (
          <Row label="Remise pack" value={`− ${formatCfa(pricing.packDiscount)}`} accent />
        ) : null}
        {/* Ce que la livraison coûte vraiment sur ce panier, pas le nom du
            réglage : un mode « frais » à 0 F affichait « 0 F ». Même mot que le
            bandeau de l’en-tête, sinon le client lit deux promesses.

            Hors zone, c'est un intervalle, et il remonte jusque dans le total :
            annoncer « 7 500 F » en gros au-dessus d'une livraison à 2 000 à
            3 000 F, c'est préparer une discussion sur le pas de la porte.
            `formatCfaRange` rend le montant seul quand les bornes se
            rejoignent, donc la zone n'a pas besoin d'un rendu à part.

            La réserve part dans l'intitulé et non dans le montant : « Gratuite
            sur l'axe du BRT » en colonne de droite déborde sur deux lignes à
            375 px, et casse l'alignement des quatre montants. */}
        <Row
          label={outsideFee ? 'Livraison sur l’axe du BRT' : 'Livraison'}
          value={
            pricing.shippingFeeMax === 0
              ? 'Gratuite'
              : formatCfaRange(pricing.shippingFee, pricing.shippingFeeMax)
          }
        />
        <div className="flex items-baseline justify-between gap-3 border-t border-border pt-2">
          <dt className="font-medium">À payer à la livraison</dt>
          <dd className="text-right text-lg font-semibold tabular-nums">
            {formatCfaRange(pricing.total, pricing.totalMax)}
          </dd>
        </div>
        {/* Le total porte la même réserve que la ligne qui le compose, sinon
            c'est le gros chiffre qu'on retient. Les bornes sortent de
            `shippingRange`, donc d'un seul endroit : sortir de la zone n'y
            coûte jamais moins que d'y rester, même si la boutique repassait un
            jour à une livraison payante. */}
        {outsideFee ? (
          <p className="text-xs text-muted-foreground">
            Hors de cet axe, la livraison coûte{' '}
            {formatCfaRange(outsideFee.min, outsideFee.max)}, fixés pendant l’appel de
            confirmation.
          </p>
        ) : null}
      </dl>
    </div>
  )
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={accent ? 'tabular-nums text-primary' : 'tabular-nums'}>{value}</dd>
    </div>
  )
}

/**
 * « Ajoute un maillot : 19 500 F les 3 au lieu de 21 000 F. »
 *
 * Les deux montants sortent de `nextPackStep`, qui ne renvoie une offre que
 * lorsqu'elle fait vraiment gagner quelque chose — il n'y a donc rien à
 * arbitrer ici, et rien à cacher non plus.
 */
function PackNudge({
  pricing,
  nudge,
}: {
  pricing: PricingResult
  nudge: PackNudgeOffer | null
}) {
  if (nudge === null || pricing.subtotal === 0) return null

  return (
    <p className="flex items-start gap-2 rounded-lg border border-primary/40 bg-primary/10 p-4 text-sm">
      <Tag className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
      {/* Toute la phrase dans un seul enfant du flex : un montant sorti à nu y
          deviendrait un élément flex de plus, donc 8 px de gouttière avant le
          mot suivant. */}
      <span>
        Ajoute {nudge.itemsNeeded === 1 ? 'un maillot' : `${nudge.itemsNeeded} maillots`} :{' '}
        {/* Inter, comme tout autre prix du site. Bebas ne tenait que sur ce
            montant-ci et sur celui de la fiche : deux prix condensés au milieu
            d'un catalogue entier en Inter se lisaient comme une erreur, pas
            comme une mise en avant. Et Bebas n'a pas de chiffres tabulaires,
            donc un prix mis là ne s'aligne pas en colonne. */}
        <strong className="tabular-nums">{formatCfa(nudge.packPrice)}</strong>{' '}
        les {nudge.totalItems} au lieu de {formatCfa(nudge.insteadOf)}.
      </span>
    </p>
  )
}
