'use client'

import { Shirt } from 'lucide-react'
import NextImage from 'next/image'
import Link from 'next/link'

import { FavoriteButton } from '@/components/shop/favorite-button'
import { KitPhoto } from '@/components/shop/kit-photo'
import { Badge } from '@/components/ui/badge'
import { formatCfa } from '@/lib/constants'
import {
  discountPercent,
  isOnSale,
  isSoldOut,
  productName,
  productSubtitle,
  type ShopProduct,
} from '@/lib/shop-types'
import { cn } from '@/lib/utils'
import { NAV_FORWARD } from '@/lib/view-transitions'

/**
 * La carte du catalogue, et les quatre décisions qu'elle porte.
 *
 * **Une seule pastille sur la photo.** « Rétro » et « -33 % » s'empilaient dans
 * le coin et finissaient par recouvrir le maillot — soit exactement ce que le
 * visiteur est venu regarder. Elles sont donc classées par ce qu'elles coûtent
 * à ignorer : épuisé d'abord (cliquer est une perte de temps), la remise
 * ensuite (elle décide l'achat), « Rétro » en dernier (c'est un goût, et la
 * catégorie le dit déjà).
 *
 * **Le nom sur deux lignes.** Sur 375 px, une seule ligne tronquée donnait
 * « Olympique de M… » et « Sénégal extérieu… » : le format du maillot, c'est-
 * à-dire la seule chose qui distingue deux cartes de la même équipe,
 * disparaissait. Deux lignes, et une hauteur minimale fixée à ces deux lignes
 * pour que les prix d'une rangée restent alignés même quand un nom n'en prend
 * qu'une.
 *
 * **Le nom vient de `productName`, jamais de `product.title`.** C'est ce qui
 * met fin aux cartes « Chelsea / Chelsea » et « Barcelona » sous une équipe
 * nommée « FC Barcelone » : voir le commentaire de `productName`.
 *
 * **Le cœur est en haut à droite de la photo.** En bas de la carte il mangeait
 * la place du nom — d'où le `pr-11` qu'il a fallu supprimer — et il tombait
 * juste à côté du prix, là où le pouce vise pour ouvrir la fiche.
 *
 * **La photo est la même que celle de la fiche.** Elle porte le nom de
 * transition du maillot (`kitPhotoName`), comme la première photo de la
 * galerie : taper la carte fait glisser la photo jusqu'à sa place sur la
 * fiche, au lieu de faire disparaître un écran pour en afficher un autre.
 * `share="morph"` avec `default="none"` : le nom ne joue que pour ce trajet,
 * jamais quand un filtre réordonne la grille.
 */
export function ProductCard({
  product,
  priority = false,
  shareTransition = true,
  className,
}: {
  product: ShopProduct
  /** True for the first cards, so the LCP image is fetched straight away. */
  priority?: boolean
  /** `false` pour la seule grille statique, que la grille interactive
   *  remplace dès l'hydratation : avec les mêmes noms des deux côtés, ce
   *  relais déclencherait une transition de vue juste après le chargement.
   *  Voir `StaticGrid`. */
  shareTransition?: boolean
  /** Posé sur le `<li>`. La rangée « Dans le même esprit » s'en sert pour
   *  fixer la largeur d'une carte dans un défilement horizontal. */
  className?: string
}) {
  const onSale = isOnSale(product)
  const soldOut = isSoldOut(product)
  const discount = discountPercent(product)
  const subtitle = productSubtitle(product)

  return (
    <li className={cn('relative', className)}>
      <Link
        href={`/maillot/${product.slug}`}
        transitionTypes={NAV_FORWARD}
        /* `border-foreground/8` et non `border-white/8` : en thème sombre
           `--foreground` est un blanc cassé, donc le rendu est celui demandé,
           mais la couleur reste un jeton du thème — aucun blanc en dur, et la
           bordure suivra si Cosmic Night change.

           `active:` et non `hover:` seul : sur un téléphone il n'y a pas de
           survol, et c'est pourtant là que le retour au doigt manquait. */
        className="group block overflow-hidden rounded-card border border-foreground/8 bg-card/40 transition-colors duration-150 hover:bg-card/60 active:bg-card/70"
      >
        <div className="relative aspect-square overflow-hidden">
          {product.imageUrl ? (
            <KitPhoto slug={product.slug} share={shareTransition} onlyWhenNavigating>
              <NextImage
                src={product.imageUrl}
                alt={productName(product)}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                priority={priority}
                loading={priority ? undefined : 'lazy'}
                className="object-contain p-2 transition-transform duration-200 group-hover:scale-[1.03]"
              />
            </KitPhoto>
          ) : (
            <span className="flex size-full items-center justify-center text-muted-foreground">
              <Shirt className="size-10" aria-hidden />
            </span>
          )}

          {/* Une seule pastille, choisie par ordre d'importance. */}
          <div className="absolute left-2 top-2">
            {soldOut ? (
              <Badge variant="outline" className="bg-background/80">
                Épuisé
              </Badge>
            ) : onSale ? (
              // Le pourcentage parle plus que le mot. Le dégradé reprend celui
              // du bouton principal, pour que l'œil relie badge et action.
              <Badge className="border-0 bg-gradient-to-br from-primary to-chart-2">
                {discount === null ? 'Promo' : `-${discount} %`}
              </Badge>
            ) : product.isRetro ? (
              <Badge variant="secondary">Rétro</Badge>
            ) : null}
          </div>
        </div>

        <div className="space-y-1 p-2">
          {/* `min-h-10` = les deux lignes de `leading-5` : un nom court ne
              remonte pas son prix au-dessus de celui de la carte voisine. */}
          <p className="line-clamp-2 min-h-10 text-sm font-medium leading-5">
            {productName(product)}
          </p>
          {subtitle ? (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
          <p className="text-sm tabular-nums">
            <span className="font-semibold">{formatCfa(product.price)}</span>
            {onSale ? (
              <span className="ml-2 text-xs text-muted-foreground line-through">
                {formatCfa(product.compareAtPrice!)}
              </span>
            ) : null}
          </p>
        </div>
      </Link>

      {/* Hors du `<Link>` : un bouton dans un lien n'est pas du HTML valide, et
          le lecteur d'écran annoncerait les deux comme une seule cible. Le
          fond opaque, lui, n'est pas décoratif — sans lui le cœur disparaît sur
          un maillot blanc. */}
      <FavoriteButton
        productId={product.id}
        name={productName(product)}
        className="absolute right-1 top-1 bg-background/70 hover:bg-background/90"
      />
    </li>
  )
}
