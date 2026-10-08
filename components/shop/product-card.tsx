'use client'

import { Shirt } from 'lucide-react'
import NextImage from 'next/image'
import Link from 'next/link'

import { FavoriteButton } from '@/components/shop/favorite-button'
import { Badge } from '@/components/ui/badge'
import { formatCfa } from '@/lib/constants'
import { discountPercent, isOnSale, isSoldOut, type ShopProduct } from '@/lib/shop-types'

export function ProductCard({
  product,
  priority = false,
}: {
  product: ShopProduct
  /** True for the first cards, so the LCP image is fetched straight away. */
  priority?: boolean
}) {
  const onSale = isOnSale(product)
  const soldOut = isSoldOut(product)
  const discount = discountPercent(product)

  return (
    <li className="relative">
      <Link href={`/maillot/${product.slug}`} className="group block space-y-2">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-card">
          {product.imageUrl ? (
            <NextImage
              src={product.imageUrl}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={priority}
              loading={priority ? undefined : 'lazy'}
              className="object-contain p-2 transition-transform duration-200 group-hover:scale-[1.03]"
            />
          ) : (
            <span className="flex size-full items-center justify-center text-muted-foreground">
              <Shirt className="size-10" aria-hidden />
            </span>
          )}

          <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
            {product.isRetro ? <Badge variant="secondary">Rétro</Badge> : null}
            {onSale ? (
              // Le pourcentage parle plus que le mot. Le dégradé reprend celui
              // du bouton principal, pour que l'œil relie badge et action.
              <Badge className="border-0 bg-gradient-to-br from-primary to-chart-2">
                {discount === null ? 'Promo' : `-${discount} %`}
              </Badge>
            ) : null}
            {soldOut ? <Badge variant="outline">Épuisé</Badge> : null}
          </div>
        </div>

        <div className="space-y-0.5 pr-11">
          <p className="truncate text-sm font-medium">{product.title}</p>
          {product.teamName ? (
            <p className="truncate text-xs text-muted-foreground">{product.teamName}</p>
          ) : null}
          <p className="text-sm tabular-nums">
            <span className="font-semibold">{formatCfa(product.price)}</span>
            {onSale ? (
              <span className="ml-2 text-xs text-muted-foreground line-through">
                {formatCfa(product.compareAtPrice!)}
              </span>
            ) : null}
          </p>
        </div>
      </Link>

      <FavoriteButton productId={product.id} className="absolute bottom-0 right-0" />
    </li>
  )
}
