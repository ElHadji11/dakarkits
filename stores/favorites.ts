'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type FavoritesState = {
  ids: number[]
  toggle: (productId: number) => void
  /**
   * Remet un favori **à sa place d'origine**, pour annuler un retrait.
   *
   * `toggle` suffirait à le remettre dans la liste, mais à la fin : sur
   * `/favoris`, la grille suit l'ordre de `ids`, donc le maillot « annulé »
   * aurait sauté en dernière position. Une annulation qui déplace ce qu'elle
   * restaure n'annule pas grand-chose.
   */
  restore: (productId: number, index: number) => void
  clear: () => void
}

export const useFavorites = create<FavoritesState>()(
  persist(
    (set) => ({
      ids: [],

      toggle: (productId) =>
        set((state) => ({
          ids: state.ids.includes(productId)
            ? state.ids.filter((id) => id !== productId)
            : [...state.ids, productId],
        })),

      restore: (productId, index) =>
        set((state) => {
          // Deux « Annuler » sur le même maillot, ou un cœur retouché entre
          // temps : on ne le met pas deux fois dans la liste.
          if (state.ids.includes(productId)) return state
          const ids = [...state.ids]
          ids.splice(Math.min(Math.max(index, 0), ids.length), 0, productId)
          return { ids }
        }),

      clear: () => set({ ids: [] }),
    }),
    {
      name: 'dakarkits-favorites',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
