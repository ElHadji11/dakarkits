import { Analytics } from '@vercel/analytics/next'
import { Suspense } from 'react'

import { AttributionCapture } from '@/components/shop/attribution-capture'
import { CatalogProvider } from '@/components/shop/catalog-provider'
import { MetaPixel } from '@/components/shop/meta-pixel'
import { PageTransition } from '@/components/shop/page-transition'
import { PromoBanner } from '@/components/shop/promo-banner'
import { ShopToaster } from '@/components/shop/shop-toaster'
import { SiteFooter } from '@/components/shop/site-footer'
import { SiteHeader } from '@/components/shop/site-header'
import { getCatalog, getShopSettings } from '@/lib/shop'

/**
 * The catalogue is handed to the client once, here. Both reads are `use cache`,
 * so this whole shell is prerendered and served from the CDN — and every page
 * below gets instant search, instant filters and a cart that knows current
 * prices without a single request.
 */
export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [products, settings] = await Promise.all([getCatalog(), getShopSettings()])

  return (
    <CatalogProvider products={products} settings={settings}>
      {/* Reads utm_* and fbclid off the landing URL; needs Suspense because
          that is request data, and the shell must stay static. */}
      <Suspense fallback={null}>
        <AttributionCapture />
      </Suspense>
      <MetaPixel />
      {/* Comme le pixel : ici et dans (checkout), jamais dans app/layout.tsx —
          le layout racine enveloppe aussi /admin, et notre propre navigation
          n'est pas du trafic. Le composant pose son propre Suspense, donc il ne
          sort pas la coquille statique. */}
      <Analytics />
      {/* Le glissement de page, *aussi* au niveau du groupe de routes. Entre
          la boutique et le tunnel de commande, c'est le layout entier qui
          change, `<main>` compris : les `<PageTransition>` des pages sont
          alors sous du DOM fraîchement inséré, et React ne les anime pas —
          vérifié, « Commander » arrivait sans glisser. Celui-ci prend le
          relais dans ce seul cas ; à l'intérieur du groupe le layout survit
          à la navigation et il ne joue jamais. */}
      <PageTransition>
        <div className="flex min-h-dvh flex-col">
          {/* Au-dessus de l'en-tête collé, pas dedans : la barre collée garde sa
              hauteur sur téléphone, et la promo défile hors de l'écran une fois
              lue. */}
          <PromoBanner />
          <SiteHeader settings={settings} />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4">{children}</main>
          <SiteFooter settings={settings} />
        </div>
      </PageTransition>
      {/* Hors du `<div>` de mise en page : le toast est en `fixed`, il n'a rien
          à voir avec la colonne qui porte l'en-tête, le contenu et le pied. */}
      <ShopToaster />
    </CatalogProvider>
  )
}
