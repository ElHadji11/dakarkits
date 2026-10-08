'use client'

/**
 * next/image loader pointed at ImageKit.
 *
 * We keep Next's lazy loading, `priority` and srcset generation, but ImageKit
 * does the resizing — so Vercel bills no image-optimization units and the CDN
 * closest to Dakar serves the bytes. `f-auto` picks AVIF or WebP per browser.
 *
 * Anything that is not an ImageKit URL passes through untouched.
 */
export default function imagekitLoader({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}): string {
  const endpoint = (process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ?? '').replace(/\/+$/, '')
  if (!endpoint || !src.startsWith(endpoint)) return src

  const [base, existingQuery] = src.split('?')
  const params = new URLSearchParams(existingQuery)
  const transforms = [`w-${width}`, `q-${quality ?? 75}`, 'f-auto', 'c-at_max']

  // Preserve a transform already on the URL by chaining ours after it.
  const existing = params.get('tr')
  params.set('tr', existing ? `${existing}:${transforms.join(',')}` : transforms.join(','))

  return `${base}?${params.toString()}`
}
