import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { EASE, lerp, pop } from '../../components/anim'
import { Monogram } from '../../components/Monogram'
import { Rule, Sheen } from '../../components/Type'
import { DISPLAY, SANS } from '../../fonts'
import { C, SAFE } from '../../theme'
import { Mascot, mascotEntrance } from '../Mascot'
import { COPY, type Cta } from '../timeline'

/**
 * Plan 6 — la signature, et le premier logo du film.
 *
 * Il arrive a la dix-septieme seconde, et c'est voulu : a la frame 0 un
 * monogramme inconnu ne dit rien a personne et coute la seule seconde ou le
 * pouce hesite encore. A la fin, le spectateur a vu trois maillots, trois
 * prix et une commande passee — le logo a enfin quelque chose a signer.
 *
 * Le trace s'ecrit avant de se remplir : `LOGO_PATH` est un vrai trace
 * vectoriel (`components/shop/logo.tsx`), pas une image, et c'est exactement
 * ce qui permet de le dessiner au trait.
 *
 * L'adresse est pleine et lumineuse des son entree, jamais en demi-teinte :
 * c'est la seule chose que le spectateur doit pouvoir retaper de memoire.
 */
export const Endcard: React.FC<{ cta: Cta }> = ({ cta }) => {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()

  const draw = lerp(frame, [0, 26], [0, 1], EASE.out)
  const fill = lerp(frame, [20, 38], [0, 1], EASE.out)
  const mark = pop(frame, { delay: 0, damping: 14, stiffness: 130 })

  const url = pop(frame, { delay: 34, damping: 14, stiffness: 150 })
  const urlTracking = lerp(frame, [34, 58], [30, 8], EASE.out)

  // Un lent rapproche sur tout le carton : il donne a la fin une direction,
  // au lieu d'une image qui attend que le film se termine.
  const push = lerp(frame, [0, durationInFrames], [1, 1.05], EASE.out)
  const fade = lerp(frame, [durationInFrames - 10, durationInFrames], [0, 1], EASE.in)

  return (
    <AbsoluteFill style={{ background: C.bgDeep }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(100% 54% at 50% 42%, ${C.card} 0%, ${C.bg} 42%, ${C.bgDeep} 82%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(56% 32% at 50% 40%, ${C.primaryDeep}55 0%, transparent 74%)`,
          opacity: lerp(frame, [0, 24], [0.35, 1]),
        }}
      />

      {/*
        Le lion signe avec la marque.

        Il entre par le bas a droite, coupe par le bord du cadre — il ne pose
        pas a cote du logo, il est **dans** le plan. Petit et decentre : le
        carton de fin appartient a l'adresse, pas a lui, et un personnage de
        la meme taille que le mot-symbole se disputerait l'attention avec lui
        au moment precis ou il faut retenir une adresse.

        Il arrive apres le monogramme et l'adresse (frame 44), quand les deux
        sont deja poses. Sa couche est **sous** le lockup : si jamais sa
        criniere montait jusqu'au bandeau, c'est le texte qui passe devant.
      */}
      <Mascot
        height={760}
        bottom={-150}
        centerX={880}
        frame={frame}
        entrance={mascotEntrance(frame, 44, 16)}
        opacity={1 - fade}
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
          transform: `scale(${push})`,
          opacity: 1 - fade,
          pointerEvents: 'none',
        }}
      >
        <Monogram
          width={330}
          draw={draw}
          fill={fill}
          color={C.fg}
          glow={lerp(frame, [16, 40], [8, 44])}
          style={{
            transform: `scale(${lerp(mark, [0, 1], [0.84, 1])}) rotate(${(1 - mark) * -10}deg)`,
            marginBottom: 34,
          }}
        />

        <Sheen progress={lerp(frame, [40, 70], [0, 1])}>
          <div
            style={{
              fontFamily: DISPLAY,
              fontSize: 128,
              lineHeight: 0.95,
              color: C.fg,
              letterSpacing: -1,
              opacity: lerp(frame, [22, 32], [0, 1]),
              transform: `translateY(${lerp(frame, [22, 36], [28, 0], EASE.out)}px)`,
            }}
          >
            DAKARKITS
          </div>
        </Sheen>

        <div style={{ marginTop: 24, marginBottom: 26 }}>
          <Rule progress={lerp(frame, [30, 50], [0, 1], EASE.out)} width={800} thickness={4} />
        </div>

        <div
          style={{
            fontFamily: DISPLAY,
            fontSize: 132,
            lineHeight: 1,
            color: C.primary,
            letterSpacing: urlTracking,
            // Meme compensation que partout ailleurs : la chasse de fin de mot
            // decentre l'adresse si on ne la rattrape pas.
            transform: `translateX(${urlTracking / 2}px) scale(${lerp(url, [0, 1], [0.88, 1])})`,
            // Pleine opacite des l'entree : une adresse en transparence ne se
            // retient pas.
            opacity: url > 0.02 ? 1 : 0,
            textShadow: `0 0 64px ${C.primary}88, 0 0 150px ${C.primary}44`,
          }}
        >
          {COPY.endcard.url}
        </div>

        {/*
          Sur un post organique, cette adresse ne se clique pas : il faut dire
          ou le lien existe vraiment, et il existe a deux endroits — la bio et
          la description du post.

          En publicite, le bouton de la plateforme porte deja le lien :
          l'invite devient inutile, et « lien en bio » sur une annonce payante
          est au mieux du bruit. La variante `ads` met a la place la derniere
          raison d'acheter.
        */}
        <div
          style={{
            marginTop: 30,
            padding: '16px 44px',
            borderRadius: 999,
            background: `${C.primary}1F`,
            border: `2px solid ${C.primary}`,
            transform: `scale(${pop(frame, { delay: 48, damping: 11, stiffness: 160 })})`,
          }}
        >
          <div
            style={{
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: 42,
              color: C.primary,
              letterSpacing: 0.5,
            }}
          >
            {cta === 'organic' ? COPY.endcard.bio : COPY.endcard.ad}
          </div>
        </div>

        <div
          style={{
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: 34,
            color: C.fg,
            marginTop: 26,
            letterSpacing: 4,
            textTransform: 'uppercase',
            transform: `translateX(2px) translateY(${lerp(frame, [62, 74], [24, 0], EASE.out)}px)`,
            opacity: lerp(frame, [62, 72], [0, 1]),
          }}
        >
          {COPY.count} maillots · Dakar
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
