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
 *
 * Ses cartes ne portent pas le nom de transition de leur photo
 * (`shareTransition={false}`). La grille interactive les remplace dès
 * l'hydratation, et ce remplacement est l'apparition d'un `<Suspense>` : si
 * les deux grilles portaient les mêmes noms, React y verrait autant de paires
 * et lancerait une transition de vue sur la page entière juste après le
 * chargement — capture d'écran et rendu suspendu compris, sur la page même
 * dont le LCP se joue sur le fil principal. Le seul prix : une carte tapée
 * avant la fin de l'hydratation ouvre la fiche sans glissement.
 */
export async function StaticGrid({ category }: { category: Category }) {
  const catalog = await getCatalog()
  const products = catalog
    .filter((product) => inCategory(product, category))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  if (products.length === 0) return null

  return <ProductGrid products={products} shareTransition={false} />
}
