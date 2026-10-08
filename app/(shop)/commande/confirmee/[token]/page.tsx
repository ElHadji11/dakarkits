import { CheckCircle2 } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { ClearCartOnce } from '@/components/shop/clear-cart-once'
import { PurchaseEvent } from '@/components/shop/purchase-event'
import { Button } from '@/components/ui/button'
import { formatCfa } from '@/lib/constants'
import { getOrderByToken } from '@/lib/orders'

export const metadata: Metadata = {
  title: 'Commande confirmée',
  robots: { index: false, follow: false },
}

export default function ConfirmationPage(
  props: PageProps<'/commande/confirmee/[token]'>,
) {
  return (
    <Suspense fallback={<div className="h-80 animate-pulse rounded-lg bg-muted" aria-hidden />}>
      <Confirmation params={props.params} />
    </Suspense>
  )
}

async function Confirmation({
  params,
}: {
  params: PageProps<'/commande/confirmee/[token]'>['params']
}) {
  const { token } = await params
  const order = await getOrderByToken(token)
  if (!order) notFound()

  return (
    <div className="mx-auto max-w-lg space-y-6 py-6">
      <ClearCartOnce orderNumber={order.number} />
      <PurchaseEvent
        eventId={`purchase_${order.number}`}
        productIds={order.items.map((item) => String(item.productId))}
        value={order.total}
      />

      <div className="space-y-2 text-center">
        <CheckCircle2 className="mx-auto size-12 text-primary" aria-hidden />
        <h1 className="text-2xl font-semibold tracking-tight">Commande enregistrée</h1>
        <p className="text-sm text-muted-foreground">
          Numéro <strong className="text-foreground">{order.number}</strong>. On t’appelle très
          vite pour confirmer la livraison.
        </p>
      </div>

      <section className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="text-sm font-medium text-muted-foreground">Ce que tu as commandé</h2>
        <ul className="space-y-1.5 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
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

        <dl className="space-y-1.5 border-t border-border pt-3 text-sm">
          <Row label="Sous-total" value={formatCfa(order.subtotal)} />
          {order.packDiscount > 0 ? (
            <Row label="Remise pack" value={`− ${formatCfa(order.packDiscount)}`} />
          ) : null}
          <Row
            label="Livraison"
            value={order.shippingFee > 0 ? formatCfa(order.shippingFee) : 'Incluse'}
          />
          <div className="flex items-baseline justify-between border-t border-border pt-2">
            <dt className="font-medium">À payer à la livraison</dt>
            <dd className="text-lg font-semibold tabular-nums">{formatCfa(order.total)}</dd>
          </div>
        </dl>
      </section>

      <p className="text-center text-sm text-muted-foreground">
        Tu paies en espèces, au livreur, à la réception.
      </p>

      <Button asChild variant="outline" className="h-12 w-full">
        <Link href="/">Continuer mes achats</Link>
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
