import { ArrowRight } from 'lucide-react'
import NextImage from 'next/image'
import Link from 'next/link'

import { getCatalog } from '@/lib/shop'
import {
  CATEGORIES,
  inCategory,
  type Category,
  type ShopHero,
  type ShopProduct,
} from '@/lib/shop-types'

/**
 * La bannière d'accueil : le premier moment de marque du site.
 *
 * La page d'accueil ouvrait directement sur la grille. Techniquement
 * irréprochable — et complètement muet : un visiteur arrivé par une publicité
 * voyait quatre maillots sans savoir chez qui il était ni ce qu'on y met en
 * avant ce mois-ci.
 *
 * **Composant serveur, et c'est tout l'enjeu de performance.** Il est rendu
 * *au-dessus* du `<Suspense>` du catalogue, donc il part dans la coquille
 * statique : la balise `<img>` est dans le HTML au premier octet, comme pour
 * `StaticGrid`. C'est elle qui devient le LCP de l'accueil — d'où le
 * `priority`. Rendue côté client, elle aurait reproduit exactement le défaut
 * corrigé le 2026-10-07 : image découverte après l'hydratation.
 *
 * Aucun état, aucun gestionnaire : zéro octet de JavaScript en plus.
 */
export async function ShopHeroBanner({ hero }: { hero: ShopHero }) {
  const imageUrl = hero.imageUrl ?? (await fallbackImage(hero.href))

  return (
    /* Pleine largeur sous 640 px (`-mx-4`, qui annule le `px-4` du `<main>`) :
       une bannière avec 16 px de marge de chaque côté se lit comme une carte
       de plus, pas comme une ouverture. Au-dessus, elle rentre dans la
       colonne et prend le rayon des cartes.

       Le fond est un dégradé de jetons du thème, pas une photo étalée. C'est
       imposé par nos propres photos : elles sont détourées (`-nobg`), donc
       transparentes autour du maillot. En `object-cover` sur une bannière
       large et basse, on recadre le vide au milieu d'un carré transparent —
       la bannière s'affichait entièrement noire, image chargée. Un maillot
       détouré est un sujet, pas une texture : il se pose à droite, entier, et
       le texte occupe la gauche. */
    <Link
      href={hero.href}
      className="group relative -mx-4 block overflow-hidden border-y border-foreground/8 bg-gradient-to-br from-primary/25 via-card to-background sm:mx-0 sm:rounded-card sm:border"
    >
      {/* Une hauteur minimale, pas un rapport fixe : c'est le bloc de texte qui
          donne la hauteur. En `aspect-[16/9]`, la bannière faisait 213 px sur
          un écran de 375 et repoussait la première rangée de maillots sous la
          ligne de flottaison — or c'est elle qui vend. Et un sous-titre un peu
          long se serait fait rogner sans prévenir. */}
      <div className="relative flex min-h-[180px] flex-col justify-end gap-2 p-4 pr-[40%] sm:min-h-[200px] sm:p-6 sm:pr-[38%]">
        <h2 className="font-display text-3xl leading-none tracking-wide sm:text-5xl">
          {/* Bebas ne contient que des capitales : un titre de bannière est le
              cas pour lequel `--font-display` existe. */}
          {hero.title}
        </h2>
        {hero.subtitle ? (
          <p className="text-sm text-muted-foreground sm:text-base">{hero.subtitle}</p>
        ) : null}
        <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
          Voir la collection
          <ArrowRight
            className="size-4 transition-transform duration-200 group-hover:translate-x-1"
            aria-hidden
          />
        </span>
      </div>

      {imageUrl ? (
        /* `object-bottom` : le maillot touche le bas du cadre au lieu de
           flotter au milieu, ce qui le fait appartenir à la bannière plutôt
           que d'avoir l'air collé dessus. */
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[40%] sm:w-[36%]">
          <NextImage
            src={imageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 40vw, 420px"
            priority
            className="object-contain object-bottom p-2 transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </div>
      ) : null}
    </Link>
  )
}

/**
 * La photo du maillot le plus récent derrière le lien de la bannière.
 *
 * Évite d'imposer un téléversement de plus dans les réglages pour la raison
 * qui compte : la bannière reste **une de nos photos**, jamais un visuel
 * officiel ni une image générée. Elle suit donc la collection — une nouvelle
 * arrivée en Sénégal change la bannière sans que personne y touche.
 *
 * Le lien est lu comme une URL interne : son chemin donne la catégorie, son
 * paramètre `equipe` l'équipe. Les deux sont les filtres que la grille
 * comprend déjà, donc une bannière ne peut pointer que vers une liste qui
 * existe vraiment.
 */
async function fallbackImage(href: string): Promise<string | null> {
  const catalog = await getCatalog()

  // Base factice : `href` est garanti relatif par la validation de l'action,
  // et `URL` exige une base pour en parser un.
  const url = new URL(href, 'https://dakarkits.invalid')
  const category = categoryOf(url.pathname)
  const teamId = Number(url.searchParams.get('equipe'))

  const matching = catalog.filter((product) => {
    if (!inCategory(product, category)) return false
    return Number.isInteger(teamId) && teamId > 0 ? product.teamId === teamId : true
  })

  // `getCatalog` trie déjà du plus récent au plus ancien.
  return pickImage(matching) ?? pickImage(catalog)
}

function pickImage(products: ShopProduct[]): string | null {
  return products.find((product) => product.imageUrl)?.imageUrl ?? null
}

function categoryOf(pathname: string): Category {
  return CATEGORIES.find((entry) => entry.href === pathname)?.value ?? 'tous'
}
