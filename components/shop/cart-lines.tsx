'use client'

import { Minus, Plus, Shirt, Trash2 } from 'lucide-react'
import NextImage from 'next/image'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { formatCfa } from '@/lib/constants'
import { productName } from '@/lib/shop-types'
import { toastUndo } from '@/lib/toast'
import type { ResolvedLine } from '@/hooks/use-cart-lines'
import { useCart } from '@/stores/cart'

export function CartLines({ lines, onNavigate }: { lines: ResolvedLine[]; onNavigate?: () => void }) {
  const setQuantity = useCart((state) => state.setQuantity)

  /**
   * Toute suppression passe par ici, et offre « Annuler ».
   *
   * Il y a **deux** façons de vider une ligne : la corbeille, et le « − » quand
   * la quantité est à 1 — `setQuantity(…, 0)` supprime la ligne. Les deux
   * étaient silencieuses et définitives ; un pouce qui vise le « − » une fois
   * de trop perdait le maillot sans rien dire.
   *
   * On relit l'état au moment du clic pour figer la position de la ligne et sa
   * quantité : `restore` les rend telles quelles, là où elles étaient.
   */
  const removeLine = (line: ResolvedLine) => {
    const { lines: stored, remove, restore } = useCart.getState()
    const index = stored.findIndex(
      (other) => other.productId === line.productId && other.size === line.size,
    )
    const snapshot = { productId: line.productId, size: line.size, quantity: line.quantity }

    remove(line.productId, line.size)
    void toastUndo('Retiré du panier', {
      description: line.size
        ? `${productName(line.product)} · taille ${line.size}`
        : productName(line.product),
      onUndo: () => restore(snapshot, index),
    })
  }

  return (
    <ul className="divide-y divide-border">
      {lines.map((line) => (
        <li key={`${line.productId}-${line.size ?? 'unique'}`} className="flex gap-4 py-4">
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
              {productName(line.product)}
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
                aria-label={line.quantity === 1 ? 'Retirer du panier' : 'Retirer un exemplaire'}
                onClick={() =>
                  line.quantity === 1
                    ? removeLine(line)
                    : setQuantity(line.productId, line.size, line.quantity - 1)
                }
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
                aria-label={`Supprimer ${productName(line.product)}`}
                onClick={() => removeLine(line)}
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
