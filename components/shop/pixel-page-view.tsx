'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { trackPageView } from '@/lib/pixel'

/**
 * Une vue de page par page vue, navigations côté client comprises.
 *
 * La boutique navigue sans rechargement : sans ce composant, le `PageView` du
 * snippet serait le seul de toute la visite, et le catalogue, la fiche produit
 * et le panier compteraient pour une page. Le snippet ne l'envoie donc plus du
 * tout (voir `meta-pixel.tsx`) et tout passe par ici — une seule source, donc
 * pas de double comptage au premier chargement.
 *
 * `useRef` sur le dernier chemin envoyé, et pas un simple effet : en
 * développement, React monte deux fois sous StrictMode et l'effet se rejouerait
 * à l'identique. La ref survit au remontage, donc le même chemin n'est jamais
 * compté deux fois — en développement comme en production.
 *
 * `usePathname` et non `useSearchParams` : un changement de filtre ou de
 * recherche n'est pas une nouvelle page, et le compter comme telle gonflerait
 * les vues du catalogue.
 *
 * Le chemin reste une **donnée de requête** aux yeux de `cacheComponents` : il
 * bloque le prérendu exactement comme les paramètres, et le build échoue sans
 * frontière (`CLIENT_HOOK_DYNAMIC`). D'où le `Suspense` que `MetaPixel` pose
 * autour — la coquille statique du catalogue est intacte, et le pixel arrive en
 * flux juste après. Ne pas appeler ce composant sans cette frontière.
 */
export function PixelPageView() {
  const pathname = usePathname()
  const lastSent = useRef<string | null>(null)

  useEffect(() => {
    if (lastSent.current === pathname) return
    lastSent.current = pathname
    trackPageView()
  }, [pathname])

  return null
}
