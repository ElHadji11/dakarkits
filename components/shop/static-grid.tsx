import { ProductGrid } from '@/components/shop/product-grid'
import { getCatalog } from '@/lib/shop'
import { inCategory, type Category } from '@/lib/shop-types'

/**
 * The unfiltered grid, rendered on the server and used as the Suspense
 * fallback for the interactive one.
 *
 * It matters more than it looks. The interactive grid reads `searchParams`, so
 * it cannot be prerendered — without this, the page ships with no `<img>` at
 * all and the browser only discovers the LCP image after hydration. Here the
 * real cards, with their priority hints, are in the HTML from the first byte;
 * the client grid swaps in afterwards, and when no filter is active — which is
 * what an advert link looks like — the swap changes nothing on screen.
 */
export async function StaticGrid({ category }: { category: Category }) {
  const catalog = await getCatalog()
  const products = catalog
    .filter((product) => inCategory(product, category))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  if (products.length === 0) return null

  return <ProductGrid products={products} />
}
