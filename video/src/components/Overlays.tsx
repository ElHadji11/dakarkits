import React, { useMemo } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { C } from '../theme'
import { random } from './anim'

/**
 * Grain argentique. Une tuile de bruit fabriquée une fois au canvas puis
 * déplacée à chaque frame : un `feTurbulence` plein cadre coûterait vingt fois
 * plus cher pour le même résultat.
 */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.055 }) => {
  const frame = useCurrentFrame()
  const url = useMemo(() => {
    const size = 160
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''
    const image = ctx.createImageData(size, size)
    for (let i = 0; i < size * size; i++) {
      const v = Math.round(random(`grain-${i}`) * 255)
      image.data[i * 4] = v
      image.data[i * 4 + 1] = v
      image.data[i * 4 + 2] = v
      image.data[i * 4 + 3] = 255
    }
    ctx.putImageData(image, 0, 0)
    return canvas.toDataURL()
  }, [])

  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url(${url})`,
        backgroundSize: '160px 160px',
        mixBlendMode: 'overlay',
        opacity,
        transform: `translate(${Math.round(random(`gx-${frame}`) * 160)}px, ${Math.round(
          random(`gy-${frame}`) * 160,
        )}px) scale(1.4)`,
        pointerEvents: 'none',
      }}
    />
  )
}

/** Lignes de balayage, très discrètes : l'image a l'air captée, pas calculée. */
export const Scanlines: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundImage:
        'repeating-linear-gradient(to bottom, rgba(255,255,255,0.045) 0px, rgba(255,255,255,0.045) 1px, transparent 1px, transparent 4px)',
      mixBlendMode: 'overlay',
      opacity: 0.5,
      pointerEvents: 'none',
    }}
  />
)

export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.72 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at center, transparent 42%, rgba(4,4,10,${strength}) 100%)`,
      pointerEvents: 'none',
    }}
  />
)

/** Éclat plein cadre. Sert à masquer les coupes dures. */
export const Flash: React.FC<{ amount: number; color?: string }> = ({
  amount,
  color = '#FFFFFF',
}) =>
  amount <= 0.001 ? null : (
    <AbsoluteFill
      style={{
        background: color,
        opacity: amount,
        mixBlendMode: 'screen',
        pointerEvents: 'none',
      }}
    />
  )

/**
 * Filtres de séparation RVB. Trois couches teintées, décalées, fondues en
 * `screen` : l'aberration chromatique des objectifs rapides.
 */
export const ChromaDefs: React.FC = () => (
  <svg width={0} height={0} style={{ position: 'absolute' }} aria-hidden>
    <defs>
      <filter id="keepR" colorInterpolationFilters="sRGB">
        <feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
      </filter>
      <filter id="keepG" colorInterpolationFilters="sRGB">
        <feColorMatrix type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" />
      </filter>
      <filter id="keepB" colorInterpolationFilters="sRGB">
        <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" />
      </filter>
    </defs>
  </svg>
)

export const Chroma: React.FC<{
  amount: number
  children: React.ReactNode
  /** Pour un contenu déjà en plein cadre, dont les enfants sont absolus. */
  fill?: boolean
}> = ({ amount, children, fill = false }) => {
  // En dessous du seuil, on rend une seule fois : les trois couches coûtent
  // trois rendus, et sur un plan complet ça se paie.
  if (amount < 0.25) return <>{children}</>
  const layer = (id: string, dx: number): React.CSSProperties => ({
    position: 'absolute',
    inset: 0,
    filter: `url(#${id})`,
    mixBlendMode: 'screen',
    transform: `translateX(${dx}px)`,
  })
  return (
    <div style={fill ? { position: 'absolute', inset: 0 } : { position: 'relative' }}>
      {/* Un contenu en plein cadre porte déjà sa taille ; un contenu en ligne
          a besoin d'une copie invisible pour la donner au conteneur. */}
      {fill ? null : <div style={{ opacity: 0 }}>{children}</div>}
      <div style={layer('keepR', -amount)}>{children}</div>
      <div style={layer('keepG', 0)}>{children}</div>
      <div style={layer('keepB', amount)}>{children}</div>
    </div>
  )
}

/**
 * Déchirure numérique : quelques bandes horizontales décalées, violet et
 * cyan. Deux ou trois frames à chaque coupe, pas plus — au-delà ça n'est
 * plus un accident de signal, c'est un effet.
 */
export const Glitch: React.FC<{ amount: number; seed: number }> = ({ amount, seed }) => {
  if (amount <= 0.01) return null
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
      {new Array(7).fill(0).map((_, i) => {
        const y = random(`gy-${seed}-${i}`) * 100
        const h = 6 + random(`gh-${seed}-${i}`) * 52
        const dx = (random(`gd-${seed}-${i}`) - 0.5) * 260 * amount
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${y}%`,
              height: h,
              background: i % 3 === 0 ? C.cyan : C.primary,
              opacity: 0.1 + random(`go-${seed}-${i}`) * 0.3 * amount,
              mixBlendMode: 'screen',
              transform: `translateX(${dx}px)`,
            }}
          />
        )
      })}
    </AbsoluteFill>
  )
}

/** Barres verticales qui balaient le cadre — la coupe du plan « prix ». */
export const ShutterWipe: React.FC<{ progress: number; columns?: number }> = ({
  progress,
  columns = 7,
}) => {
  if (progress >= 1) return null
  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'row' }}>
      {new Array(columns).fill(0).map((_, i) => {
        const stagger = (i / columns) * 0.35
        const local = Math.min(1, Math.max(0, (progress - stagger) / (1 - stagger)))
        return (
          <div
            key={i}
            style={{
              flex: 1,
              background: i % 2 === 0 ? C.bgDeep : C.card,
              transform: `translateY(${local * -100}%)`,
            }}
          />
        )
      })}
    </AbsoluteFill>
  )
}
