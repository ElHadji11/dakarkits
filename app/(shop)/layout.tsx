import { Suspense } from 'react'

import { AttributionCapture } from '@/components/shop/attribution-capture'
import { CatalogProvider } from '@/components/shop/catalog-provider'
import { MetaPixel } from '@/components/shop/meta-pixel'
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
      <div className="flex min-h-dvh flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4">{children}</main>
        <SiteFooter settings={settings} />
      </div>
    </CatalogProvider>
  )
}
