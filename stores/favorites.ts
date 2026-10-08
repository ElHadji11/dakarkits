'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type FavoritesState = {
  ids: number[]
  toggle: (productId: number) => void
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

      clear: () => set({ ids: [] }),
    }),
    {
      name: 'dakarkits-favorites',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
