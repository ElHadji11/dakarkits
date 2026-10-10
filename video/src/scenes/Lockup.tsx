import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { EASE, lerp, pop } from '../components/anim'
import { Monogram } from '../components/Monogram'
import { Safe } from '../components/Safe'
import { Rule, Sheen } from '../components/Type'
import { DISPLAY, SANS } from '../fonts'
import { C } from '../theme'

/**
 * Plan 6 — la signature.
 *
 * Trois temps : la marque, l'adresse, l'appel. L'adresse est pleine et
 * lumineuse, jamais en demi-teinte — c'est la seule chose que le spectateur
 * doit pouvoir retaper de mémoire.
 */
export const Lockup: React.FC = () => {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()

  const mark = pop(frame, { delay: 0, damping: 12, stiffness: 140 })
  const push = lerp(frame, [0, durationInFrames], [1, 1.04], EASE.out)
  const sheen = lerp(frame, [18, 44], [0, 1])
  const fade = lerp(frame, [durationInFrames - 8, durationInFrames], [0, 1])

  // L'adresse se pose d'un bloc, en pleine opacité dès qu'elle entre.
  const url = pop(frame, { delay: 8, damping: 14, stiffness: 150 })
  const urlTracking = lerp(frame, [8, 28], [26, 8], EASE.out)

  return (
    <AbsoluteFill
      style={{
        transform: `scale(${push})`,
        opacity: lerp(frame, [0, 4], [0, 1]) * (1 - fade),
      }}
    >
      <Safe>
        <Monogram
          width={250}
          color={C.fg}
          glow={lerp(frame, [0, 18], [10, 38])}
          style={{
            transform: `scale(${mark}) rotate(${(1 - mark) * -12}deg)`,
            marginBottom: 26,
          }}
        />

        <Sheen progress={sheen}>
          <div
            style={{
              fontFamily: DISPLAY,
              fontSize: 116,
              lineHeight: 0.95,
              color: C.fg,
              letterSpacing: -1,
              opacity: lerp(frame, [4, 12], [0, 1]),
              transform: `translateY(${lerp(frame, [4, 14], [26, 0], EASE.out)}px)`,
            }}
          >
            DAKARKITS
          </div>
        </Sheen>

        <div style={{ marginTop: 20, marginBottom: 22 }}>
          <Rule progress={lerp(frame, [12, 28], [0, 1], EASE.out)} width={760} thickness={4} />
        </div>

        <div
          style={{
            fontFamily: DISPLAY,
            fontSize: 124,
            lineHeight: 1,
            color: C.primary,
            letterSpacing: urlTracking,
            // Même compensation que dans `Eyebrow` : la chasse de fin de mot
            // décentre l'adresse si on ne la rattrape pas.
            transform: `translateX(${urlTracking / 2}px) scale(${lerp(url, [0, 1], [0.86, 1])})`,
            // Pleine opacité dès l'entrée : une adresse en transparence ne se
            // retient pas.
            opacity: url > 0.02 ? 1 : 0,
            textShadow: `0 0 60px ${C.primary}88, 0 0 140px ${C.primary}44`,
          }}
        >
          LOUYOMB.COM
        </div>

        {/* Sur TikTok, une adresse écrite ne se clique pas : il faut dire où
            aller la chercher. La pastille arrive juste après l'adresse, pour
            qu'on lise d'abord le nom du site puis le chemin pour y aller. */}
        <div
          style={{
            marginTop: 24,
            padding: '12px 36px',
            borderRadius: 999,
            background: `${C.primary}1F`,
            border: `2px solid ${C.primary}`,
            transform: `scale(${pop(frame, { delay: 20, damping: 11, stiffness: 160 })})`,
          }}
        >
          <div
            style={{
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: 38,
              color: C.primary,
              letterSpacing: 1,
            }}
          >
            Lien dans la bio
          </div>
        </div>

        <div
          style={{
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: 40,
            color: '#FFFFFF',
            marginTop: 24,
            letterSpacing: 3,
            textTransform: 'uppercase',
            transform: `translateX(1.5px) translateY(${lerp(
              frame,
              [30, 40],
              [22, 0],
              EASE.out,
            )}px)`,
            opacity: lerp(frame, [30, 38], [0, 1]),
          }}
        >
          Commande en 30 secondes
        </div>
      </Safe>
    </AbsoluteFill>
  )
}
