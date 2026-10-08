import { ImageIcon } from 'lucide-react'
import NextImage from 'next/image'
import Link from 'next/link'

import { SizeChips } from '@/components/admin/size-chips'
import { Badge } from '@/components/ui/badge'
import { formatCfa } from '@/lib/constants'
import type { AdminProductRow } from '@/lib/catalog'

export function ProductCard({
  product,
  lowStockThreshold,
}: {
  product: AdminProductRow
  lowStockThreshold: number
}) {
  const onSale = product.compareAtPrice !== null && product.compareAtPrice > product.price

  return (
    <li>
      <Link
        href={`/admin/produits/${product.id}`}
        className="flex gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent/40"
      >
        <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-muted">
          {product.image ? (
            <NextImage
              src={product.image.url}
              alt=""
              fill
              sizes="80px"
              className="object-contain"
            />
          ) : (
            <span className="flex size-full items-center justify-center text-muted-foreground">
              <ImageIcon className="size-5" aria-hidden />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-medium">{product.title}</p>
            <Badge variant={product.status === 'published' ? 'default' : 'secondary'}>
              {product.status === 'published' ? 'Publié' : 'Brouillon'}
            </Badge>
          </div>

          {product.teamName || product.season ? (
            <p className="truncate text-sm text-muted-foreground">
              {[product.teamName, product.season].filter(Boolean).join(' · ')}
            </p>
          ) : null}

          <p className="text-sm tabular-nums">
            {formatCfa(product.price)}
            {onSale ? (
              <span className="ml-2 text-muted-foreground line-through">
                {formatCfa(product.compareAtPrice!)}
              </span>
            ) : null}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {product.isRetro ? <Badge variant="outline">Rétro</Badge> : null}
            {onSale ? <Badge variant="outline">Promo</Badge> : null}
            <SizeChips sizes={product.sizes} lowStockThreshold={lowStockThreshold} />
          </div>
        </div>
      </Link>
    </li>
  )
}
