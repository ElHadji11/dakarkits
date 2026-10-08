import type { MetadataRoute } from 'next'

import { siteUrl } from '@/lib/constants'
import { getCatalog } from '@/lib/shop'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalog = await getCatalog()
  const root = siteUrl()

  const pages: MetadataRoute.Sitemap = [
    { url: `${root}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${root}/clubs`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${root}/selections`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${root}/retro`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${root}/confidentialite`, changeFrequency: 'yearly', priority: 0.1 },
    { url: `${root}/cgv`, changeFrequency: 'yearly', priority: 0.1 },
  ]

  return [
    ...pages,
    ...catalog.map((product) => ({
      url: `${root}/maillot/${product.slug}`,
      lastModified: new Date(product.createdAt),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),
  ]
}
