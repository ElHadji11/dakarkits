'use client'

import { Sparkles } from 'lucide-react'

import { formatCfa } from '@/lib/constants'
import type { PackNudge as PackNudgeOffer, PricingResult } from '@/lib/pricing'

/**
 * Always shows the four lines the brief asks for: sous-total, remise pack,
 * livraison, total à payer à la livraison.
 */
export function CartSummary({
  pricing,
  nudge,
}: {
  pricing: PricingResult
  nudge: PackNudgeOffer | null
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
            bandeau de l’en-tête, sinon le client lit deux promesses. */}
        <Row
          label="Livraison"
          value={pricing.shippingFee === 0 ? 'Gratuite' : formatCfa(pricing.shippingFee)}
        />
        <div className="flex items-baseline justify-between border-t border-border pt-2">
          <dt className="font-medium">À payer à la livraison</dt>
          <dd className="text-lg font-semibold tabular-nums">{formatCfa(pricing.total)}</dd>
        </div>
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
      <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
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
