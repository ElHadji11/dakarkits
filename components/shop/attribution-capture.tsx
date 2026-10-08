'use client'

import { useSearchParams } from 'next/navigation'

import { useAttribution } from '@/stores/attribution'

/**
 * Reads the advert parameters off the landing URL and keeps them for the
 * visit, so the order can say which campaign paid for it.
 *
 * Runs during render rather than in an effect: the store ignores a second
 * capture, so repeating it is free and there is no extra pass.
 */
export function AttributionCapture() {
  const searchParams = useSearchParams()
  const capture = useAttribution((state) => state.capture)

  const next = {
    utmSource: searchParams.get('utm_source'),
    utmCampaign: searchParams.get('utm_campaign'),
    utmContent: searchParams.get('utm_content'),
    fbclid: searchParams.get('fbclid'),
  }

  if (next.utmSource || next.utmCampaign || next.utmContent || next.fbclid) {
    capture(next)
  }

  return null
}
