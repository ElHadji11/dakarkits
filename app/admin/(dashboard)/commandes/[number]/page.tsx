import { MessageCircle, Phone } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { AdminGuard } from '@/components/admin/admin-guard'
import { OrderActions } from '@/components/admin/order-actions'
import { OrderStatusBadge } from '@/components/admin/order-status-badge'
import { Button } from '@/components/ui/button'
import { formatCfa } from '@/lib/constants'
import { formatDateTime } from '@/lib/format'
import { getOrderByNumber } from '@/lib/orders'

export const metadata: Metadata = { title: 'Commande' }

export default function AdminOrderPage(props: PageProps<'/admin/commandes/[number]'>) {
  return (
    <AdminGuard>
      <OrderScreen params={props.params} />
    </AdminGuard>
  )
}

async function OrderScreen({
  params,
}: {
  params: PageProps<'/admin/commandes/[number]'>['params']
}) {
  const { number } = await params
  const order = await getOrderByNumber(decodeURIComponent(number))
  if (!order) notFound()

  const whatsapp = order.phone.replace('+', '')
  const attribution = [order.utmSource, order.utmCampaign, order.utmContent].filter(Boolean)

  return (
    <div className="space-y-6 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight tabular-nums">{order.number}</h1>
        <OrderStatusBadge status={order.status} />
        <span className="text-sm text-muted-foreground">{formatDateTime(order.createdAt)}</span>
      </div>

      <OrderActions orderId={order.id} status={order.status} />

      {order.status === 'cancelled' && order.cancelReason ? (
        <p className="rounded-lg border border-border p-3 text-sm">
          <span className="text-muted-foreground">Motif : </span>
          {order.cancelReason}
        </p>
      ) : null}

      <section className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="text-sm font-medium text-muted-foreground">Client</h2>
        <p className="text-lg font-medium">{order.customerName}</p>
        <p className="whitespace-pre-line text-sm">{order.address}</p>

        <div className="flex gap-2 pt-1">
          <Button asChild className="h-12 flex-1 gap-2">
            <a href={`tel:${order.phone}`}>
              <Phone className="size-4" aria-hidden />
              Appeler
            </a>
          </Button>
          <Button asChild variant="outline" className="h-12 flex-1 gap-2">
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">
              <MessageCircle className="size-4" aria-hidden />
              WhatsApp
            </a>
          </Button>
        </div>
        <p className="text-center text-sm tabular-nums text-muted-foreground">{order.phone}</p>
      </section>

      <section className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="text-sm font-medium text-muted-foreground">Articles</h2>
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
            <dt className="font-medium">À encaisser</dt>
            <dd className="text-lg font-semibold tabular-nums">{formatCfa(order.total)}</dd>
          </div>
        </dl>
      </section>

      <section className="space-y-2 rounded-lg border border-border p-4">
        <h2 className="text-sm font-medium text-muted-foreground">Source publicitaire</h2>
        {attribution.length === 0 && !order.fbclid ? (
          <p className="text-sm text-muted-foreground">Visite directe, aucune publicité.</p>
        ) : (
          <dl className="space-y-1 text-sm">
            {order.utmSource ? <Row label="Source" value={order.utmSource} /> : null}
            {order.utmCampaign ? <Row label="Campagne" value={order.utmCampaign} /> : null}
            {order.utmContent ? <Row label="Créa" value={order.utmContent} /> : null}
            {order.fbclid ? <Row label="fbclid" value="présent" /> : null}
          </dl>
        )}
      </section>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate tabular-nums">{value}</dd>
    </div>
  )
}
