'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

/**
 * How a suggestion reaches the fields that own their state.
 *
 * A plain `<Input defaultValue>` can be written straight through the DOM, which
 * is what the AI button does. `SelectField`, `CheckboxField` and `TeamPicker`
 * cannot: their hidden input mirrors React state, so a DOM write is wiped on
 * the next render and the visible Radix trigger would not move either. They
 * listen here instead.
 *
 * `nonce` is what makes a patch apply exactly once — the same value patched
 * twice in a row still counts as two patches, and a re-render counts as none.
 */
type Patch = { nonce: number; fields: Record<string, string> }

type Store = { patch: Patch; apply: (fields: Record<string, string>) => void }

const EMPTY: Patch = { nonce: 0, fields: {} }

const PatchContext = createContext<Store>({ patch: EMPTY, apply: () => {} })

export function FieldPatchProvider({ children }: { children: ReactNode }) {
  const [patch, setPatch] = useState<Patch>(EMPTY)

  const apply = useCallback((fields: Record<string, string>) => {
    setPatch((current) => ({ nonce: current.nonce + 1, fields }))
  }, [])

  const store = useMemo(() => ({ patch, apply }), [patch, apply])

  return <PatchContext.Provider value={store}>{children}</PatchContext.Provider>
}

/** Pushes values into the fields that are listening. */
export function useApplyPatch() {
  return useContext(PatchContext).apply
}

/**
 * Calls `apply` with the patched value for `name`, once per patch. A field the
 * patch does not mention is left exactly as the admin left it.
 */
export function useFieldPatch(name: string, apply: (value: string) => void) {
  const { patch } = useContext(PatchContext)
  const applied = useRef(patch.nonce)

  // Callers pass an inline arrow, so this runs on every render — and does
  // nothing at all unless the nonce moved, which is the whole point.
  useEffect(() => {
    if (patch.nonce === applied.current) return
    applied.current = patch.nonce

    const value = patch.fields[name]
    if (value !== undefined) apply(value)
  }, [patch, name, apply])
}
