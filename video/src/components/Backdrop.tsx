import React, { useMemo } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { C } from '../theme'
import { drift, lerp, noise2D, random } from './anim'

/** Trois halos qui dérivent lentement : le fond n'est jamais plat. */
const Nebula: React.FC = () => {
  const frame = useCurrentFrame()
  const blobs = [
    { seed: 1, x: 28, y: 34, size: 1500, color: C.primaryDeep, alpha: 0.3 },
    { seed: 2, x: 74, y: 66, size: 1250, color: C.primary, alpha: 0.16 },
    { seed: 3, x: 52, y: 12, size: 900, color: C.cyan, alpha: 0.08 },
  ]
  return (
    <AbsoluteFill>
      {blobs.map((b) => (
        <div
          key={b.seed}
          style={{
            position: 'absolute',
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: b.size,
            height: b.size,
            marginLeft: -b.size / 2,
            marginTop: -b.size / 2,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${b.color} 0%, transparent 62%)`,
            opacity: b.alpha,
            transform: `translate(${drift(b.seed, frame, 90, 0.012)}px, ${drift(
              b.seed + 9,
              frame,
              60,
              0.01,
            )}px)`,
            filter: 'blur(40px)',
          }}
        />
      ))}
    </AbsoluteFill>
  )
}

/** Sol en perspective, défilant vers la caméra. Donne une profondeur au cadre. */
const Floor: React.FC<{ speed?: number }> = ({ speed = 26 }) => {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill style={{ perspective: 620, perspectiveOrigin: '50% 0%' }}>
      <div
        style={{
          position: 'absolute',
          left: '-70%',
          width: '240%',
          top: '54%',
          height: '140%',
          transform: 'rotateX(76deg)',
          transformOrigin: 'top center',
          backgroundImage: `linear-gradient(${C.primary}22 1px, transparent 1px), linear-gradient(90deg, ${C.primary}22 1px, transparent 1px)`,
          backgroundSize: '120px 120px',
          backgroundPosition: `0px ${(frame * speed) % 120}px`,
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 58%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 58%)',
        }}
      />
    </AbsoluteFill>
  )
}

/** Poussière lumineuse. Semée une fois, animée au bruit — zéro `Math.random`. */
const Dust: React.FC<{ count?: number }> = ({ count = 70 }) => {
  const frame = useCurrentFrame()
  const seeds = useMemo(
    () =>
      new Array(count).fill(0).map((_, i) => ({
        i,
        x: random(`dx-${i}`) * 100,
        y: random(`dy-${i}`) * 100,
        s: 1.5 + random(`ds-${i}`) * 3.5,
        speed: 0.25 + random(`dv-${i}`) * 0.5,
        hue: random(`dh-${i}`) > 0.78 ? C.cyan : C.primary,
      })),
    [count],
  )
  return (
    <AbsoluteFill>
      {seeds.map((p) => {
        const twinkle = 0.18 + (noise2D(`tw-${p.i}`, frame * 0.05, p.i) + 1) * 0.3
        return (
          <div
            key={p.i}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.s,
              height: p.s,
              borderRadius: '50%',
              background: p.hue,
              opacity: twinkle,
              boxShadow: `0 0 ${p.s * 4}px ${p.hue}`,
              transform: `translate(${drift(p.i, frame, 26, 0.013)}px, ${-(
                (frame * p.speed) %
                1200
              )}px)`,
            }}
          />
        )
      })}
    </AbsoluteFill>
  )
}

/**
 * Le fond, d'un bout à l'autre du film. Il ne coupe jamais : c'est lui qui
 * tient les six plans ensemble.
 */
export const Backdrop: React.FC<{ floor?: boolean; dust?: boolean }> = ({
  floor = true,
  dust = true,
}) => {
  const frame = useCurrentFrame()
  // Respiration très lente : aucune frame n'est tout à fait identique.
  const breathe = lerp(Math.sin(frame * 0.02), [-1, 1], [1, 1.06])
  return (
    <AbsoluteFill style={{ backgroundColor: C.bgDeep, overflow: 'hidden' }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 42%, ${C.bg} 0%, ${C.bgDeep} 72%)`,
        }}
      />
      <AbsoluteFill style={{ transform: `scale(${breathe})` }}>
        <Nebula />
      </AbsoluteFill>
      {floor ? <Floor /> : null}
      {dust ? <Dust /> : null}
    </AbsoluteFill>
  )
}
