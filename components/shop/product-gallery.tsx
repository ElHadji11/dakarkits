'use client'

import { Shirt } from 'lucide-react'
import NextImage from 'next/image'
import { useState } from 'react'

import { KitPhoto } from '@/components/shop/kit-photo'
import { cn } from '@/lib/utils'

/**
 * Swipeable on a phone through CSS scroll-snap — no carousel library, no
 * JavaScript on the critical path. The thumbnails are just anchors into the
 * same scroller.
 *
 * La première photo porte le nom de transition du maillot, comme sa carte
 * dans le catalogue : c'est elle qui arrive en glissant depuis la grille. Les
 * suivantes non — elles n'ont pas de carte d'où venir.
 */
export function ProductGallery({
  images,
  title,
  slug,
}: {
  images: Array<{ id: number; url: string }>
  title: string
  /** Le slug de la fiche, pour le nom de transition de la première photo. */
  slug: string
}) {
  const [active, setActive] = useState(0)

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg bg-card text-muted-foreground">
        <Shirt className="size-12" aria-hidden />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ul
        /* `overscroll-x-contain` : arrivé à la dernière photo, un balayage de
           plus partait dans le geste « retour » d'Android Chrome et quittait la
           fiche. Regarder les photos est précisément ce qu'on vient faire ici —
           ça ne doit pas pouvoir faire sortir de la page. */
        className="flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain rounded-lg [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={(event) => {
          const el = event.currentTarget
          setActive(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)))
        }}
      >
        {images.map((image, index) => (
          <li key={image.id} className="w-full shrink-0 snap-center">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-card">
              <KitPhoto slug={slug} share={index === 0}>
                <NextImage
                  src={image.url}
                  alt={index === 0 ? title : `${title} — photo ${index + 1}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 560px"
                  priority={index === 0}
                  loading={index === 0 ? undefined : 'lazy'}
                  className="object-contain p-4"
                />
              </KitPhoto>
            </div>
          </li>
        ))}
      </ul>

      {images.length > 1 ? (
        <div className="flex justify-center gap-2" aria-hidden>
          {images.map((image, index) => (
            <span
              key={image.id}
              className={cn(
                'h-1.5 rounded-full transition-all',
                index === active ? 'w-5 bg-primary' : 'w-1.5 bg-border',
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
