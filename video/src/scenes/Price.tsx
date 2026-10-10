import React, { useMemo } from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { EASE, lerp, pop, random, shake } from '../components/anim'
import { Odometer } from '../components/Odometer'
import { Safe } from '../components/Safe'
import { Eyebrow, Sheen } from '../components/Type'
import { DISPLAY, SANS } from '../fonts'
import { C } from '../theme'

/** Gerbe de points à l'apparition de la pastille. Semée une fois. */
const Burst: React.FC<{ progress: number }> = ({ progress }) => {
  const dots = useMemo(
    () =>
      new Array(26).fill(0).map((_, i) => ({
        i,
        angle: (i / 26) * Math.PI * 2 + random(`ba-${i}`),
        dist: 90 + random(`bd-${i}`) * 230,
        size: 3 + random(`bs-${i}`) * 7,
        hue: random(`bh-${i}`) > 0.7 ? C.cyan : C.primary,
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
              boxShadow: `0 0 12px ${d.hue}`,
              opacity: 1 - progress,
              transform: `translate(${Math.cos(d.angle) * r}px, ${Math.sin(d.angle) * r}px)`,
            }}
          />
        )
      })}
    </>
  )
}

const CHIPS = ['Paiement à la livraison', 'Sans créer de compte', 'Pack 2 maillots : 13 000 F']

/**
 * Plan 3 — le prix.
 *
 * L'ancien prix et la remise se lisent d'abord, le montant tombe ensuite :
 * l'ordre compte, c'est l'écart qui fait l'offre. En francs CFA, entiers.
 */
export const Price: React.FC = () => {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()

  const strike = lerp(frame, [14, 28], [0, 1], EASE.out)
  const badge = pop(frame, { delay: 18, damping: 9, stiffness: 150 })
  const burst = lerp(frame, [18, 44], [0, 1], EASE.out)
  const sheen = lerp(frame, [40, 66], [0, 1])
  const kick = shake(frame, 19, 13, 6)

  const exit = lerp(frame, [durationInFrames - 12, durationInFrames], [0, 1], EASE.in)

  return (
    <AbsoluteFill
      style={{
        transform: `translate(${kick.x}px, ${kick.y}px) scale(${1 - exit * 0.13})`,
        opacity: lerp(frame, [0, 5], [0, 1]) * (1 - exit),
        filter: exit > 0 ? `blur(${exit * 12}px)` : undefined,
      }}
    >
      <Safe>
        <Eyebrow
          text="Promo de lancement"
          frame={frame}
          delay={1}
          size={32}
          color={C.primary}
          align="center"
        />

        {/* L'ancien prix et la remise, côte à côte, au-dessus du montant. */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 34,
            marginTop: 42,
            opacity: lerp(frame, [10, 20], [0, 1]),
          }}
        >
          <div style={{ position: 'relative', padding: '0 6px' }}>
            <span style={{ fontFamily: DISPLAY, fontSize: 92, color: C.muted, lineHeight: 1 }}>
              10 000 F
            </span>
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: '48%',
                height: 6,
                width: `${strike * 100}%`,
                background: C.pink,
                boxShadow: `0 0 18px ${C.pink}`,
              }}
            />
          </div>

          <div
            style={{
              position: 'relative',
              transform: `rotate(${lerp(badge, [0, 1], [-34, -8])}deg) scale(${badge})`,
            }}
          >
            <Burst progress={burst} />
            <div
              style={{
                background: C.primary,
                color: C.bg,
                fontFamily: SANS,
                fontWeight: 800,
                fontSize: 60,
                padding: '12px 30px',
                borderRadius: 999,
                boxShadow: `0 0 70px ${C.primary}77`,
              }}
            >
              -25 %
            </div>
          </div>
        </div>

        <div
          style={{
            fontFamily: SANS,
            fontWeight: 500,
            fontSize: 36,
            color: C.muted,
            marginTop: 30,
            opacity: lerp(frame, [24, 34], [0, 1]),
          }}
        >
          À partir de
        </div>

        <Sheen progress={sheen}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, marginTop: 22 }}>
            <Odometer
              value="7 500"
              frame={frame}
              delay={22}
              size={250}
              stagger={2}
              spins={2}
              color={C.fg}
            />
            <div
              style={{
                fontFamily: DISPLAY,
                fontSize: 104,
                color: C.primary,
                lineHeight: 1,
                paddingBottom: 26,
                opacity: lerp(frame, [38, 48], [0, 1]),
                transform: `translateX(${lerp(frame, [38, 48], [-30, 0], EASE.out)}px)`,
                textShadow: `0 0 50px ${C.primary}88`,
              }}
            >
              F CFA
            </div>
          </div>
        </Sheen>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 18,
            marginTop: 46,
          }}
        >
          {CHIPS.map((label, i) => {
            const p = pop(frame, { delay: 48 + i * 5, damping: 16 })
            return (
              <div
                key={label}
                style={{
                  fontFamily: SANS,
                  fontSize: 34,
                  color: C.fg,
                  background: `${C.card}E6`,
                  border: `1px solid ${C.border}`,
                  borderRadius: 999,
                  padding: '16px 38px',
                  opacity: lerp(p, [0, 0.4], [0, 1]),
                  transform: `translateY(${(1 - p) * 30}px)`,
                }}
              >
                {label}
              </div>
            )
          })}
        </div>
      </Safe>
    </AbsoluteFill>
  )
}
