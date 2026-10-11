'use client'

import { Sparkles } from 'lucide-react'

import { useDeadlinePassed } from '@/hooks/use-deadline-passed'

/**
 * Fin de la promo de lancement — dernière seconde du 1er novembre 2026.
 *
 * Dakar est à l'heure UTC toute l'année, donc pas d'heure d'été à rattraper.
 */
export const LAUNCH_PROMO_END = Date.UTC(2026, 10, 1, 23, 59, 59)

/**
 * Le bandeau de lancement.
 *
 * **Il s'efface tout seul, et c'est tout l'enjeu.** La boutique est prérendue
 * en `cacheLife('max')` : le HTML servi par le CDN peut dater de trente jours
 * et n'est rafraîchi que par un `updateTag` venu de l'admin. Un bandeau daté
 * rendu uniquement côté serveur continuerait donc d'annoncer la promo
 * longtemps après le 1er novembre — exactement le genre de promesse périmée
 * qui fait refuser une commande.
 *
 * La date est donc vérifiée sur l'horloge du visiteur, via
 * `useDeadlinePassed`. Le bandeau part dans le HTML statique — aucun décalage
 * de mise en page pendant la promo, ce qui compte sur le chemin du LCP du
 * catalogue — puis disparaît au rendu client une fois la date passée.
 *
 * Il vit **au-dessus** de l'en-tête collé et non dedans : la barre collée
 * garde sa hauteur, et la promo défile hors de l'écran après avoir été lue.
 */
export function PromoBanner() {
  if (useDeadlinePassed(LAUNCH_PROMO_END)) return null

  return (
    <div className="bg-primary text-primary-foreground">
      <p className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2 text-center text-xs font-semibold sm:text-sm">
        <Sparkles className="size-4 shrink-0" aria-hidden />
        {/* Un seul enfant du flex : un seul `gap`. Sortir la date dans son
            propre span en ferait un élément flex de plus, donc 8 px avant. */}
        <span>Promo de lancement · jusqu&apos;au 1er novembre</span>
      </p>
    </div>
  )
}
