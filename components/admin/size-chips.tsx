import { cn } from '@/lib/utils'

type Chip = {
  size: string
  available: boolean
  quantity: number | null
}

/**
 * Stock per size, readable at a glance:
 *   M      checked, no tracking
 *   M·3    checked, 3 left
 *   M·1    checked, at or under the low-stock threshold
 *   M      struck through: unchecked
 */
export function SizeChips({ sizes, lowStockThreshold }: { sizes: Chip[]; lowStockThreshold: number }) {
  if (sizes.length === 0) {
    return <span className="text-xs text-muted-foreground">Sans tailles</span>
  }

  if (sizes.every((size) => !size.available)) {
    return <span className="text-xs font-medium text-destructive">Épuisé</span>
  }

  return (
    <ul className="flex flex-wrap gap-1">
      {sizes.map((size) => {
        const low = size.quantity !== null && size.quantity <= lowStockThreshold
        return (
          <li
            key={size.size}
            className={cn(
              'rounded border px-1.5 py-0.5 text-xs tabular-nums',
              size.available
                ? low
                  ? 'border-destructive/50 text-destructive'
                  : 'border-border text-foreground'
                : 'border-transparent text-muted-foreground line-through',
            )}
            title={
              size.available
                ? size.quantity === null
                  ? 'Disponible, stock non suivi'
                  : `${size.quantity} en stock`
                : 'Taille décochée'
            }
          >
            {size.size}
            {size.quantity !== null ? <span className="opacity-70">·{size.quantity}</span> : null}
          </li>
        )
      })}
    </ul>
  )
}
