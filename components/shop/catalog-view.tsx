'use client'

import { SlidersHorizontal } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'

import { useCatalog } from '@/components/shop/catalog-provider'
import { countActive, emptyFilters, type Filters } from '@/components/shop/filter-drawer'
import { Badge } from '@/components/ui/badge'

// vaul is only needed once someone taps Filtres. Keeping it out of the first
// paint is worth more than the millisecond it costs to fetch on that tap.
const FilterDrawer = dynamic(
  () => import('@/components/shop/filter-drawer').then((m) => m.FilterDrawer),
  { ssr: false },
)
import { ProductGrid } from '@/components/shop/product-grid'
import { Button } from '@/components/ui/button'
import { SIZES, type Size } from '@/lib/constants'
import { searchItems } from '@/lib/search'
import { CATEGORIES, inCategory, type Category } from '@/lib/shop-types'
import { cn } from '@/lib/utils'

const SORTS = [
  { value: 'nouveautes', label: 'Nouveautés' },
  { value: 'prix-croissant', label: 'Prix croissant' },
  { value: 'prix-decroissant', label: 'Prix décroissant' },
] as const

type Sort = (typeof SORTS)[number]['value']

/**
 * Filtering, sorting and search run here, over a list the server already
 * prerendered. Every control writes to the URL, so an advert can link straight
 * to a filtered list, and nothing costs a round trip on a 4G connection.
 */
export function CatalogView({ category }: { category: Category }) {
  const { products } = useCatalog()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const filters: Filters = {
    teamId: numberOrNull(searchParams.get('equipe')),
    leagueId: numberOrNull(searchParams.get('ligue')),
    size: sizeOrNull(searchParams.get('taille')),
    min: searchParams.get('min') ?? '',
    max: searchParams.get('max') ?? '',
  }
  const sort = (searchParams.get('tri') ?? 'nouveautes') as Sort
  const query = searchParams.get('q') ?? ''

  const inThisCategory = useMemo(
    () => products.filter((product) => inCategory(product, category)),
    [products, category],
  )

  const teams = useMemo(() => {
    const seen = new Map<number, string>()
    for (const product of inThisCategory) {
      if (product.teamId && product.teamName) seen.set(product.teamId, product.teamName)
    }
    return [...seen].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [inThisCategory])

  const leagues = useMemo(() => {
    const seen = new Map<number, string>()
    for (const product of inThisCategory) {
      if (product.leagueId && product.leagueName) seen.set(product.leagueId, product.leagueName)
    }
    return [...seen].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [inThisCategory])

  const visible = useMemo(() => {
    const min = filters.min === '' ? null : Number(filters.min)
    const max = filters.max === '' ? null : Number(filters.max)
    const pool = query ? searchItems(inThisCategory, query) : inThisCategory

    const matching = pool.filter((product) => {
      if (filters.teamId !== null && product.teamId !== filters.teamId) return false
      if (filters.leagueId !== null && product.leagueId !== filters.leagueId) return false
      if (filters.size !== null) {
        const has = product.sizes.some((size) => size.size === filters.size && size.available)
        if (!has) return false
      }
      if (min !== null && Number.isFinite(min) && product.price < min) return false
      if (max !== null && Number.isFinite(max) && product.price > max) return false
      return true
    })

    const sorted = [...matching]
    if (sort === 'prix-croissant') sorted.sort((a, b) => a.price - b.price)
    else if (sort === 'prix-decroissant') sorted.sort((a, b) => b.price - a.price)
    else sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return sorted
  }, [inThisCategory, filters.teamId, filters.leagueId, filters.size, filters.min, filters.max, query, sort])

  const push = (next: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(next)) {
      if (value === null || value === '') params.delete(key)
      else params.set(key, value)
    }
    const search = params.toString()
    router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false })
  }

  const applyFilters = (next: Filters) =>
    push({
      equipe: next.teamId === null ? null : String(next.teamId),
      ligue: next.leagueId === null ? null : String(next.leagueId),
      taille: next.size,
      min: next.min,
      max: next.max,
    })

  const active = countActive(filters)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filtersMounted, setFiltersMounted] = useState(false)

  return (
    <div className="space-y-4">
      <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Catégories">
        {CATEGORIES.map((tab) => (
          <Link
            key={tab.value}
            href={tab.href}
            aria-current={tab.value === category ? 'page' : undefined}
            className={cn(
              'flex h-11 shrink-0 items-center rounded-full border px-4 text-sm transition-colors',
              tab.value === category
                ? // Dégradé vertical très court : l'onglet actif se détache
                  // sans devenir un aplat de couleur.
                  'border-primary bg-gradient-to-b from-primary/25 to-primary/5 font-medium text-foreground'
                : 'border-border text-muted-foreground',
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="h-11 gap-2"
          onClick={() => {
            setFiltersMounted(true)
            setFiltersOpen(true)
          }}
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          Filtres
          {active > 0 ? <Badge className="ml-1">{active}</Badge> : null}
        </Button>
        {filtersMounted ? (
          <FilterDrawer
            open={filtersOpen}
            onOpenChange={setFiltersOpen}
            filters={filters}
            teams={teams}
            leagues={leagues}
            onApply={applyFilters}
          />
        ) : null}

        <label className="sr-only" htmlFor="tri">
          Trier
        </label>
        <select
          id="tri"
          value={sort}
          onChange={(event) => push({ tri: event.target.value })}
          className="h-11 rounded-md border border-border bg-background px-3 text-sm"
        >
          {SORTS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <p className="ml-auto text-sm tabular-nums text-muted-foreground">
          {visible.length} maillot{visible.length > 1 ? 's' : ''}
        </p>
      </div>

      {query ? (
        <p className="text-sm text-muted-foreground">
          Résultats pour « {query} ».{' '}
          <button type="button" className="underline" onClick={() => push({ q: null })}>
            Effacer
          </button>
        </p>
      ) : null}

      {visible.length === 0 ? (
        <div className="space-y-3 rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {active > 0 || query
              ? 'Aucun maillot ne correspond. Essaie d’élargir ta recherche.'
              : 'Aucun maillot dans cette catégorie pour l’instant.'}
          </p>
          {active > 0 || query ? (
            <Button
              variant="outline"
              className="h-11"
              onClick={() => {
                applyFilters(emptyFilters)
                push({ q: null })
              }}
            >
              Tout effacer
            </Button>
          ) : null}
        </div>
      ) : (
        <ProductGrid products={visible} />
      )}
    </div>
  )
}

function numberOrNull(value: string | null): number | null {
  if (value === null) return null
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function sizeOrNull(value: string | null): Size | null {
  return SIZES.includes(value as Size) ? (value as Size) : null
}
