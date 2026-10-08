import type { Metadata } from 'next'
import Link from 'next/link'

import { AdminGuard } from '@/components/admin/admin-guard'
import { OrderStatusBadge } from '@/components/admin/order-status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCfa } from '@/lib/constants'
import { formatDateTime } from '@/lib/format'
import { listOrders } from '@/lib/orders'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Commandes' }

const FILTERS = [
  { value: '', label: 'Toutes' },
  { value: 'new', label: 'Nouvelles' },
  { value: 'delivered', label: 'Livrées' },
  { value: 'cancelled', label: 'Annulées' },
] as const

export default function AdminOrdersPage(props: PageProps<'/admin/commandes'>) {
  return (
    <AdminGuard>
      <OrdersScreen searchParams={props.searchParams} />
    </AdminGuard>
  )
}

async function OrdersScreen({
  searchParams,
}: {
  searchParams: PageProps<'/admin/commandes'>['searchParams']
}) {
  const params = await searchParams
  const q = typeof params.q === 'string' ? params.q : ''
  const raw = typeof params.statut === 'string' ? params.statut : ''
  const status =
    raw === 'new' || raw === 'delivered' || raw === 'cancelled' ? raw : undefined

  const orders = await listOrders({ q, status })

  return (
    <div className="space-y-4 py-4">
      <h1 className="text-2xl font-semibold tracking-tight">Commandes</h1>

      <form method="get" className="flex gap-2">
        {status ? <input type="hidden" name="statut" value={status} /> : null}
        <Input
          name="q"
          defaultValue={q}
          placeholder="Numéro, nom ou téléphone"
          className="h-12"
          aria-label="Chercher une commande"
        />
        <Button type="submit" variant="secondary" className="h-12">
          Chercher
        </Button>
      </form>

      <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Filtrer par statut">
        {FILTERS.map((filter) => {
          const active = (status ?? '') === filter.value
          return (
            <Link
              key={filter.label}
              href={{
                pathname: '/admin/commandes',
                query: { ...(q ? { q } : {}), ...(filter.value ? { statut: filter.value } : {}) },
              }}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex h-11 shrink-0 items-center rounded-md border px-3 text-sm',
                active
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border text-muted-foreground',
              )}
            >
              {filter.label}
            </Link>
          )
        })}
      </nav>

      {orders.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {q || status ? 'Aucune commande ne correspond.' : 'Aucune commande pour l’instant.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/admin/commandes/${order.number}`}
                className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent/40"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium tabular-nums">{order.number}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="truncate text-sm">{order.customerName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatDateTime(order.createdAt)} · {order.itemCount} article
                    {order.itemCount > 1 ? 's' : ''}
                  </p>
                </div>
                <span className="shrink-0 font-semibold tabular-nums">
                  {formatCfa(order.total)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
