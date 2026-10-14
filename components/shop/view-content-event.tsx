'use client'

import { useEffect, useRef } from 'react'

import { trackViewContent } from '@/lib/pixel'

/**
 * `ViewContent`, une fois la fiche produit à l'écran.
 *
 * `useRef` et non un effet nu : sous StrictMode, React monte deux fois en
 * développement et l'événement partait en double. La ref survit au remontage,
 * donc un maillot consulté une fois n'est compté qu'une fois.
 *
 * Le nom vient du parent, qui le compose avec `productName` : c'est celui que le
 * visiteur a sous les yeux, pas `products.title` — lequel porte les traces de
 * chaque saisie et dirait « Barcelona » d'un maillot présenté comme
 * « FC Barcelone · Domicile 2026/27 ».
 */
export function ViewContentEvent({
  productId,
  name,
  value,
}: {
  productId: number
  name: string
  value: number
}) {
  const sent = useRef<number | null>(null)

  useEffect(() => {
    if (sent.current === productId) return
    sent.current = productId
    trackViewContent(productId, name, value)
  }, [productId, name, value])

  return null
}
