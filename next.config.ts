import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Static shell + `use cache` + updateTag: catalogue pages are served from the
  // CDN and invalidated the moment a product changes.
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // ImageKit resizes; Vercel's optimizer is bypassed entirely.
    loader: 'custom',
    loaderFile: './lib/image-loader.ts',
  },
  turbopack: {
    // Pinned explicitly: a stray package-lock.json higher up the drive would
    // otherwise make root detection ambiguous.
    root: import.meta.dirname,
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
}

export default nextConfig
