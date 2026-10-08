import type { MetadataRoute } from 'next'

import { siteUrl } from '@/lib/constants'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Nothing here is useful to a crawler, and the cart and order pages are
      // personal.
      disallow: ['/admin', '/panier', '/favoris', '/commande'],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  }
}
