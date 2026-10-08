'use client'

import { useEffect, useRef } from 'react'

import { trackPurchase } from '@/lib/pixel'

/**
 * Browser half of the Purchase event. The server sends the same `event_id` to
 * the Conversions API, so Meta shows one sale even though two reports arrive —
 * and reloading this page cannot inflate the count either.
 */
export function PurchaseEvent({
  eventId,
  productIds,
  value,
}: {
  eventId: string
  productIds: string[]
  value: number
}) {
  const sent = useRef(false)

  useEffect(() => {
    if (sent.current) return
    sent.current = true
    trackPurchase(eventId, productIds, value)
  }, [eventId, productIds, value])

  return null
}
