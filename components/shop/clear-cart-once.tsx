'use client'

import { useEffect } from 'react'

import { useCart } from '@/stores/cart'

const MARKER = 'dakarkits-cleared-order'

/**
 * Empties the basket once the order exists, and only once per order. Revisiting
 * an old confirmation link later must not wipe a basket filled since.
 */
export function ClearCartOnce({ orderNumber }: { orderNumber: string }) {
  const clear = useCart((state) => state.clear)

  useEffect(() => {
    try {
      if (localStorage.getItem(MARKER) === orderNumber) return
      localStorage.setItem(MARKER, orderNumber)
    } catch {
      // Private window or blocked storage: clearing twice is harmless.
    }
    clear()
  }, [orderNumber, clear])

  return null
}
