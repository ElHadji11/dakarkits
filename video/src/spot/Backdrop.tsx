import React from 'react'
import { AbsoluteFill } from 'remotion'
import { noise2D } from '@remotion/noise'
import { C } from '../theme'
import { lerp } from '../components/anim'
import { useStage } from './stage'

/**
 * Le fond. Les couleurs de Cosmic Night en sombre, et rien d'autre : pas une
 * teinte qui ne soit pas dans le theme du site.
 *
 * Le grain n'est pas decoratif. Un degrade sombre sur un fond aussi sombre
 * se decoupe en bandes des que l'encodeur travaille en 8 bits ; un grain
 * tres fin casse les paliers. Il est fixe, pas anime : un grain qui bouge
 * coute des centaines de kilo-octets par seconde au debit.
 */
const GRAIN =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140">
       <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3"/>
       <feColorMatrix type="saturate" values="0"/></filter>
       <rect width="140" height="140" filter="url(#n)" opacity="0.5"/>
     </svg>`,
  )

export const Backdrop: React.FC<{
  frame: number
  /** 0 = presque noir, 1 = la nebuleuse violette au maximum. */
  energy?: number
  /** Deplace le halo, pour suivre le sujet du plan. */
  focus?: { x: number; y: number }
}> = ({ frame, energy = 1, focus }) => {
  const stage = useStage()
  // Le halo derive lentement : deux bruits coherents, jamais un aleatoire par
  // frame, sinon le fond scintille.
  const dx = noise2D('halo-x', frame * 0.004, 0) * 8
  const dy = noise2D('halo-y', frame * 0.004, 9) * 6
  const fx = (focus?.x ?? 50) + dx
  const fy = (focus?.y ?? 42) + dy

  return (
    <AbsoluteFill style={{ background: C.bgDeep }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(${118 * (0.8 + energy * 0.4)}% ${100}% at ${fx}% ${fy}%, ${C.card} 0%, ${C.bg} 38%, ${C.bgDeep} 78%)`,
          opacity: lerp(energy, [0, 1], [0.55, 1]),
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 55% at ${fx}% ${fy}%, ${C.primaryDeep}44 0%, transparent 70%)`,
          opacity: energy,
        }}
      />
      {/* Vignette : ramene l'oeil au centre, et masque les coins ou le
          degrade est le plus plat. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(85% 80% at 50% 50%, transparent 40%, ${C.bgDeep}cc 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `url("${GRAIN}")`,
          backgroundSize: `${140 * (stage.width / 1920)}px`,
          opacity: 0.045,
          mixBlendMode: 'overlay',
        }}
      />
    </AbsoluteFill>
  )
}

/**
 * Eclat blanc qui masque une coupe. Deux frames de montee, six de descente :
 * plus long, il se voit comme un effet ; plus court, il ne masque rien.
 */
export const Flash: React.FC<{ frame: number; at: number; peak?: number; len?: number }> = ({
  frame,
  at,
  peak = 0.8,
  len = 7,
}) => {
  const o = lerp(frame, [at - 1, at + 1, at + len], [0, peak, 0])
  if (o <= 0.001) return null
  return <AbsoluteFill style={{ background: C.fg, opacity: o, mixBlendMode: 'screen' }} />
}

/**
 * Les barres qui balaient l'image a chaque coupe. Trois bandes decalees :
 * une seule ferait un rideau, trois font un mouvement.
 */
export const Wipe: React.FC<{ frame: number; at: number; len?: number; color?: string }> = ({
  frame,
  at,
  len = 14,
  color = C.primary,
}) => {
  const stage = useStage()
  const t = frame - at
  if (t < 0 || t > len + 10) return null
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      {[0, 1, 2].map((i) => {
        const p = lerp(t, [i * 2, len + i * 2], [0, 1])
        const x = lerp(p, [0, 1], [-1.2, 1.2]) * stage.width
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: -stage.height * 0.2,
              width: stage.width * 0.5,
              height: stage.height * 1.4,
              background: i === 1 ? C.fg : color,
              opacity: i === 1 ? 0.9 : 0.55,
              transform: 'skewX(-12deg)',
            }}
          />
        )
      })}
    </AbsoluteFill>
  )
}
