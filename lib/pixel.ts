'use client'

/**
 * Thin wrapper over the Meta Pixel. Every call is a no-op when the pixel is not
 * configured or has not loaded yet, so nothing here can break a page.
 */

type Fbq = (...args: unknown[]) => void

function fbq(): Fbq | null {
  if (typeof window === 'undefined') return null
  return (window as unknown as { fbq?: Fbq }).fbq ?? null
}

export function trackViewContent(productId: number, value: number): void {
  fbq()?.('track', 'ViewContent', {
    content_type: 'product',
    content_ids: [String(productId)],
    currency: 'XOF',
    value,
  })
}

export function trackAddToCart(productId: number, value: number): void {
  fbq()?.('track', 'AddToCart', {
    content_type: 'product',
    content_ids: [String(productId)],
    currency: 'XOF',
    value,
  })
}

export function trackInitiateCheckout(productIds: number[], value: number): void {
  fbq()?.('track', 'InitiateCheckout', {
    content_type: 'product',
    content_ids: productIds.map(String),
    currency: 'XOF',
    value,
  })
}

/**
 * `eventId` must match the one the server sends to the Conversions API, or the
 * sale is counted twice in Events Manager.
 */
export function trackPurchase(eventId: string, productIds: string[], value: number): void {
  fbq()?.(
    'track',
    'Purchase',
    { content_type: 'product', content_ids: productIds, currency: 'XOF', value },
    { eventID: eventId },
  )
}
