import React from 'react'
import { AbsoluteFill, Img, useCurrentFrame } from 'remotion'
import { C } from '../../theme'
import { DISPLAY, SANS } from '../../fonts'
import { EASE, drift, lerp, pop } from '../../components/anim'
import { Backdrop, Flash } from '../Backdrop'
import { Monogram } from '../../components/Monogram'
import { shotFile } from '../Screen'
import { G } from '../geometry'
import { COPY } from '../timeline'
import { useStage } from '../stage'

/**
 * 5. Signature et appel a l'action.
 *
 * Le monogramme est le trace de `components/shop/logo.tsx`, pas une image :
 * c'est ce qui permet de le faire s'ecrire au trait avant de se remplir.
 *
 * Derriere, les huit cartes du catalogue derivent — les vraies, celles qui
 * viennent de se monter au deuxieme plan.
 */
const DRAW_AT = 2
const FILL_AT = 16
const WORD_AT = 22
const URL_AT = 38
const CTA_AT = 50

export const Lockup: React.FC = () => {
  const frame = useCurrentFrame()
  const stage = useStage()
  const { u, wide } = stage
  const l = COPY.lockup

  const draw = lerp(frame, [DRAW_AT, FILL_AT + 4], [0, 1], EASE.inOut)
  const fill = lerp(frame, [FILL_AT, FILL_AT + 10], [0, 1], EASE.out)
  const markIn = pop(frame, { delay: DRAW_AT, damping: 18, stiffness: 120 })
  const wordIn = pop(frame, { delay: WORD_AT, damping: 17, stiffness: 150 })
  const urlIn = pop(frame, { delay: URL_AT, damping: 16, stiffness: 160 })
  const ctaIn = pop(frame, { delay: CTA_AT, damping: 17, stiffness: 150 })

  // La derniere seconde respire : une image fixe pendant trente frames a
  // l'air d'un plantage.
  const breathe = 1 + Math.sin((frame - CTA_AT) / 26) * 0.006

  const markWidth = Math.min(300 * u, stage.width * 0.3)
  const wordSize = markWidth * 0.62

  return (
    <AbsoluteFill>
      <Backdrop frame={frame} energy={1} />
      <Flash frame={frame} at={0} peak={0.5} len={9} />

      {/* Le mur de maillots, tres en retrait : il donne le volume du
          catalogue sans voler la signature. */}
      <AbsoluteFill style={{ opacity: lerp(frame, [0, 24], [0, 0.26], EASE.out) }}>
        {G.home.cards.map((card, i) => {
          const col = i % 4
          const row = Math.floor(i / 4)
          const w = stage.width * (wide ? 0.19 : 0.3)
          const h = w * (card.h / card.w)
          const x = stage.width * (wide ? 0.06 : -0.02) + col * w * (wide ? 1.22 : 1.1)
          const y = stage.centerY - h * (row === 0 ? 1.15 : -0.15) + drift(i, frame, 16, 0.012)
          return (
            <Img
              key={card.href}
              src={shotFile(('p-card-' + (i + 1)) as never)}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: w,
                height: h,
                borderRadius: 10,
                transform: `rotate(${(i % 3) - 1}deg)`,
              }}
            />
          )
        })}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 50% at 50% 48%, ${C.bgDeep}f2 30%, ${C.bgDeep}aa 100%)`,
        }}
      />

      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: stage.safeTop,
          paddingBottom: stage.safeBottom,
          transform: `scale(${breathe})`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: markWidth * 0.13,
            transform: `scale(${0.86 + markIn * 0.14})`,
          }}
        >
          <Monogram
            width={markWidth}
            draw={draw}
            fill={fill}
            color={C.fg}
            glow={fill * 26 * u}
          />
          {/* Le mot-symbole se decouvre de la gauche, comme sur le site il
              suit le monogramme. */}
          <div style={{ overflow: 'hidden' }}>
            <span
              style={{
                display: 'block',
                fontFamily: DISPLAY,
                fontSize: wordSize,
                lineHeight: 0.9,
                letterSpacing: wordSize * 0.02,
                color: C.fg,
                transform: `translateX(${(1 - wordIn) * -100}%)`,
              }}
            >
              {l.mark}
            </span>
          </div>
        </div>

        <div
          style={{
            marginTop: 30 * u,
            position: 'relative',
            opacity: urlIn,
            transform: `translateY(${(1 - urlIn) * 18 * u}px)`,
          }}
        >
          <span
            style={{
              fontFamily: SANS,
              fontWeight: 800,
              fontSize: 60 * u,
              letterSpacing: -1 * u,
              color: C.primary,
            }}
          >
            {l.url}
          </span>
          <div
            style={{
              position: 'absolute',
              left: 0,
              bottom: -8 * u,
              height: 4 * u,
              width: `${lerp(frame, [URL_AT + 4, URL_AT + 16], [0, 100], EASE.out)}%`,
              background: C.primary,
              borderRadius: 4,
            }}
          />
        </div>

        <span
          style={{
            marginTop: 34 * u,
            fontFamily: DISPLAY,
            fontSize: 56 * u,
            lineHeight: 1,
            color: C.fg,
            opacity: ctaIn,
            transform: `translateY(${(1 - ctaIn) * 16 * u}px)`,
          }}
        >
          {l.cta}
        </span>
        <span
          style={{
            marginTop: 12 * u,
            fontFamily: SANS,
            fontWeight: 500,
            fontSize: 21 * u,
            color: C.muted,
            textAlign: 'center',
            opacity: lerp(frame, [CTA_AT + 8, CTA_AT + 18], [0, 1], EASE.out),
          }}
        >
          {l.terms}
        </span>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
