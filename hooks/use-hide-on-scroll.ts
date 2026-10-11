'use client'

import { useEffect, useRef } from 'react'

/** En haut de page, l'en-tête reste visible quoi qu'il arrive. */
const REVEAL_ZONE = 64

/** Un pouce qui tremble sur un téléphone n'est pas un changement de sens. */
const THRESHOLD = 8

/**
 * Masque un élément collé pendant un défilement vers le bas, le ramène au
 * premier geste vers le haut.
 *
 * **Aucun état React, et c'est tout l'intérêt.** Un `useState` mis à jour à
 * chaque image de défilement ferait re-rendre l'en-tête — donc `SearchBox` et
 * `CartButton` avec lui — sur la page dont le LCP se joue déjà sur le fil
 * principal (relevé du 2026-10-07 : image reçue en 263 ms, peinte à 2 s). Ici
 * le hook écrit un attribut `data-hidden` sur le nœud, par `ref` : le
 * compositeur applique la transformation, React ne sait même pas que la page
 * a bougé.
 *
 * Trois précautions, toutes payées en bugs ailleurs :
 *
 *   - `translateY` et rien d'autre côté CSS. Réduire la hauteur ferait
 *     remonter la page sous le doigt et compterait comme décalage de mise en
 *     page.
 *   - L'en-tête ne se cache jamais tant qu'un de ses champs a le focus :
 *     sinon la liste de résultats de la recherche part hors écran pendant la
 *     frappe.
 *   - Listener `passive`, une seule lecture par image via `requestAnimationFrame`.
 *     Lire `scrollY` dans le gestionnaire lui-même force un recalcul de mise
 *     en page à chaque événement.
 */
export function useHideOnScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    let last = window.scrollY
    let frame = 0

    const read = () => {
      frame = 0
      const y = window.scrollY
      const delta = y - last

      // Sous le seuil, on ne touche à rien *et* on ne déplace pas le repère :
      // une suite de petits gestes dans le même sens finit par le franchir.
      if (Math.abs(delta) < THRESHOLD) return
      last = y

      const typing = element.contains(document.activeElement)
      const hide = delta > 0 && y > REVEAL_ZONE && !typing
      element.dataset.hidden = hide ? 'true' : 'false'
    }

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(read)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return ref
}
