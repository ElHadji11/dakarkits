'use client'

import { Search, Shirt, X } from 'lucide-react'
import NextImage from 'next/image'
import Link from 'next/link'
import { useId, useMemo, useRef, useState } from 'react'

import { useCatalog } from '@/components/shop/catalog-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCfa } from '@/lib/constants'
import { searchItems } from '@/lib/search'
import { productName, productSubtitle } from '@/lib/shop-types'

const MAX_RESULTS = 6

/**
 * Results appear as you type, with no request: the catalogue is already here.
 * Accent- and case-insensitive, and forgiving of one wrong letter.
 */
export function SearchBox() {
  const { products } = useCatalog()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const listId = useId()
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const results = useMemo(
    () => (query.trim() ? searchItems(products, query).slice(0, MAX_RESULTS) : []),
    [products, query],
  )

  const close = () => {
    setOpen(false)
    if (blurTimer.current) clearTimeout(blurTimer.current)
  }

  return (
    <div className="relative flex-1">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        // Let a click on a result land before the list disappears.
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 150)
        }}
        placeholder="Chercher un maillot, une équipe…"
        aria-label="Chercher un maillot"
        aria-expanded={open && query.trim().length > 0}
        aria-controls={listId}
        role="combobox"
        className="h-11 pl-9 pr-9"
      />
      {query ? (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="absolute right-0 top-0 size-11"
          aria-label="Effacer la recherche"
          onClick={() => {
            setQuery('')
            setOpen(false)
          }}
        >
          <X className="size-4" aria-hidden />
        </Button>
      ) : null}

      {open && query.trim().length > 0 ? (
        <div
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-border bg-popover shadow-lg"
        >
          {results.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              Aucun maillot pour « {query.trim()} ».
            </p>
          ) : (
            <ul className="max-h-[60vh] divide-y divide-border overflow-y-auto">
              {results.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/maillot/${product.slug}`}
                    onClick={close}
                    className="flex items-center gap-4 p-2 hover:bg-accent/40"
                  >
                    <span className="relative size-12 shrink-0 overflow-hidden rounded bg-card">
                      {product.imageUrl ? (
                        <NextImage
                          src={product.imageUrl}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-contain p-0.5"
                        />
                      ) : (
                        <span className="flex size-full items-center justify-center text-muted-foreground">
                          <Shirt className="size-4" aria-hidden />
                        </span>
                      )}
                    </span>
                    {/* Même nom que sur la carte et sur la fiche : un
                        résultat de recherche qui ne s'écrit pas comme la carte
                        qu'il ouvre fait douter d'avoir trouvé le bon maillot. */}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {productName(product)}
                      </span>
                      {productSubtitle(product) ? (
                        <span className="block truncate text-xs text-muted-foreground">
                          {productSubtitle(product)}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-sm tabular-nums">
                      {formatCfa(product.price)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
