'use client'

import { Heart } from 'lucide-react'
import { useRef } from 'react'

import { useHydrated } from '@/hooks/use-hydrated'
import { toastUndo } from '@/lib/toast'
import { useFavorites } from '@/stores/favorites'
import { cn } from '@/lib/utils'

export function FavoriteButton({
  productId,
  name,
  className,
}: {
  productId: number
  /** Le nom affiché du maillot, pour que le toast dise lequel vient de partir.
   *  Facultatif : sans lui le toast reste juste, il est seulement plus vague. */
  name?: string
  className?: string
}) {
  const hydrated = useHydrated()
  const favorite = useFavorites((state) => state.ids.includes(productId))
  const active = hydrated && favorite
  const ref = useRef<HTMLButtonElement>(null)

  /**
   * Ajouter est sans conséquence ; retirer efface quelque chose que le
   * visiteur avait mis de côté, et c'était jusqu'ici silencieux et définitif.
   * D'où le toast « Annuler » sur ce seul sens.
   *
   * `getState()` plutôt qu'un sélecteur de plus : il faut la position du
   * maillot dans la liste **avant** le retrait, et la lire au moment du clic
   * évite d'abonner chaque carte du catalogue à `ids` en entier.
   */
  const onToggle = () => {
    const { ids, toggle, restore } = useFavorites.getState()
    const index = ids.indexOf(productId)
    toggle(productId)
    if (index === -1) {
      /* L'éclat, à l'ajout seulement : retirer a déjà son toast, et deux
         réponses pour un même appui se marchent dessus. Écrit sur le nœud par
         `ref`, comme `useHideOnScroll` écrit `data-hidden` — un état React
         ici re-rendrait la carte, et il y en a une par maillot du catalogue.
         Au clic et non sur `aria-pressed` : à l'hydratation, tous les favoris
         déjà enregistrés éclateraient d'un coup. */
      ref.current?.setAttribute('data-burst', 'true')
      return
    }
    void toastUndo('Retiré des favoris', {
      description: name,
      onUndo: () => restore(productId, index),
    })
  }

  return (
    <button
      ref={ref}
      type="button"
      // Inside a card link: stop the click from navigating.
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onToggle()
      }}
      // L'animation du pseudo-élément remonte jusqu'ici : on retire le
      // marqueur à la fin pour que l'éclat puisse rejouer au prochain ajout.
      onAnimationEnd={() => ref.current?.removeAttribute('data-burst')}
      aria-pressed={active}
      aria-label={active ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      className={cn(
        // `transition` (et non `transition-colors`) couvre aussi la
        // transformation : le `active:scale-90` est le seul retour au doigt sur
        // un téléphone, où il n'y a pas de survol. 150 ms — au-delà, un appui
        // donne l'impression que l'interface réfléchit.
        'favorite-burst relative flex size-11 items-center justify-center rounded-full text-muted-foreground',
        'transition duration-150 hover:text-foreground active:scale-90',
        className,
      )}
    >
      <Heart
        className={cn('size-5 transition-colors', active && 'fill-primary text-primary')}
        aria-hidden
      />
    </button>
  )
}
