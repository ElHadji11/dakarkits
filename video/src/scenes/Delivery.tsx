import React, { useMemo } from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { EASE, lerp, pop, random } from '../components/anim'
import { Chroma } from '../components/Overlays'
import { Safe } from '../components/Safe'
import { Eyebrow } from '../components/Type'
import { DISPLAY, SANS } from '../fonts'
import { C } from '../theme'

/** Traînées horizontales : la vitesse, suggérée plutôt que dessinée. */
const Streaks: React.FC<{ frame: number }> = ({ frame }) => {
  const lines = useMemo(
    () =>
      new Array(26).fill(0).map((_, i) => ({
        i,
        y: random(`sy-${i}`) * 100,
        len: 120 + random(`sl-${i}`) * 560,
        speed: 40 + random(`sv-${i}`) * 86,
        thickness: random(`st-${i}`) > 0.82 ? 3 : 1,
        hue: random(`sh-${i}`) > 0.75 ? C.cyan : C.primary,
      })),
    [],
  )
  return (
    <AbsoluteFill>
      {lines.map((l) => {
        const x = 1400 - ((frame * l.speed + random(`so-${l.i}`) * 2200) % 2600)
        return (
          <div
            key={l.i}
            style={{
              position: 'absolute',
              top: `${l.y}%`,
              left: x,
              width: l.len,
              height: l.thickness,
              background: `linear-gradient(90deg, transparent, ${l.hue})`,
              opacity: 0.4,
            }}
          />
        )
      })}
    </AbsoluteFill>
  )
}

/** Ondes concentriques : Dakar, et la livraison qui s'en échappe. */
const Ripples: React.FC<{ frame: number }> = ({ frame }) => (
  <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
    {[0, 1, 2].map((i) => {
      const t = ((frame + i * 16) % 48) / 48
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: 200 + t * 1400,
            height: 200 + t * 1400,
            borderRadius: '50%',
            border: `2px solid ${C.primary}`,
            opacity: (1 - t) * 0.26,
          }}
        />
      )
    })}
  </AbsoluteFill>
)

/**
 * Plan 5 — la livraison. Le plan le plus court et le plus rapide : le titre
 * arrive de la gauche en aberration chromatique, puis se stabilise net.
 *
 * « LIVRAISON GRATUITE » tient sur deux lignes : en 1080 de large, une seule
 * ligne tomberait à une taille qui ne pèse plus rien.
 */
export const Delivery: React.FC = () => {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()

  const slam = pop(frame, { delay: 1, damping: 15, stiffness: 180 })
  const slamTwo = pop(frame, { delay: 5, damping: 15, stiffness: 180 })
  const exit = lerp(frame, [durationInFrames - 9, durationInFrames], [0, 1], EASE.in)

  return (
    <AbsoluteFill style={{ opacity: lerp(frame, [0, 4], [0, 1]) * (1 - exit) }}>
      <Ripples frame={frame} />
      <Streaks frame={frame} />

      <Safe>
        <div style={{ textAlign: 'center', transform: `scale(${1 + exit * 0.1})` }}>
          <Eyebrow
            text="Offre de lancement"
            frame={frame}
            delay={0}
            size={30}
            color={C.cyan}
            align="center"
          />
          <div style={{ marginTop: 22 }}>
            <Chroma amount={lerp(slam, [0, 1], [20, 0])}>
              <div
                style={{
                  fontFamily: DISPLAY,
                  fontSize: 205,
                  lineHeight: 0.9,
                  color: C.fg,
                  letterSpacing: -1,
                  transform: `translateX(${(1 - slam) * -620}px)`,
                  textShadow: `0 0 90px ${C.primary}44`,
                }}
              >
                LIVRAISON
              </div>
            </Chroma>
            <Chroma amount={lerp(slamTwo, [0, 1], [20, 0])}>
              <div
                style={{
                  fontFamily: DISPLAY,
                  fontSize: 205,
                  lineHeight: 0.9,
                  color: C.primary,
                  letterSpacing: -1,
                  transform: `translateX(${(1 - slamTwo) * 620}px)`,
                  textShadow: `0 0 90px ${C.primary}55`,
                }}
              >
                GRATUITE
              </div>
            </Chroma>
          </div>
          <div
            style={{
              fontFamily: SANS,
              fontSize: 36,
              lineHeight: 1.4,
              color: C.fg,
              marginTop: 40,
              maxWidth: 880,
              opacity: lerp(frame, [14, 26], [0, 1]),
              transform: `translateY(${lerp(frame, [14, 26], [22, 0], EASE.out)}px)`,
            }}
          >
            Partout à Dakar · Tu paies à la livraison par Wave
          </div>
        </div>
      </Safe>
    </AbsoluteFill>
  )
}
