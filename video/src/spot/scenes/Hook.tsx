import React from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { C } from '../../theme'
import { SANS } from '../../fonts'
import { EASE, lerp, shake } from '../../components/anim'
import { Backdrop } from '../Backdrop'
import { Slam, Strike } from '../Type'
import { fitText, useStage } from '../stage'
import { BEAT, COPY } from '../timeline'

/**
 * 1. L'accroche — le probleme en cinq mots.
 *
 * « UN MAILLOT NEUF » tombe mot par mot, un par temps. « TROP CHER » frappe
 * a la sixieme croche et se fait barrer : le film repond a l'objection avant
 * d'avoir montre le produit.
 *
 * Les mots ne glissent pas, ils tombent — et la camera encaisse chaque
 * frappe. Sans la secousse, cinq mots qui apparaissent restent cinq mots qui
 * apparaissent.
 */
export const Hook: React.FC = () => {
  const frame = useCurrentFrame()
  const stage = useStage()
  const { u, width } = stage

  const head = COPY.hook.slice(0, COPY.hookSplit) // UN MAILLOT NEUF
  const punch = COPY.hook.slice(COPY.hookSplit) // TROP CHER

  const headText = head.join(' ')
  const punchText = punch.join(' ')

  // Les deux lignes partagent une echelle : la plus longue decide, la
  // seconde la depasse d'un tiers — c'est elle qui porte le coup.
  const avail = width - stage.pad * 2
  const headSize = fitText(headText, avail, 0.46, 300 * u)
  const punchSize = Math.min(fitText(punchText, avail, 0.46), headSize * 1.42)

  const PUNCH_AT = BEAT * 3 // frame 45
  const STRIKE_AT = BEAT * 4 + 6 // frame 66

  // La camera encaisse chaque mot, puis le coup de la quatrieme frappe.
  const hits = [0, BEAT, BEAT * 2, PUNCH_AT]
  const s = hits.reduce(
    (acc, at, i) => {
      const k = shake(frame, at, i === 3 ? 30 : 12, i === 3 ? 13 : 7)
      return { x: acc.x + k.x, y: acc.y + k.y, r: acc.r + k.r }
    },
    { x: 0, y: 0, r: 0 },
  )

  // Sortie : tout se compresse vers le haut et s'efface pour la coupe.
  const out = lerp(frame, [78, 90], [0, 1], EASE.in)

  return (
    <AbsoluteFill>
      <Backdrop frame={frame} energy={lerp(frame, [0, 45, 90], [0.25, 0.5, 1])} />

      {/* La griffe, en tout petit : on sait tout de suite qui parle. */}
      <div
        style={{
          position: 'absolute',
          left: stage.pad,
          top: stage.safeTop,
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 17 * u,
          letterSpacing: 3 * u,
          color: C.muted,
          opacity: lerp(frame, [4, 16], [0, 1], EASE.out) * (1 - out),
        }}
      >
        DAKAR
      </div>

      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: stage.safeTop,
          paddingBottom: stage.safeBottom,
          transform: `translate(${s.x}px, ${s.y - out * 90 * u}px) rotate(${s.r}deg) scale(${1 - out * 0.08})`,
          opacity: 1 - out,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Ligne 1 : un mot par temps. */}
          <div
            style={{
              display: 'flex',
              gap: headSize * 0.17,
              alignItems: 'baseline',
              justifyContent: 'center',
              flexWrap: 'nowrap',
            }}
          >
            {head.map((word, i) => (
              <Slam key={word} frame={frame} at={i * BEAT} size={headSize}>
                {word}
              </Slam>
            ))}
          </div>

          {/* Ligne 2 : le coup, puis le trait qui le barre. */}
          <div style={{ position: 'relative', marginTop: headSize * 0.1 }}>
            <div
              style={{
                display: 'flex',
                gap: punchSize * 0.17,
                alignItems: 'baseline',
              }}
            >
              {punch.map((word, i) => (
                <Slam
                  key={word}
                  frame={frame}
                  at={PUNCH_AT + i * 3}
                  size={punchSize}
                  color={C.pink}
                  rotate={i === 0 ? -1.5 : 1.2}
                >
                  {word}
                </Slam>
              ))}
            </div>
            <Strike
              frame={frame}
              at={STRIKE_AT}
              width={punchText.length * punchSize * 0.46 * 1.06}
              thickness={punchSize * 0.07}
              color={C.primary}
              style={{
                left: -punchSize * 0.03,
                top: '46%',
                transform: 'rotate(-1.4deg)',
              }}
            />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
