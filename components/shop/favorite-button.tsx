'use client'

import { Heart } from 'lucide-react'

import { useHydrated } from '@/hooks/use-hydrated'
import { useFavorites } from '@/stores/favorites'
import { cn } from '@/lib/utils'

export function FavoriteButton({
  productId,
  className,
}: {
  productId: number
  className?: string
}) {
  const hydrated = useHydrated()
  const toggle = useFavorites((state) => state.toggle)
  const favorite = useFavorites((state) => state.ids.includes(productId))
  const active = hydrated && favorite

  return (
    <button
      type="button"
      // Inside a card link: stop the click from navigating.
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        toggle(productId)
      }}
      aria-pressed={active}
      aria-label={active ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      className={cn(
        // `transition` (et non `transition-colors`) couvre aussi la
        // transformation : le `active:scale-90` est le seul retour au doigt sur
        // un téléphone, où il n'y a pas de survol. 150 ms — au-delà, un appui
        // donne l'impression que l'interface réfléchit.
        'flex size-11 items-center justify-center rounded-full text-muted-foreground',
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
