import { Analytics } from '@vercel/analytics/next'

import { CatalogProvider } from '@/components/shop/catalog-provider'
import { CheckoutHeader } from '@/components/shop/checkout-header'
import { MetaPixel } from '@/components/shop/meta-pixel'
import { ShopToaster } from '@/components/shop/shop-toaster'
import { getCatalog, getShopSettings } from '@/lib/shop'

/**
 * Le tunnel de commande, dans son propre groupe de routes.
 *
 * Il lui fallait un groupe à lui parce qu'un layout imbriqué ne peut pas
 * *retirer* ce que son parent rend : tant que `/commande` vivait sous
 * `(shop)`, elle héritait de la recherche, des favoris, du panier et des cinq
 * liens du pied de page. Un formulaire de commande n'a pas besoin d'une sortie
 * à chaque coin de l'écran.
 *
 * Ce qui reste, et pourquoi :
 *
 *   - `CatalogProvider`, parce que le panier ne stocke que des identifiants,
 *     des tailles et des quantités — jamais de prix. Le récapitulatif lit donc
 *     les prix dans le catalogue, et il doit l'avoir sous la main.
 *   - `MetaPixel`, parce que `InitiateCheckout` et `Purchase` partent d'ici.
 *   - `Analytics` (Vercel), pour la même raison que le pixel : les deux
 *     groupes de routes publics, et eux seuls.
 *   - `ShopToaster`, parce que le récapitulatif laisse modifier le panier
 *     jusqu'au dernier écran : une suppression doit pouvoir s'annuler ici
 *     aussi, et un toast sans `<Toaster>` monté ne s'affiche nulle part.
 *
 * `AttributionCapture` n'y est pas : les `utm_*` et le `fbclid` sont relevés à
 * l'atterrissage, sur une page boutique, et dorment dans le store. Les relire
 * ici ne servirait à rien et coûterait un `Suspense` de plus.
 */
export default async function CheckoutLayout({ children }: { children: React.ReactNode }) {
  const [products, settings] = await Promise.all([getCatalog(), getShopSettings()])

  return (
    <CatalogProvider products={products} settings={settings}>
      <MetaPixel />
      <Analytics />
      <div className="flex min-h-dvh flex-col">
        <CheckoutHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      </div>
      <ShopToaster />
    </CatalogProvider>
  )
}
