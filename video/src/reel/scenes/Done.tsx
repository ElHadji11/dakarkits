import React, { useMemo } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { EASE, lerp, pop, random } from '../../components/anim'
import { Sheen } from '../../components/Type'
import { DISPLAY, SANS } from '../../fonts'
import { C, SAFE } from '../../theme'
import { COPY } from '../timeline'

/**
 * Plan 5 — c'est commande.
 *
 * **Aucun montant ici.** Le plan precedent ne montre pas le recapitulatif, et
 * inventer un total pour le carton serait inventer tout court. Le prix a ete
 * dit trois fois dans la parade, sur les maillots ; ce plan-ci repond a la
 * seule question qui reste a ce moment du film — « et maintenant, je paie
 * comment ? ».
 *
 * La reponse est la phrase la plus vendeuse de la boutique, et c'est la
 * sienne, pas la notre : rien a payer maintenant, tout a la livraison.
 */

/** Gerbe de points a la fermeture de l'anneau. Semee une fois. */
const Burst: React.FC<{ progress: number }> = ({ progress }) => {
  const dots = useMemo(
    () =>
      new Array(30).fill(0).map((_, i) => ({
        i,
        angle: (i / 30) * Math.PI * 2 + random(`da-${i}`),
        dist: 150 + random(`dd-${i}`) * 300,
        size: 4 + random(`ds-${i}`) * 9,
        hue: random(`dh-${i}`) > 0.68 ? C.cyan : C.primary,
      })),
    [],
  )
  if (progress <= 0 || progress >= 1) return null
  return (
    <>
      {dots.map((d) => {
        const r = d.dist * progress
        return (
          <div
            key={d.i}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: d.size,
              height: d.size,
              borderRadius: '50%',
              background: d.hue,
              boxShadow: `0 0 14px ${d.hue}`,
              opacity: 1 - progress,
              transform: `translate(${Math.cos(d.angle) * r}px, ${Math.sin(d.angle) * r}px)`,
            }}
          />
        )
      })}
    </>
  )
}

/**
 * L'anneau et la coche s'ecrivent, ils n'apparaissent pas.
 *
 * `pathLength={1}` normalise les deux traces : l'anneau et la coche n'ont pas
 * du tout la meme longueur reelle, et sans ca le meme `strokeDashoffset`
 * dessinerait l'un trois fois plus vite que l'autre.
 */
const Check: React.FC<{ frame: number }> = ({ frame }) => {
  const ring = lerp(frame, [2, 22], [0, 1], EASE.out)
  const tick = lerp(frame, [16, 30], [0, 1], EASE.out)
  const punch = pop(frame, { delay: 20, damping: 9, stiffness: 200 })
  return (
    <div
      style={{
        position: 'relative',
        width: 230,
        height: 230,
        transform: `scale(${lerp(punch, [0, 1], [0.86, 1])})`,
      }}
    >
      <Burst progress={lerp(frame, [20, 48], [0, 1], EASE.out)} />
      <div
        style={{
          position: 'absolute',
          inset: '-32%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${C.primary}44 0%, transparent 66%)`,
          filter: 'blur(28px)',
          opacity: lerp(frame, [12, 30], [0, 1]),
        }}
      />
      <svg viewBox="0 0 100 100" width={230} height={230} style={{ position: 'relative' }}>
        <circle
          cx={50}
          cy={50}
          r={42}
          pathLength={1}
          fill="none"
          stroke={C.primary}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={1}
          strokeDashoffset={1 - ring}
          transform="rotate(-90 50 50)"
          style={{ filter: `drop-shadow(0 0 12px ${C.primary})` }}
        />
        <path
          d="M30 51 L44 65 L71 36"
          pathLength={1}
          fill="none"
          stroke={C.fg}
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={1}
          strokeDashoffset={1 - tick}
        />
      </svg>
    </div>
  )
}

export const Done: React.FC = () => {
  const frame = useCurrentFrame()
  const badge = pop(frame, { delay: 40, damping: 12, stiffness: 150 })

  return (
    <AbsoluteFill style={{ background: C.bgDeep }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(104% 56% at 50% 38%, ${C.card} 0%, ${C.bg} 44%, ${C.bgDeep} 84%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(58% 34% at 50% 36%, ${C.primaryDeep}4A 0%, transparent 72%)`,
          opacity: lerp(frame, [0, 16], [0.3, 1]),
        }}
      />

      <AbsoluteFill
        style={{
          paddingTop: SAFE.top,
          paddingBottom: SAFE.bottom,
          paddingLeft: 60,
          paddingRight: 60,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Check frame={frame} />

        <Sheen progress={lerp(frame, [30, 58], [0, 1])}>
          <div
            style={{
              fontFamily: DISPLAY,
              fontSize: 156,
              lineHeight: 0.92,
              color: C.fg,
              letterSpacing: -1,
              marginTop: 40,
              textAlign: 'center',
              opacity: lerp(frame, [24, 34], [0, 1]),
              transform: `translateY(${lerp(frame, [24, 38], [34, 0], EASE.out)}px)`,
            }}
          >
            C’EST COMMANDÉ
          </div>
        </Sheen>

        {/* La phrase qui leve la derniere objection, et c'est celle du site. */}
        <div
          style={{
            marginTop: 40,
            padding: '20px 52px',
            borderRadius: 999,
            background: `${C.primary}1F`,
            border: `3px solid ${C.primary}`,
            boxShadow: `0 0 ${lerp(frame, [40, 64], [20, 64])}px ${C.primary}55`,
            transform: `scale(${lerp(badge, [0, 1], [0.8, 1])})`,
            opacity: lerp(badge, [0, 0.35], [0, 1]),
          }}
        >
          <div
            style={{
              fontFamily: DISPLAY,
              fontSize: 96,
              lineHeight: 1,
              color: C.primary,
              letterSpacing: 1,
            }}
          >
            {COPY.done.now.toUpperCase()}
          </div>
        </div>

        <div
          style={{
            fontFamily: SANS,
            fontWeight: 500,
            fontSize: 36,
            lineHeight: 1.45,
            color: C.fg,
            textAlign: 'center',
            maxWidth: 860,
            marginTop: 34,
            opacity: lerp(frame, [52, 64], [0, 1]),
            transform: `translateY(${lerp(frame, [52, 66], [22, 0], EASE.out)}px)`,
          }}
        >
          {COPY.done.terms}
        </div>

        <div
          style={{
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: 30,
            color: C.cyan,
            textTransform: 'uppercase',
            letterSpacing: 5,
            marginTop: 18,
            // La chasse de fin de mot decentre la ligne si on ne la rattrape pas.
            transform: `translateX(2.5px)`,
            opacity: lerp(frame, [60, 72], [0, 1]),
          }}
        >
          {COPY.done.delay}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
