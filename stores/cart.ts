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

      clear: () => set({ lines: [] }),
    }),
    {
      name: 'dakarkits-cart',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
