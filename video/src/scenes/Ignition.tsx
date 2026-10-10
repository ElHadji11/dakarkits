import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { EASE, lerp, shake } from '../components/anim'
import { Monogram } from '../components/Monogram'
import { Safe } from '../components/Safe'
import { Sheen } from '../components/Type'
import { DISPLAY, SANS } from '../fonts'
import { C } from '../theme'

/**
 * Plan 1 — l'accroche.
 *
 * Pas d'ouverture : à la frame 0 la marque et la promesse sont déjà à
 * l'écran, pleines et lisibles. Sur un fil TikTok, une première image vide
 * est une image perdue — le pouce est déjà parti.
 *
 * Le mouvement est donc un appui, pas une apparition : l'ensemble se pose
 * depuis un très léger sur-cadre, le monogramme pulse, un reflet traverse.
 * Aucun éclat d'ouverture non plus — plein cadre, il délavait la première
 * image en gris, ce qu'il était censé masquer.
 */
export const Ignition: React.FC = () => {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()

  // Décroissance d'un sur-cadre, jamais d'une opacité : rien n'est invisible
  // à la frame 0.
  const settle = lerp(frame, [0, 18], [1.07, 1], EASE.out)
  const sheen = lerp(frame, [6, 30], [0, 1])
  const kick = shake(frame, 0, 20, 7)

  const out = lerp(frame, [durationInFrames - 11, durationInFrames], [0, 1], EASE.in)

  return (
    <AbsoluteFill
      style={{
        transform: `translate(${kick.x}px, ${kick.y}px) scale(${settle * (1 + out * 0.2)})`,
        filter: out > 0 ? `blur(${out * 15}px)` : undefined,
        opacity: 1 - out,
      }}
    >
      <Safe>
        <Monogram
          width={430}
          color={C.fg}
          glow={lerp(frame, [0, 14, 34], [26, 52, 30])}
          style={{ marginBottom: 46 }}
        />

        <Sheen progress={sheen}>
          <div
            style={{
              fontFamily: DISPLAY,
              fontSize: 168,
              lineHeight: 0.92,
              color: C.fg,
              letterSpacing: -2,
            }}
          >
            DAKARKITS
          </div>
        </Sheen>

        {/* La promesse, dans la foulée du nom. */}
        <div
          style={{
            marginTop: 40,
            padding: '16px 52px',
            borderRadius: 999,
            background: `${C.primary}22`,
            border: `2px solid ${C.primary}`,
            boxShadow: `0 0 ${lerp(frame, [0, 20, 40], [30, 70, 40])}px ${C.primary}55`,
            transform: `scale(${lerp(frame, [2, 12], [1, 1.04], EASE.back)})`,
          }}
        >
          <div
            style={{
              fontFamily: DISPLAY,
              fontSize: 118,
              lineHeight: 1,
              color: C.primary,
              letterSpacing: 1,
            }}
          >
            +20 MAILLOTS
          </div>
        </div>

        <div
          style={{
            marginTop: 34,
            fontFamily: SANS,
            fontWeight: 500,
            fontSize: 34,
            color: C.muted,
            textTransform: 'uppercase',
            letterSpacing: 10,
            // La chasse de fin de mot décentre la ligne si on ne la rattrape pas.
            transform: 'translateX(5px)',
          }}
        >
          Dakar · Sénégal
        </div>
      </Safe>
    </AbsoluteFill>
  )
}
