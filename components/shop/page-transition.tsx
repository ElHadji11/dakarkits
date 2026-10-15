import { ViewTransition } from 'react'

/**
 * Le glissement directionnel d'une page entière.
 *
 * **Posé dans chaque `page.tsx`, jamais dans un layout** : un layout survit à
 * la navigation, donc il ne se monte ni ne se démonte, et `enter` / `exit` n'y
 * joueraient jamais.
 *
 * Seules les navigations qui portent un type glissent (`NAV_FORWARD`,
 * `NAV_BACK` dans `lib/view-transitions.ts`). Tout le reste — bouton retour du
 * navigateur, filtre du catalogue, `router.refresh()`, apparition d'un
 * `<Suspense>` — tombe sur `default: 'none'` et ne bouge pas : un filtre qui
 * ferait glisser la grille donnerait l'impression d'avoir changé de page.
 *
 * Composant serveur : zéro octet de JavaScript, `<ViewTransition>` vient de
 * React lui-même.
 */
const DIRECTIONS = {
  'nav-forward': 'nav-forward',
  'nav-back': 'nav-back',
  default: 'none',
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter={DIRECTIONS} exit={DIRECTIONS} default="none">
      {children}
    </ViewTransition>
  )
}
