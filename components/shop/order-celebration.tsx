'use client'

import { useEffect, useRef } from 'react'

/**
 * La coche et les confettis de la page de confirmation.
 *
 * C'est le seul endroit du parcours où une animation a le droit de coûter :
 * la vente est faite, le LCP de cette page n'a aucune valeur commerciale, et
 * c'est la page qu'on montre à un ami. Partout ailleurs le budget est fermé.
 *
 * La coche est du SVG animé en CSS (`.success-check` dans `globals.css`) :
 * elle part avec le HTML, sans attendre quoi que ce soit. Les confettis, eux,
 * arrivent par un import dynamique **après** le rendu — 8 Ko gzippés que
 * personne ne télécharge avant d'avoir commandé.
 */
export function OrderCelebration() {
  const fired = useRef(false)

  useEffect(() => {
    // StrictMode monte deux fois en développement : sans ce drapeau, deux
    // salves. Même idiome que `PurchaseEvent`, en plus simple — il n'y a rien
    // à compter ici, donc rien à garder d'une visite à l'autre.
    if (fired.current) return
    fired.current = true

    // Coupé avant même le téléchargement. `disableForReducedMotion` de
    // canvas-confetti ferait aussi le travail, mais après avoir chargé la
    // bibliothèque pour rien.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let cancelled = false
    void import('canvas-confetti').then(({ default: confetti }) => {
      if (cancelled) return
      void confetti({
        particleCount: 80,
        spread: 70,
        startVelocity: 35,
        scalar: 0.9,
        // Au tiers de la hauteur : les confettis tombent autour de la coche,
        // pas depuis le bord d'un écran de téléphone où on ne les verrait
        // qu'à moitié.
        origin: { y: 0.3 },
        colors: themeColors(),
        disableForReducedMotion: true,
      })
    })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <svg
      viewBox="0 0 48 48"
      className="success-check mx-auto size-12 text-primary"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="24" cy="24" r="21" />
      <path d="M15 24.5 21.5 31 34 18" />
    </svg>
  )
}

/**
 * Les couleurs du thème, en hexadécimal, ou rien.
 *
 * Aucune couleur en dur, c'est la règle du projet — mais canvas-confetti ne
 * sait lire que l'hexadécimal : il fait un `replace(/[^0-9a-f]/gi, '')` sur ce
 * qu'on lui donne, et un `oklch(...)` du thème en ressortirait en bouillie.
 * D'où le passage par un canvas, qui parse la couleur et la resérialise ; en
 * dehors du gamut sRGB il rend un `color(srgb …)` que l'on écarte.
 *
 * `undefined` plutôt qu'une liste bancale : canvas-confetti reprend alors ses
 * propres couleurs. Des confettis un peu moins à la charte valent mieux que
 * des confettis noirs.
 */
function themeColors(): string[] | undefined {
  const probe = document.createElement('canvas').getContext('2d')
  if (!probe) return undefined

  const root = getComputedStyle(document.documentElement)
  const colors = ['--primary', '--chart-2', '--chart-4']
    .map((token) => {
      const value = root.getPropertyValue(token).trim()
      if (!value) return null
      probe.fillStyle = '#000000'
      probe.fillStyle = value
      const parsed = probe.fillStyle
      return typeof parsed === 'string' && /^#[0-9a-f]{6}$/i.test(parsed) && parsed !== '#000000'
        ? parsed
        : null
    })
    .filter((color): color is string => color !== null)

  return colors.length > 0 ? colors : undefined
}
