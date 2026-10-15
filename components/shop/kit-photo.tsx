import { ViewTransition } from 'react'

import { kitPhotoName } from '@/lib/view-transitions'

/**
 * La photo d'un maillot sous son nom de transition, ou telle quelle.
 *
 * Partagée par la carte, la galerie et le squelette de la fiche : les trois portent
 * exactement les mêmes réglages, sinon la paire ne se forme pas — un
 * `default="none"` sans `share` explicite, en particulier, fait cesser le
 * glissement sans la moindre erreur.
 *
 * Sans `'use client'` : ses trois appelants — la carte, la galerie et le
 * squelette — sont déjà des composants client, et celui-ci n'a ni état ni
 * gestionnaire d'événement. Il n'ouvre donc aucune frontière de plus, et son
 * `<ViewTransition>` se rend aussi bien au rendu serveur de ces pages qu'au
 * navigateur.
 */
export function KitPhoto({
  slug,
  share = true,
  onlyWhenNavigating = false,
  children,
}: {
  slug: string
  share?: boolean
  /**
   * Ne glisser que sur une navigation typée (`nav-forward`, `nav-back`).
   *
   * Pour les cartes du catalogue. Entre deux onglets (Tous → Clubs), chaque
   * maillot présent sur les deux pages formait sinon une paire, et toute la
   * grille se réarrangeait en glissant : vérifié dans Chrome. Joli sur douze
   * cartes, mais une capture par carte — hors écran comprises — sur un
   * catalogue qui monte à 200 maillots, c'est le genre de travail qu'un
   * Android d'entrée de gamme fait en saccadant. Le trajet qui compte, celui
   * d'une carte vers sa fiche, est toujours typé.
   */
  onlyWhenNavigating?: boolean
  children: React.ReactNode
}) {
  if (!share) return children
  return (
    <ViewTransition
      name={kitPhotoName(slug)}
      share={onlyWhenNavigating ? NAVIGATION_ONLY : 'morph'}
      default="none"
    >
      {children}
    </ViewTransition>
  )
}

const NAVIGATION_ONLY = { 'nav-forward': 'morph', 'nav-back': 'morph', default: 'none' }
