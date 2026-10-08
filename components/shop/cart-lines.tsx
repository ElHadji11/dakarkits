'use client'

import { Minus, Plus, Shirt, Trash2 } from 'lucide-react'
import NextImage from 'next/image'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { formatCfa } from '@/lib/constants'
import type { ResolvedLine } from '@/hooks/use-cart-lines'
import { useCart } from '@/stores/cart'

export function CartLines({ lines, onNavigate }: { lines: ResolvedLine[]; onNavigate?: () => void }) {
  const setQuantity = useCart((state) => state.setQuantity)
  const remove = useCart((state) => state.remove)

  return (
    <ul className="divide-y divide-border">
      {lines.map((line) => (
        <li key={`${line.productId}-${line.size ?? 'unique'}`} className="flex gap-3 py-3">
          <Link
            href={`/maillot/${line.product.slug}`}
            onClick={onNavigate}
            className="relative size-20 shrink-0 overflow-hidden rounded-md bg-card"
          >
            {line.product.imageUrl ? (
              <NextImage
                src={line.product.imageUrl}
                alt=""
                fill
                sizes="80px"
                className="object-contain p-1"
              />
            ) : (
              <span className="flex size-full items-center justify-center text-muted-foreground">
                <Shirt className="size-5" aria-hidden />
              </span>
            )}
          </Link>

          <div className="min-w-0 flex-1 space-y-1">
            <Link
              href={`/maillot/${line.product.slug}`}
              onClick={onNavigate}
              className="block truncate text-sm font-medium"
            >
              {line.product.title}
            </Link>
            {line.size ? (
              <p className="text-xs text-muted-foreground">Taille {line.size}</p>
            ) : null}
            <p className="text-sm tabular-nums">{formatCfa(line.product.price)}</p>

            <div className="flex items-center gap-1 pt-1">
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="size-11"
                aria-label="Retirer un exemplaire"
                onClick={() => setQuantity(line.productId, line.size, line.quantity - 1)}
              >
                <Minus className="size-4" aria-hidden />
              </Button>
              <span className="w-10 text-center tabular-nums" aria-live="polite">
                {line.quantity}
              </span>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="size-11"
                aria-label="Ajouter un exemplaire"
                onClick={() => setQuantity(line.productId, line.size, line.quantity + 1)}
              >
                <Plus className="size-4" aria-hidden />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="ml-auto size-11 text-muted-foreground"
                aria-label={`Supprimer ${line.product.title}`}
                onClick={() => remove(line.productId, line.size)}
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
