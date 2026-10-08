'use client'

import { Sparkles } from 'lucide-react'

import { formatCfa } from '@/lib/constants'
import type { PricingResult } from '@/lib/pricing'
import type { ShopSettings } from '@/lib/shop-types'

/**
 * Always shows the four lines the brief asks for: sous-total, remise pack,
 * livraison, total à payer à la livraison.
 */
export function CartSummary({
  pricing,
  settings,
  packCompareAt,
}: {
  pricing: PricingResult
  settings: ShopSettings
  packCompareAt: number | null
}) {
  return (
    <div className="space-y-3">
      <PackNudge pricing={pricing} settings={settings} packCompareAt={packCompareAt} />

      <dl className="space-y-1.5 text-sm">
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

function PackNudge({
  pricing,
  settings,
  packCompareAt,
}: {
  pricing: PricingResult
  settings: ShopSettings
  packCompareAt: number | null
}) {
  if (!settings.packEnabled || pricing.itemsToNextPack === null) return null
  // Nothing to nudge about on an empty basket, nor when the pack saves nothing.
  if (pricing.subtotal === 0 || packCompareAt === null) return null
  if (packCompareAt <= settings.packPrice) return null

  const needed = pricing.itemsToNextPack

  return (
    <p className="flex items-start gap-2 rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm">
      <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
      <span>
        Ajoute {needed === 1 ? 'un maillot' : `${needed} maillots`} :{' '}
        <strong className="font-display text-lg leading-none tracking-wide">
          {formatCfa(settings.packPrice)}
        </strong>{' '}
        les {settings.packSize} au lieu de{' '}
        {formatCfa(packCompareAt)}.
      </span>
    </p>
  )
}
