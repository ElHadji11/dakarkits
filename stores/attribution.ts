'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type Attribution = {
  utmSource: string | null
  utmCampaign: string | null
  utmContent: string | null
  fbclid: string | null
}

export const emptyAttribution: Attribution = {
  utmSource: null,
  utmCampaign: null,
  utmContent: null,
  fbclid: null,
}

type AttributionState = Attribution & {
  capture: (next: Attribution) => void
}

/**
 * Kept for the visit, not forever: sessionStorage. A customer who comes back a
 * week later through a different route should not have their order credited to
 * the old campaign.
 */
export const useAttribution = create<AttributionState>()(
  persist(
    (set) => ({
      ...emptyAttribution,
      capture: (next) =>
        set((current) => ({
          // First touch wins: the advert that opened the visit is the one that
          // brought the customer, even if they browse on through other links.
          utmSource: current.utmSource ?? next.utmSource,
          utmCampaign: current.utmCampaign ?? next.utmCampaign,
          utmContent: current.utmContent ?? next.utmContent,
          fbclid: current.fbclid ?? next.fbclid,
        })),
    }),
    {
      name: 'dakarkits-attribution',
      version: 1,
      // Rendered on the server too, where sessionStorage does not exist.
      // A no-op store there keeps zustand quiet without disabling anything in
      // the browser.
      storage: createJSONStorage(() =>
        typeof window === 'undefined'
          ? { getItem: () => null, setItem: () => {}, removeItem: () => {} }
          : window.sessionStorage,
      ),
      partialize: ({ utmSource, utmCampaign, utmContent, fbclid }) => ({
        utmSource,
        utmCampaign,
        utmContent,
        fbclid,
      }),
    },
  ),
)
