import 'server-only'

import { createHash } from 'node:crypto'

import { eurFromCfa } from '@/lib/money'

const API_VERSION = 'v21.0'

export type PurchaseEvent = {
  /** Shared with the browser Pixel so Meta counts the sale once. */
  eventId: string
  eventSourceUrl: string
  /** En francs CFA, comme partout ailleurs. Converti en euros juste avant l'envoi. */
  value: number
  contentIds: string[]
  /** Un maillot par ligne, pour `contents` et `num_items`. */
  contents: Array<{ id: string; quantity: number }>
  /** Stored form, +2217XXXXXXXX. Hashed before it ever leaves this process. */
  phone: string
  clientIpAddress: string | null
  clientUserAgent: string | null
  fbp: string | null
  fbc: string | null
}

export function isMetaConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID && process.env.META_CAPI_ACCESS_TOKEN)
}

/** Meta wants normalised-then-SHA256: digits only, country code included. */
function hashPhone(phone: string): string {
  return createHash('sha256').update(phone.replace(/\D/g, '')).digest('hex')
}

/**
 * Server-side Purchase, sent alongside the browser Pixel.
 *
 * The two carry the same `event_id`, which is how Meta deduplicates them: the
 * sale shows once in Events Manager whether or not the browser event made it
 * through an ad blocker or a lost connection.
 *
 * Never throws — a reporting failure must not touch the order.
 */
export async function sendPurchaseToCapi(event: PurchaseEvent): Promise<void> {
  if (!isMetaConfigured()) {
    console.warn('[meta] pixel id or CAPI token missing; skipping server Purchase')
    return
  }

  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID!
  const token = process.env.META_CAPI_ACCESS_TOKEN!
  const testCode = process.env.META_CAPI_TEST_EVENT_CODE

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        event_id: event.eventId,
        event_source_url: event.eventSourceUrl,
        action_source: 'website',
        user_data: {
          ph: [hashPhone(event.phone)],
          ...(event.clientIpAddress ? { client_ip_address: event.clientIpAddress } : {}),
          ...(event.clientUserAgent ? { client_user_agent: event.clientUserAgent } : {}),
          ...(event.fbp ? { fbp: event.fbp } : {}),
          ...(event.fbc ? { fbc: event.fbc } : {}),
        },
        /* Mêmes champs, même devise et même valeur que le Pixel du navigateur.
           Les deux rapports portent le même `event_id` : s'ils annonçaient des
           montants différents, Events Manager en garderait un au hasard.

           EUR et non XOF : Meta ne sait pas lire le franc CFA, et un événement
           dans une devise inconnue n'est pas valorisé du tout. Voir
           `lib/money.ts`. */
        custom_data: {
          currency: 'EUR',
          value: eurFromCfa(event.value),
          content_type: 'product',
          content_ids: event.contentIds,
          contents: event.contents,
          num_items: event.contents.reduce((total, item) => total + item.quantity, 0),
        },
      },
    ],
  }
  if (testCode) body.test_event_code = testCode

  try {
    const response = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${pixelId}/events?access_token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    )
    if (!response.ok) {
      console.error(`[meta] CAPI ${response.status}: ${await response.text()}`)
    }
  } catch (error) {
    console.error('[meta] CAPI request failed', error)
  }
}
