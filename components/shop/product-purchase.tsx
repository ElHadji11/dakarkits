'use client'

import { Check, ShoppingBag, Truck, Wallet } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Fragment, useState } from 'react'
import { toast } from 'sonner'

import { FavoriteButton } from '@/components/shop/favorite-button'
import { Button } from '@/components/ui/button'
import { formatCfa, type Size } from '@/lib/constants'
import { trackAddToCart } from '@/lib/pixel'
import {
  deliveryPromise,
  isOnSale,
  isSoldOut,
  packLadder,
  type ShopProduct,
  type ShopSettings,
} from '@/lib/shop-types'
import { useCart } from '@/stores/cart'
import { cn } from '@/lib/utils'

/**
 * Price, size choice and the two buttons. The size rules follow the three
 * states exactly: no rows at all means no picker; rows all unticked means sold
 * out; otherwise the ticked ones are selectable and the rest are greyed.
 */
export function ProductPurchase({
  product,
  settings,
}: {
  product: ShopProduct
  settings: ShopSettings
}) {
  const router = useRouter()
  const add = useCart((state) => state.add)
  const hasSizes = product.sizes.length > 0
  const soldOut = isSoldOut(product)
  const onSale = isOnSale(product)

  const firstAvailable = product.sizes.find((size) => size.available)?.size ?? null
  const [selected, setSelected] = useState<Size | null>(firstAvailable)

  const chosen = hasSizes ? product.sizes.find((size) => size.size === selected) : null
  const lowStock =
    chosen?.quantity !== null &&
    chosen?.quantity !== undefined &&
    chosen.quantity > 0 &&
    chosen.quantity <= settings.lowStockThreshold

  const addToCart = () => {
    add(product.id, hasSizes ? selected : null, 1)
    trackAddToCart(product.id, product.price)
    toast.success('Ajouté au panier', {
      description: hasSizes && selected ? `${product.title} · taille ${selected}` : product.title,
    })
  }

  const orderNow = () => {
    add(product.id, hasSizes ? selected : null, 1)
    trackAddToCart(product.id, product.price)
    router.push('/commande')
  }

  const blocked = soldOut || (hasSizes && selected === null)
  const ladder = packLadder(settings)

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{product.title}</h1>
          <p className="text-sm text-muted-foreground">
            {[product.teamName, product.leagueName, product.season, kitTypeLabel(product.kitType)]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <FavoriteButton productId={product.id} className="-mr-2 shrink-0" />
      </div>

      <div className="flex items-baseline gap-3">
        <p className="text-3xl font-semibold tabular-nums">{formatCfa(product.price)}</p>
        {onSale ? (
          <p className="text-lg text-muted-foreground line-through tabular-nums">
            {formatCfa(product.compareAtPrice!)}
          </p>
        ) : null}
      </div>

      <ul className="space-y-1.5 text-sm text-muted-foreground">
        <li className="flex items-center gap-2">
          <Wallet className="size-4 shrink-0" aria-hidden />
          Tu paies à la livraison, en espèces.
        </li>
        <li className="flex items-center gap-2">
          <Truck className="size-4 shrink-0" aria-hidden />
          {deliveryPromise(settings)}.
        </li>
      </ul>

      {soldOut ? (
        <p className="rounded-lg border border-border p-3 text-sm font-medium">
          Épuisé pour le moment.
        </p>
      ) : hasSizes ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Taille</legend>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => (
              <button
                key={size.size}
                type="button"
                disabled={!size.available}
                aria-pressed={selected === size.size}
                onClick={() => setSelected(size.size)}
                className={cn(
                  'flex h-12 min-w-14 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors',
                  !size.available && 'cursor-not-allowed border-dashed text-muted-foreground/50',
                  size.available && selected === size.size
                    ? 'border-primary bg-primary/15'
                    : size.available && 'border-border hover:border-foreground/40',
                )}
              >
                {size.size}
              </button>
            ))}
          </div>
          {lowStock && selected ? (
            <p className="text-sm text-primary">
              Plus que {chosen!.quantity} en taille {selected}.
            </p>
          ) : null}
        </fieldset>
      ) : null}

      <div className="hidden gap-3 sm:flex">
        <Button variant="cta" className="h-12 flex-1" disabled={blocked} onClick={orderNow}>
          Commander maintenant
        </Button>
        <Button variant="outline" className="h-12 flex-1 gap-2" disabled={blocked} onClick={addToCart}>
          <ShoppingBag className="size-4" aria-hidden />
          Ajouter au panier
        </Button>
      </div>

      {ladder.length > 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Check className="size-4 shrink-0 text-primary" aria-hidden />
          {/* Toute la phrase dans un seul élément : le parent est un flex avec
              `gap-2`, et un montant sorti à nu y deviendrait un élément flex
              de plus — 8 px de gouttière avant le point. */}
          <span>
            {ladder.map((tier, index) => (
              <Fragment key={tier.size}>
                {index > 0 ? ', ' : ''}
                {/* `formatCfa` sépare les milliers par une espace ordinaire,
                    donc « 19 500 F » se coupe n'importe où. Sur 375 px, le
                    barème passait à la ligne en laissant un « F. » orphelin. */}
                <span className="whitespace-nowrap">
                  {tier.lead}
                  <span className="font-display text-lg leading-none tracking-wide text-foreground">
                    {tier.price}
                  </span>
                </span>
              </Fragment>
            ))}
            .
          </span>
        </p>
      ) : null}

      {/* Thumb-reach buy bar, phones only. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur sm:hidden">
        <div className="flex gap-2">
          <Button variant="cta" className="h-12 flex-1" disabled={blocked} onClick={orderNow}>
            Commander maintenant
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-12 shrink-0"
            disabled={blocked}
            onClick={addToCart}
            aria-label="Ajouter au panier"
          >
            <ShoppingBag className="size-5" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  )
}

function kitTypeLabel(kitType: ShopProduct['kitType']): string | null {
  if (kitType === 'home') return 'Domicile'
  if (kitType === 'away') return 'Extérieur'
  if (kitType === 'third') return 'Third'
  return null
}
