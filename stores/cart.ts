'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { Size } from '@/lib/constants'

/**
 * The basket holds identity only — never a price. Prices are read from the
 * catalogue for display and recomputed on the server at checkout, so a stale
 * localStorage entry can never decide what someone pays.
 */
export type CartLine = {
  productId: number
  /** Null for a jersey sold without sizes. */
  size: Size | null
  quantity: number
}

type CartState = {
  lines: CartLine[]
  add: (productId: number, size: Size | null, quantity?: number) => void
  setQuantity: (productId: number, size: Size | null, quantity: number) => void
  remove: (productId: number, size: Size | null) => void
  /**
   * Remet une ligne supprimée **telle qu'elle était, à sa place**, pour
   * annuler une suppression.
   *
   * `add` ne ferait pas l'affaire : il ajoute à la fin et avec une quantité de
   * 1. Annuler la suppression de « 3 × Sénégal domicile, taille L » doit
   * rendre les trois, et au milieu du panier si c'est là qu'ils étaient.
   */
  restore: (line: CartLine, index: number) => void
  clear: () => void
}

const same = (line: CartLine, productId: number, size: Size | null) =>
  line.productId === productId && line.size === size

const MAX_PER_LINE = 20

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],

      add: (productId, size, quantity = 1) =>
        set((state) => {
          const existing = state.lines.find((line) => same(line, productId, size))
          if (!existing) {
            return { lines: [...state.lines, { productId, size, quantity }] }
          }
          return {
            lines: state.lines.map((line) =>
              same(line, productId, size)
                ? { ...line, quantity: Math.min(line.quantity + quantity, MAX_PER_LINE) }
                : line,
            ),
          }
        }),

      setQuantity: (productId, size, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((line) => !same(line, productId, size))
              : state.lines.map((line) =>
                  same(line, productId, size)
                    ? { ...line, quantity: Math.min(quantity, MAX_PER_LINE) }
                    : line,
                ),
        })),

      remove: (productId, size) =>
        set((state) => ({ lines: state.lines.filter((line) => !same(line, productId, size)) })),

      restore: (line, index) =>
        set((state) => {
          // Le même maillot dans la même taille a pu être réajouté entre la
          // suppression et l'appui sur « Annuler ».
          if (state.lines.some((other) => same(other, line.productId, line.size))) return state
          const lines = [...state.lines]
          lines.splice(Math.min(Math.max(index, 0), lines.length), 0, {
            ...line,
            quantity: Math.min(line.quantity, MAX_PER_LINE),
          })
          return { lines }
        }),

      clear: () => set({ lines: [] }),
    }),
    {
      name: 'dakarkits-cart',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
