'use client'

import { Heart, Truck } from 'lucide-react'
import Link from 'next/link'

import { CartButton } from '@/components/shop/cart-button'
import { Logo } from '@/components/shop/logo'
import { SearchBox } from '@/components/shop/search-box'
import { Button } from '@/components/ui/button'
import { useHideOnScroll } from '@/hooks/use-hide-on-scroll'
import { useHydrated } from '@/hooks/use-hydrated'
import { deliveryPromise, type ShopSettings } from '@/lib/shop-types'
import { HEADER_NAME, NAV_BACK, NAV_FORWARD } from '@/lib/view-transitions'
import { useFavorites } from '@/stores/favorites'

/**
 * L'en-tête collé, et le compromis qu'il règle.
 *
 * Il prenait 138 px en haut de chaque page sur un téléphone : bandeau de
 * promo, promesse de livraison, logo, puis la recherche sur sa propre ligne.
 * Avec la barre d'adresse du navigateur, un visiteur voyait une carte et demie
 * avant de devoir défiler. Deux mesures, dans cet ordre :
 *
 *   1. Les hauteurs sont au plus juste — mais pas en dessous de 44 px pour ce
 *      qui se touche. La recherche garde donc sa ligne et sa hauteur : c'est
 *      une cible tactile, pas une décoration.
 *   2. L'en-tête s'efface au défilement vers le bas et revient au premier
 *      geste vers le haut (`useHideOnScroll`), ce qui rend les 124 px
 *      restants à la grille dès la première glissade.
 *
 * La promesse de livraison reste dedans, et c'est un choix assumé : elle ne
 * défile plus hors de l'écran pour de bon, elle revient avec l'en-tête à
 * chaque geste vers le haut — donc à chaque fois que le visiteur cherche où
 * il en est, ce qui est aussi le moment où il se demande ce que coûte la
 * livraison.
 */
export function SiteHeader({ settings }: { settings: ShopSettings }) {
  const hydrated = useHydrated()
  const favorites = useFavorites((state) => state.ids.length)
  // Écrit `data-hidden` sur le nœud, sans re-rendre : voir le hook.
  const ref = useHideOnScroll<HTMLElement>()

  return (
    <header
      ref={ref}
      data-hidden="false"
      /* Ancré pendant les glissements de page : le contenu bouge, l'en-tête
         reste le point fixe qui dit que c'est la page qui a changé, pas
         l'écran entier (voir `::view-transition-group(site-header)` dans
         globals.css). Même nom que l'en-tête du tunnel : entre le panier et
         la commande, l'un remplace l'autre sans fondu croisé. */
      style={{ viewTransitionName: HEADER_NAME }}
      className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur transition-transform duration-200 ease-out data-[hidden=true]:-translate-y-full"
    >
      {/* L’argument de vente qui décide un panier, au-dessus du logo. La
          phrase vient de `deliveryPromise`, donc du réglage — jamais écrite en
          dur, sinon elle promettrait le gratuit le jour où la livraison
          redevient payante. */}
      <div className="border-b border-border/60 bg-primary/10">
        <p className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-1 text-xs font-medium text-foreground">
          <Truck className="size-3.5 shrink-0 text-primary" aria-hidden />
          {/* Un seul enfant du flex : un seul `gap`. Le rappel du paiement
              disparaît sous 640 px, où la phrase entière passerait sur deux
              lignes et rendrait la barre collée trop haute. */}
          <span>
            {deliveryPromise(settings)}
            <span className="hidden sm:inline"> · Paiement à la livraison</span>
          </span>
        </p>
      </div>

      <div className="mx-auto flex h-12 max-w-6xl items-center gap-2 px-4 sm:h-14">
        {/* Le monogramme est `aria-hidden` : le nom accessible du lien vient du
            texte, et vaut donc « DakarKits » sans qu'il faille un aria-label. */}
        <Link href="/" transitionTypes={NAV_BACK} className="flex shrink-0 items-center gap-2">
          <Logo className="h-6 w-auto" />
          {/* Bebas n'a qu'une graisse : `font-semibold` n'aurait rien donné.
              Capitales condensées, donc `tracking-wide` pour les aérer. */}
          <span className="font-display text-xl leading-none tracking-wide sm:text-2xl">
            DakarKits
          </span>
        </Link>

        <div className="ml-2 hidden flex-1 sm:flex">
          <SearchBox />
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Button asChild variant="ghost" size="icon" className="relative size-11">
            <Link href="/favoris" transitionTypes={NAV_FORWARD} aria-label="Favoris">
              <Heart className="size-5" aria-hidden />
              {hydrated && favorites > 0 ? (
                <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold tabular-nums text-primary-foreground">
                  {favorites}
                </span>
              ) : null}
            </Link>
          </Button>
          <CartButton />
        </div>
      </div>

      <div className="px-4 pb-2 sm:hidden">
        <SearchBox />
      </div>
    </header>
  )
}
