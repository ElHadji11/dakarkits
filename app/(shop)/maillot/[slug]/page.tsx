import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { ProductGallery } from '@/components/shop/product-gallery'
import { ProductPurchase } from '@/components/shop/product-purchase'
import { RelatedRow } from '@/components/shop/related-row'
import { ViewContentEvent } from '@/components/shop/view-content-event'
import { formatCfa } from '@/lib/constants'
import { getCatalog, getProduct, getShopSettings } from '@/lib/shop'
import { productName, type ShopProduct, type ShopProductDetail } from '@/lib/shop-types'

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

  const name = productName(product)

  const description = [
    product.teamName,
    product.season,
    `${formatCfa(product.price)} · payé à la livraison sur l’axe du BRT`,
  ]
    .filter(Boolean)
    .join(' · ')

  // ImageKit resizes the primary photo to the social card size on the fly: a
  // real thumbnail in WhatsApp, with no image generated at request time.
  const image = product.imageUrl
    ? `${product.imageUrl}?tr=w-1200,h-630,cm-pad_resize,bg-0F0F1A`
    : undefined

  return {
    // Le même nom que la page affiche : un onglet, un aperçu WhatsApp et un
    // titre de page qui ne disent pas la même chose font douter du lien.
    title: `${name} — ${formatCfa(product.price)}`,
    description,
    alternates: { canonical: `/maillot/${product.slug}` },
    openGraph: {
      type: 'website',
      title: name,
      description,
      images: image ? [{ url: image, width: 1200, height: 630, alt: name }] : undefined,
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

  const related = relatedTo(product, catalog)

  return (
    /* Plus de `pb-24`. La barre d'achat collée est `fixed`, donc elle ne
       recouvre que le bas de l'écran — et c'est le pied de page qui porte
       désormais sa garde au sol (`pb-20`, voir `site-footer`). Les 96 px
       d'avant s'ajoutaient à celle-là : d'où le grand vide à la fin de la
       fiche, qui n'avait aucune raison d'être là.

       `space-y-6` sur téléphone : entre la ligne du pack et « Description »,
       40 px se lisaient comme une rupture de page. */
    <div className="space-y-6 sm:space-y-8">
      <ViewContentEvent
        productId={product.id}
        name={productName(product)}
        value={product.price}
      />
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <ProductGallery images={product.images} title={productName(product)} />
        <ProductPurchase product={product} settings={settings} />
      </div>

      {product.description ? (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Description</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed">{product.description}</p>
        </section>
      ) : null}

      {/* Quatre ou rien : voir `relatedTo`. */}
      {related.length === RELATED_COUNT ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Dans le même esprit</h2>
          <RelatedRow products={related} />
        </section>
      ) : null}

      <script
        type="application/ld+json"
        // Structured data so the jersey can show as a product in search results.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: productName(product),
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
    <div className="grid gap-6 lg:grid-cols-2 lg:gap-8" aria-hidden>
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

/**
 * Le nombre de maillots de la rangée « Dans le même esprit ». Quatre, et
 * jamais trois : voir `relatedTo`.
 */
const RELATED_COUNT = 4

/**
 * Quatre maillots proches, ou aucun.
 *
 * L'ancienne version prenait ce qui partageait l'équipe ou la ligue, et
 * s'arrêtait là. Sur une équipe dont la boutique n'a qu'un autre maillot, la
 * section s'affichait avec **une carte unique** dans une grille de quatre
 * colonnes : trois quarts de vide, et l'air d'un bug. Elle se remplit donc par
 * cercles de plus en plus larges, et si les quatre places ne sont pas prises,
 * la fiche n'affiche pas la section du tout — une suggestion incomplète ne
 * vend rien, un trou dans la page fait douter du reste.
 *
 * Les trois cercles, dans l'ordre : même équipe, même ligue, puis même famille
 * — un club avec les clubs, une sélection avec les sélections, un rétro avec
 * les rétros. Le troisième cercle est le dernier : au-delà, « le même esprit »
 * ne voudrait plus rien dire, et autant ne rien proposer.
 */
function relatedTo(product: ShopProductDetail, catalog: ShopProduct[]): ShopProduct[] {
  const others = catalog.filter((other) => other.id !== product.id)

  const circles = [
    (other: ShopProduct) => product.teamId !== null && other.teamId === product.teamId,
    (other: ShopProduct) => product.leagueId !== null && other.leagueId === product.leagueId,
    (other: ShopProduct) =>
      other.teamType === product.teamType && other.isRetro === product.isRetro,
  ]

  const picked: ShopProduct[] = []
  for (const belongs of circles) {
    for (const other of others) {
      if (picked.length === RELATED_COUNT) return picked
      if (belongs(other) && !picked.includes(other)) picked.push(other)
    }
  }

  return picked
}
