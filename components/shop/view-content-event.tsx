'use client'

import { useEffect } from 'react'

import { trackViewContent } from '@/lib/pixel'

/** Fires ViewContent once the product page is on screen. */
export function ViewContentEvent({ productId, value }: { productId: number; value: number }) {
  useEffect(() => {
    trackViewContent(productId, value)
  }, [productId, value])

  return null
}
