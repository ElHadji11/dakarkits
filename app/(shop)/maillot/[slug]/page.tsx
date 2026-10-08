import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { ProductGallery } from '@/components/shop/product-gallery'
import { ProductGrid } from '@/components/shop/product-grid'
import { ProductPurchase } from '@/components/shop/product-purchase'
import { ViewContentEvent } from '@/components/shop/view-content-event'
import { formatCfa } from '@/lib/constants'
import { getCatalog, getProduct, getShopSettings } from '@/lib/shop'

export async function generateStaticParams() {
  const catalog = await getCatalog()
  // Cache Components refuses an empty list, because it validates the route at
  // build time. A shop with nothing published yet hands back a slug that can
  // never exist — slugify strips underscores — and the page 404s it.
  if (catalog.length === 0) return [{ slug: '__aucun_maillot__' }]
  return catalog.map((product) => ({ slug: product.slug }))
}

export async function generateMetadata(
  props: PageProps<'/maillot/[slug]'>,
): Promise<Metadata> {
  const { slug } = await props.params
  const product = await getProduct(slug)
  if (!product) return { title: 'Maillot introuvable' }

  const description = [
    product.teamName,
    product.season,
    `${formatCfa(product.price)} · payé à la livraison à Dakar`,
  ]
    .filter(Boolean)
    .join(' · ')

  // ImageKit resizes the primary photo to the social card size on the fly: a
  // real thumbnail in WhatsApp, with no image generated at request time.
  const image = product.imageUrl
    ? `${product.imageUrl}?tr=w-1200,h-630,cm-pad_resize,bg-0F0F1A`
    : undefined

  return {
    title: `${product.title} — ${formatCfa(product.price)}`,
    description,
    alternates: { canonical: `/maillot/${product.slug}` },
    openGraph: {
      type: 'website',
      title: product.title,
      description,
      images: image ? [{ url: image, width: 1200, height: 630, alt: product.title }] : undefined,
    },
  }
}

/**
 * The slug is URL data. Awaiting it here would hold the whole page back on a
 * navigation, so the await happens inside the boundary and the shell paints
 * immediately — which is the entire point on a 4G connection.
 */
export default function ProductPage(props: PageProps<'/maillot/[slug]'>) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductBody params={props.params} />
    </Suspense>
  )
}

async function ProductBody({ params }: { params: PageProps<'/maillot/[slug]'>['params'] }) {
  const { slug } = await params
  const [product, settings, catalog] = await Promise.all([
    getProduct(slug),
    getShopSettings(),
    getCatalog(),
  ])
  if (!product) notFound()

  // Same team first, then same league; never the jersey being viewed.
  const related = catalog
    .filter((other) => other.id !== product.id)
    .filter(
      (other) =>
        (product.teamId !== null && other.teamId === product.teamId) ||
        (product.leagueId !== null && other.leagueId === product.leagueId),
    )
    .slice(0, 4)

  return (
    <div className="space-y-10 pb-24 sm:pb-6">
      <ViewContentEvent productId={product.id} value={product.price} />
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
        <ProductGallery images={product.images} title={product.title} />
        <ProductPurchase product={product} settings={settings} />
      </div>

      {product.description ? (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Description</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed">{product.description}</p>
        </section>
      ) : null}

      {related.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Dans le même esprit</h2>
          <ProductGrid products={related} />
        </section>
      ) : null}

      <script
        type="application/ld+json"
        // Structured data so the jersey can show as a product in search results.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.title,
            image: product.imageUrl ? [product.imageUrl] : undefined,
            description: product.description ?? undefined,
            brand: product.teamName ? { '@type': 'Brand', name: product.teamName } : undefined,
            offers: {
              '@type': 'Offer',
              price: product.price,
              priceCurrency: 'XOF',
              availability:
                product.sizes.length > 0 && product.sizes.every((size) => !size.available)
                  ? 'https://schema.org/OutOfStock'
                  : 'https://schema.org/InStock',
            },
          }),
        }}
      />
    </div>
  )
}

function ProductSkeleton() {
  return (
    <div className="grid gap-6 pb-24 lg:grid-cols-2 lg:gap-10" aria-hidden>
      <div className="aspect-square rounded-lg bg-muted" />
      <div className="space-y-4">
        <div className="h-8 w-3/4 rounded bg-muted" />
        <div className="h-4 w-1/2 rounded bg-muted" />
        <div className="h-10 w-40 rounded bg-muted" />
        <div className="h-12 w-full rounded bg-muted" />
      </div>
    </div>
  )
}
