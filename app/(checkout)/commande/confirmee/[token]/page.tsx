import { CheckCircle2 } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { ClearCartOnce } from '@/components/shop/clear-cart-once'
import { DeliveryZoneNotice } from '@/components/shop/delivery-zone'
import { PageTransition } from '@/components/shop/page-transition'
import { PurchaseEvent } from '@/components/shop/purchase-event'
import { Button } from '@/components/ui/button'
import { formatCfa, formatCfaRange } from '@/lib/constants'
import { getOrderByToken } from '@/lib/orders'
import { storedShippingMax } from '@/lib/pricing'
import { getShopSettings } from '@/lib/shop'
import { paymentPromise } from '@/lib/shop-types'
import { NAV_BACK } from '@/lib/view-transitions'

export const metadata: Metadata = {
  title: 'Commande confirmée',
  robots: { index: false, follow: false },
}

export default function ConfirmationPage(
  props: PageProps<'/commande/confirmee/[token]'>,
) {
  return (
    <PageTransition>
      <Suspense fallback={<div className="h-80 animate-pulse rounded-lg bg-muted" aria-hidden />}>
        <Confirmation params={props.params} />
      </Suspense>
    </PageTransition>
  )
}

async function Confirmation({
  params,
}: {
  params: PageProps<'/commande/confirmee/[token]'>['params']
}) {
  const { token } = await params
  // Le numéro de paiement vient du réglage, comme au pied de page : il doit
  // suivre la boutique si elle change de ligne, sans redéploiement.
  const [order, settings] = await Promise.all([getOrderByToken(token), getShopSettings()])
  if (!order) notFound()

  /* La commande fige un entier ; hors zone, le haut de l'intervalle se relit
     de la zone enregistrée. Le client doit retrouver sur cette page le même
     montant que celui qu'il avait sous les yeux en validant. */
  const shippingMax = storedShippingMax(order.shippingFee, order.deliveryZone)
  const totalMax = order.total + (shippingMax - order.shippingFee)

  return (
    <div className="mx-auto max-w-lg space-y-6 py-6">
      <ClearCartOnce orderNumber={order.number} />
      {/* `order.total` et non `totalMax` : la commande fige un entier, et c'est
          celui-là qui sera encaissé si l'adresse est bien sur l'axe. Déclarer
          le plafond surévaluerait chaque vente hors zone.

          Le même `event_id` que l'API de conversions (`purchase_<numéro>`),
          sinon la vente est comptée deux fois. */}
      <PurchaseEvent
        orderNumber={order.number}
        eventId={`purchase_${order.number}`}
        items={order.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        }))}
        value={order.total}
        phone={order.phone}
      />

      <div className="space-y-2 text-center">
        <CheckCircle2 className="mx-auto size-12 text-primary" aria-hidden />
        <h1 className="text-2xl font-semibold tracking-tight">Commande enregistrée</h1>
        <p className="text-sm text-muted-foreground">
          Numéro <strong className="text-foreground">{order.number}</strong>. On t’appelle très
          vite pour confirmer la livraison.
        </p>
      </div>

      <section className="space-y-4 rounded-lg border border-border p-4">
        <h2 className="text-sm font-medium text-muted-foreground">Ce que tu as commandé</h2>
        <ul className="space-y-2 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4">
              <span>
                {item.quantity} × {item.title}
                {item.size ? <span className="text-muted-foreground"> · {item.size}</span> : null}
              </span>
              <span className="shrink-0 tabular-nums">
                {formatCfa(item.unitPrice * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="space-y-2 border-t border-border pt-4 text-sm">
          <Row label="Sous-total" value={formatCfa(order.subtotal)} />
          {order.packDiscount > 0 ? (
            <Row label="Remise pack" value={`− ${formatCfa(order.packDiscount)}`} />
          ) : null}
          <Row
            label="Livraison"
            value={shippingMax > 0 ? formatCfaRange(order.shippingFee, shippingMax) : 'Incluse'}
          />
          <div className="flex items-baseline justify-between gap-3 border-t border-border pt-2">
            <dt className="font-medium">À payer à la livraison</dt>
            <dd className="text-right text-lg font-semibold tabular-nums">
              {formatCfaRange(order.total, totalMax)}
            </dd>
          </div>
        </dl>
      </section>

      <p className="text-center text-sm text-muted-foreground">
        Tu paies à la réception : {paymentPromise(settings, { withNumber: true })}.
      </p>

      {/* La zone une dernière fois : l'adresse vient d'être saisie, et s'il
          faut la discuter, autant que ce soit pendant l'appel de confirmation
          plutôt que devant la porte. */}
      <DeliveryZoneNotice className="text-xs" />

      <Button asChild variant="outline" className="h-12 w-full">
        <Link href="/" transitionTypes={NAV_BACK}>Continuer mes achats</Link>
      </Button>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  )
}
