import { ProductCard } from '@/components/shop/product-card'
import type { ShopProduct } from '@/lib/shop-types'

/**
 * « Dans le même esprit » : une rangée qui défile, jamais une grille.
 *
 * La section affichait une grille de quatre colonnes avec ce que le catalogue
 * avait sous la main. Sur un maillot d'une équipe peu fournie, ça donnait
 * **une seule carte seule à gauche d'un grand vide** — l'écran d'une page
 * cassée, pas celui d'une suggestion. Une rangée horizontale n'a pas ce
 * défaut : une carte de 44 % de large qui dépasse du bord se lit comme « il y
 * en a d'autres », ce qui est exactement le message.
 *
 * L'appelant garantit le reste : la fiche produit n'affiche cette section
 * qu'avec quatre maillots, et la masque sinon.
 *
 * `-mx-4 px-4` : la rangée saigne jusqu'aux bords de l'écran sur téléphone,
 * mais son premier élément reste aligné sur le texte au-dessus. Sans ça, une
 * carte coupée net au bord du conteneur donne l'impression d'un débordement
 * accidentel.
 */
export function RelatedRow({ products }: { products: ShopProduct[] }) {
  return (
    <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          className="w-[44%] shrink-0 snap-start sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)]"
        />
      ))}
    </ul>
  )
}
