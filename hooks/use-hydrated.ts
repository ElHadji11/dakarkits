'use client'

import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/**
 * False while rendering on the server and during the first client render, true
 * afterwards. Lets a component wait for localStorage-backed state without a
 * hydration mismatch, and without setting state inside an effect.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
}
