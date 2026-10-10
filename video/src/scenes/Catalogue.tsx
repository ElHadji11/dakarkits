import React from 'react'
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion'
import { EASE, drift, lerp, pop } from '../components/anim'
import { Carousel } from '../components/Carousel'
import { Odometer } from '../components/Odometer'
import { Safe } from '../components/Safe'
import { Eyebrow } from '../components/Type'
import { DISPLAY, SANS } from '../fonts'
import { C, HEIGHT, JERSEYS, SAFE_CENTER, discount, jerseyFile, money } from '../theme'

/**
 * Le maillot qui ouvre le plan : le Sénégal.
 *
 * À Dakar, c'est lui qui arrête le pouce. Il est donc en grand et le premier
 * à l'image, avant le compteur — pas noyé dans le carrousel. Le reste du
 * catalogue défile derrière lui et sert de preuve d'abondance.
 */
const HERO = JERSEYS.find((j) => j.team === 'Sénégal') ?? JERSEYS[0]
const HERO_ONLY = [HERO]

export const Catalogue: React.FC = () => {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()

  const exit = lerp(frame, [durationInFrames - 13, durationInFrames], [0, 1], EASE.in)
  // Les colonnes décélèrent au lieu de s'arrêter net, puis repartent pour la
  // coupe.
  const travel = lerp(frame, [0, durationInFrames - 13], [0, 1750], EASE.out) + exit * 700

  // Le héros arrive d'un coup, en dépassant : c'est la frappe du plan.
  const hero = pop(frame, { delay: 0, damping: 11, stiffness: 165 })
  const off = discount(HERO)

  return (
    <AbsoluteFill
      style={{
        opacity: lerp(frame, [0, 4], [0, 1]) * (1 - exit),
        filter: exit > 0 ? `blur(${exit * 13}px)` : undefined,
      }}
    >
      {/* Le héros est tenu hors du carrousel : le voir passer derrière
          lui-même casse la mise en avant. */}
      <Carousel frame={frame} travel={travel} exclude={HERO_ONLY} />

      {/* Deux voiles : un assombrissement d'ensemble qui fait reculer les
          tuiles, puis un noyau opaque centré sur la bande utile. Sans le
          second, les tuiles passent sous le texte et plus rien ne se lit. */}
      <AbsoluteFill
        style={{
          background: `${C.bgDeep}80`,
          opacity: lerp(frame, [0, 8], [0, 1]),
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 130% 44% at 50% ${
            (SAFE_CENTER / HEIGHT) * 100
          }%, ${C.bgDeep} 0%, ${C.bgDeep}F2 52%, transparent 84%)`,
          opacity: lerp(frame, [0, 10], [0, 1]),
        }}
      />

      <Safe>
        <Eyebrow text="Le catalogue" frame={frame} delay={1} size={30} color={C.primary} align="center" />

        {/* Le héros. Halo vert-jaune repris du maillot, pour qu'il se détache
            du violet du thème sans introduire une couleur de plus. */}
        <div
          style={{
            position: 'relative',
            marginTop: 10,
            transform: `scale(${lerp(hero, [0, 1], [0.55, 1])}) rotate(${
              (1 - hero) * -8
            }deg) translateY(${drift(3, frame, 10, 0.016)}px)`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: '8%',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #1FA86699 0%, transparent 64%)',
              filter: 'blur(50px)',
              opacity: lerp(frame, [2, 16], [0, 1]),
            }}
          />
          <Img
            src={jerseyFile(HERO)}
            style={{
              position: 'relative',
              width: 560,
              filter: 'drop-shadow(0 34px 40px rgba(0,0,0,0.75))',
            }}
          />
          {off ? (
            <div
              style={{
                position: 'absolute',
                top: 64,
                right: -16,
                background: C.primary,
                color: C.bg,
                fontFamily: SANS,
                fontWeight: 800,
                fontSize: 46,
                padding: '10px 26px',
                borderRadius: 999,
                boxShadow: `0 0 50px ${C.primary}66`,
                transform: `rotate(9deg) scale(${pop(frame, { delay: 8, damping: 10 })})`,
              }}
            >
              -{off} %
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 20,
            marginTop: 4,
            opacity: lerp(frame, [10, 20], [0, 1]),
            transform: `translateY(${lerp(frame, [10, 22], [20, 0], EASE.out)}px)`,
          }}
        >
          <span style={{ fontFamily: DISPLAY, fontSize: 76, color: C.fg, letterSpacing: 1 }}>
            SÉNÉGAL EXTÉRIEUR
          </span>
          <span style={{ fontFamily: DISPLAY, fontSize: 76, color: C.primary }}>
            {money(HERO.price)}
          </span>
        </div>

        {/* Le compteur arrive après le héros : d'abord le maillot qui retient,
            ensuite la promesse de choix. */}
        <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: 18 }}>
          <span
            style={{
              fontFamily: DISPLAY,
              fontSize: 150,
              lineHeight: 0.84,
              color: C.fg,
              transform: `scale(${lerp(pop(frame, { delay: 22 }), [0, 1], [0.7, 1])})`,
            }}
          >
            +
          </span>
          <Odometer value="20" frame={frame} delay={24} size={164} spins={2} color={C.fg} />
          <span
            style={{
              fontFamily: DISPLAY,
              fontSize: 150,
              lineHeight: 0.84,
              color: C.primary,
              marginLeft: 26,
              opacity: lerp(frame, [32, 42], [0, 1]),
            }}
          >
            MAILLOTS
          </span>
        </div>

        <div
          style={{
            fontFamily: SANS,
            fontSize: 36,
            lineHeight: 1.4,
            color: C.fg,
            textAlign: 'center',
            maxWidth: 820,
            marginTop: 16,
            opacity: lerp(frame, [40, 52], [0, 1]),
            transform: `translateY(${lerp(frame, [40, 52], [20, 0], EASE.out)}px)`,
          }}
        >
          Des maillots de club et de sélection disponibles.
        </div>
      </Safe>
    </AbsoluteFill>
  )
}
