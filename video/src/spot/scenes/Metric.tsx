import React from 'react'
import { AbsoluteFill, Img, useCurrentFrame } from 'remotion'
import { C } from '../../theme'
import { DISPLAY, SANS } from '../../fonts'
import { EASE, lerp, pop, shake } from '../../components/anim'
import { Backdrop, Flash } from '../Backdrop'
import { shotFile } from '../Screen'
import { money } from '../../theme'
import { COPY } from '../timeline'
import { useStage } from '../stage'

/**
 * 4. Le chiffre qui prouve.
 *
 * 15 500 F descend a 13 000 F. Les trois nombres sont ceux du panier
 * capture (`d-total`) : sous-total 15 500 F, remise pack -2 500 F, a payer
 * 13 000 F. La capture est posee a cote du compteur — le chiffre annonce est
 * verifiable a l'image.
 *
 * Le compteur descend au lieu de monter : c'est un prix, et un prix qui
 * tombe se lit tout seul.
 */
const COUNT_FROM = 4
const COUNT_TO = 40
const LAND = 42

export const Metric: React.FC = () => {
  const frame = useCurrentFrame()
  const stage = useStage()
  const { u, wide, tall } = stage
  const m = COPY.metric

  // Le decompte : rapide d'abord, puis il se traine sur les dernieres
  // centaines — c'est ce ralentissement qui fait le suspense.
  const p = lerp(frame, [COUNT_FROM, COUNT_TO], [0, 1], EASE.out)
  const raw = m.from + (m.to - m.from) * p
  const value = Math.round(raw / 100) * 100

  const land = pop(frame, { delay: LAND, damping: 11, stiffness: 200 })
  const landed = frame >= LAND
  const s = shake(frame, LAND, 16, 9)

  const size = Math.min(260 * u, (stage.width - stage.pad * 2) / (7 * 0.46))

  const proofIn = pop(frame, { delay: 56, damping: 18, stiffness: 140 })
  const unitIn = pop(frame, { delay: 66, damping: 18, stiffness: 140 })
  const out = lerp(frame, [82, 90], [0, 1], EASE.in)

  return (
    <AbsoluteFill>
      <Backdrop frame={frame} energy={lerp(frame, [0, LAND], [0.5, 1])} />
      <Flash frame={frame} at={0} peak={0.55} len={8} />
      <Flash frame={frame} at={LAND} peak={0.35} len={7} />

      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: stage.safeTop,
          paddingBottom: stage.safeBottom,
          transform: `translate(${s.x}px, ${s.y}px) scale(${1 - out * 0.06})`,
          opacity: 1 - out,
        }}
      >
        <span
          style={{
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: 24 * u,
            letterSpacing: 3 * u,
            textTransform: 'uppercase',
            color: C.muted,
            opacity: lerp(frame, [0, 8], [0, 1], EASE.out),
          }}
        >
          {m.label}
        </span>

        {/* Le montant. Tabulaire : sans ca, chaque chiffre qui change fait
            bouger toute la ligne pendant le decompte. */}
        <div
          style={{
            position: 'relative',
            marginTop: 6 * u,
            transform: `scale(${landed ? 1 + land * 0.06 : 1})`,
          }}
        >
          <span
            style={{
              fontFamily: DISPLAY,
              fontSize: size,
              lineHeight: 0.86,
              color: landed ? C.primary : C.fg,
              fontVariantNumeric: 'tabular-nums',
              textShadow: landed ? `0 0 ${60 * u}px ${C.primary}66` : undefined,
            }}
          >
            {money(value)}
          </span>
        </div>

        {/* La remise, en pastille, posee en travers. */}
        <div
          style={{
            marginTop: 14 * u,
            display: 'flex',
            alignItems: 'center',
            gap: 12 * u,
            opacity: proofIn,
            transform: `translateY(${(1 - proofIn) * 20 * u}px)`,
          }}
        >
          <span
            style={{
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: 22 * u,
              color: C.bgDeep,
              background: C.primary,
              borderRadius: 999,
              padding: `${8 * u}px ${18 * u}px`,
            }}
          >
            remise pack − 2 500 F
          </span>
          <span
            style={{
              fontFamily: SANS,
              fontSize: 22 * u,
              color: C.muted,
              textDecoration: 'line-through',
            }}
          >
            {money(m.from)}
          </span>
        </div>

        <span
          style={{
            marginTop: 16 * u,
            fontFamily: DISPLAY,
            fontSize: 54 * u,
            lineHeight: 1,
            color: C.fg,
            opacity: unitIn,
            transform: `translateY(${(1 - unitIn) * 16 * u}px)`,
          }}
        >
          {m.unit}
        </span>
        <span
          style={{
            marginTop: 4 * u,
            fontFamily: SANS,
            fontSize: 19 * u,
            color: C.muted,
            opacity: unitIn,
          }}
        >
          {m.note}
        </span>
      </AbsoluteFill>

      {/* La preuve : le bloc de total du vrai panier. En 16:9 il tient dans
          le coin ; en vertical il n'y a pas la place, et le chiffre se
          suffit. */}
      {wide || !tall ? (
        <div
          style={{
            position: 'absolute',
            right: stage.pad,
            bottom: stage.safeBottom,
            width: Math.min(380 * u, stage.width * 0.3),
            opacity: proofIn * 0.95 * (1 - out),
            transform: `translateY(${(1 - proofIn) * 24 * u}px) rotate(-1.2deg)`,
            borderRadius: 10,
            overflow: 'hidden',
            border: `1px solid ${C.border}`,
            boxShadow: '0 20px 50px rgba(0,0,0,.55)',
          }}
        >
          <Img src={shotFile('d-total')} style={{ width: '100%', display: 'block' }} />
        </div>
      ) : null}
    </AbsoluteFill>
  )
}
