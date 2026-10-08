import { Badge } from '@/components/ui/badge'
import type { OrderStatus } from '@/lib/db/schema'

const LABELS: Record<OrderStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  new: { label: 'Nouvelle', variant: 'default' },
  delivered: { label: 'Livrée', variant: 'secondary' },
  cancelled: { label: 'Annulée', variant: 'outline' },
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, variant } = LABELS[status]
  return <Badge variant={variant}>{label}</Badge>
}
