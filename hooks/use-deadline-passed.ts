'use client'

import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/**
 * False on the server and during the first client render, then true once
 * `deadline` is in the past on the visitor's clock.
 *
 * Same shape as `useHydrated`, and for the same two reasons: the first client
 * render must match the server markup, and the clock must be read outside the
 * component body — `Date.now()` during render is impure, and setting state in
 * an effect to work around it is worse.
 *
 * `deadline` is a timestamp in milliseconds.
 */
export function useDeadlinePassed(deadline: number): boolean {
  return useSyncExternalStore(
    subscribe,
    () => Date.now() > deadline,
    () => false,
  )
}
