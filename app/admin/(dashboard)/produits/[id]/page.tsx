import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { AdminGuard } from '@/components/admin/admin-guard'
import { DeleteProductButton } from '@/components/admin/delete-product-button'
import { FlashToast } from '@/components/admin/flash-toast'
import { ProductForm } from '@/components/admin/product-form'
import { isConfigured as isAiConfigured } from '@/lib/ai/openai'
import { getProduct, listLeagues, listTeams } from '@/lib/catalog'
import { isConfigured, urlEndpoint } from '@/lib/imagekit'
import { toProductValues } from '@/lib/product-form-values'
import { getSettings } from '@/lib/settings'

export const metadata: Metadata = { title: 'Modifier un maillot' }

export default function EditProductPage(props: PageProps<'/admin/produits/[id]'>) {
  return (
    <AdminGuard>
      <EditProductScreen params={props.params} searchParams={props.searchParams} />
    </AdminGuard>
  )
}

async function EditProductScreen({
  params,
  searchParams,
}: {
  params: PageProps<'/admin/produits/[id]'>['params']
  searchParams: PageProps<'/admin/produits/[id]'>['searchParams']
}) {
  const { id } = await params
  const numericId = Number(id)
  if (!Number.isInteger(numericId)) notFound()

  const [product, teams, leagues, settings, query] = await Promise.all([
    getProduct(numericId),
    listTeams(),
    listLeagues(),
    getSettings(),
    searchParams,
  ])
  if (!product) notFound()

  return (
    <div className="space-y-6 py-4">
      <FlashToast message={query.enregistre === '1' ? 'Maillot enregistré.' : null} />

      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{product.title}</h1>
        <DeleteProductButton productId={product.id} />
      </div>

      <ProductForm
        values={toProductValues(product, urlEndpoint())}
        teams={teams}
        leagues={leagues}
        imagekitConfigured={isConfigured()}
        aiConfigured={isAiConfigured()}
        shipping={{ mode: settings.shippingMode, fee: settings.shippingFee }}
      />
    </div>
  )
}
