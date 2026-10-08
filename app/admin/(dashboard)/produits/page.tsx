import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus } from 'lucide-react'

import { AdminGuard } from '@/components/admin/admin-guard'
import { FlashToast } from '@/components/admin/flash-toast'
import { ProductCard } from '@/components/admin/product-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { listProducts } from '@/lib/catalog'
import { getSettings } from '@/lib/settings'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Produits' }

const FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'published', label: 'Publiés' },
  { value: 'draft', label: 'Brouillons' },
] as const

export default function AdminProductsPage(props: PageProps<'/admin/produits'>) {
  return (
    <AdminGuard>
      <ProductsScreen searchParams={props.searchParams} />
    </AdminGuard>
  )
}

async function ProductsScreen({
  searchParams,
}: {
  searchParams: PageProps<'/admin/produits'>['searchParams']
}) {
  const params = await searchParams
  const q = typeof params.q === 'string' ? params.q : ''
  const raw = typeof params.statut === 'string' ? params.statut : ''
  const status = raw === 'draft' || raw === 'published' ? raw : undefined

  const [products, settings] = await Promise.all([listProducts({ q, status }), getSettings()])

  const flash =
    params.depublie === '1'
      ? 'Maillot dépublié : il a déjà des commandes, il ne peut pas être supprimé.'
      : params.supprime === '1'
        ? 'Maillot supprimé.'
        : null

  return (
    <div className="space-y-4 py-4">
      <FlashToast message={flash} />

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Produits</h1>
        <Button asChild className="h-11 gap-2">
          <Link href="/admin/produits/nouveau">
            <Plus className="size-4" aria-hidden />
            Nouveau
          </Link>
        </Button>
      </div>

      <form method="get" className="flex gap-2">
        {status ? <input type="hidden" name="statut" value={status} /> : null}
        <Input
          name="q"
          defaultValue={q}
          placeholder="Chercher un maillot ou une équipe"
          className="h-12"
          aria-label="Chercher"
        />
        <Button type="submit" variant="secondary" className="h-12">
          Chercher
        </Button>
      </form>

      <nav className="flex gap-2" aria-label="Filtrer par statut">
        {FILTERS.map((filter) => {
          const active = (status ?? '') === filter.value
          const href = {
            pathname: '/admin/produits',
            query: { ...(q ? { q } : {}), ...(filter.value ? { statut: filter.value } : {}) },
          }
          return (
            <Link
              key={filter.label}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex h-11 items-center rounded-md border px-3 text-sm',
                active
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border text-muted-foreground',
              )}
            >
              {filter.label}
            </Link>
          )
        })}
      </nav>

      {products.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {q || status
            ? 'Aucun maillot ne correspond à cette recherche.'
            : 'Aucun maillot pour l’instant. Crée le premier.'}
        </p>
      ) : (
        <ul className="space-y-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              lowStockThreshold={settings.lowStockThreshold}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
