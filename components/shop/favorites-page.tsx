'use client'

import { Heart } from 'lucide-react'
import Link from 'next/link'

import { useCatalog } from '@/components/shop/catalog-provider'
import { ProductGrid } from '@/components/shop/product-grid'
import { Button } from '@/components/ui/button'
import { useHydrated } from '@/hooks/use-hydrated'
import { NAV_BACK } from '@/lib/view-transitions'
import { useFavorites } from '@/stores/favorites'

export function FavoritesPage() {
  const hydrated = useHydrated()
  const { byId } = useCatalog()
  const ids = useFavorites((state) => state.ids)

  if (!hydrated) {
    return <div className="h-64 animate-pulse rounded-lg bg-muted" aria-hidden />
  }

  // A jersey unpublished since it was hearted simply drops out of the list.
  const products = ids.flatMap((id) => {
    const product = byId.get(id)
    return product ? [product] : []
  })

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Heart className="size-10 text-muted-foreground" aria-hidden />
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Aucun favori</h1>
          <p className="text-sm text-muted-foreground">
            Touche le cœur sur un maillot pour le retrouver ici.
          </p>
        </div>
        <Button asChild className="h-12">
          <Link href="/" transitionTypes={NAV_BACK}>Voir les maillots</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Mes favoris</h1>
      <ProductGrid products={products} />
    </div>
  )
}
