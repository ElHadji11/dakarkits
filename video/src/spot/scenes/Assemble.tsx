import React from 'react'
import { AbsoluteFill, Img, useCurrentFrame } from 'remotion'
import { C } from '../../theme'
import { DISPLAY, SANS } from '../../fonts'
import { EASE, glide, lerp, pop } from '../../components/anim'
import { Backdrop } from '../Backdrop'
import { Frame, shotFile } from '../Screen'
import { G, SHOT, type Box } from '../geometry'
import { FULL, useStage, windowRect } from '../stage'
import { BEATS, COPY } from '../timeline'

/**
 * 2. Le produit arrive — l'interface se monte piece par piece.
 *
 * Chaque morceau est une capture reelle posee a **sa vraie coordonnee**
 * (`geometry.ts`, relevee sur le site). Quand ils se sont tous poses, l'image
 * est celle de la capture entiere, au pixel pres : c'est pour ca que le
 * fondu vers `d-home` a la fin ne se voit pas. Rien n'a ete redessine.
 */

const LEN = BEATS.assemble[1] - BEATS.assemble[0]

/** Entrees : chaque piece arrive d'ou elle a un sens d'arriver. */
type Entry = {
  name: string
  src: string
  box: Box
  at: number
  from: 'top' | 'left' | 'right' | 'scaleX' | 'scale'
}

const PIECES: Entry[] = [
  { name: 'promo', src: 'p-promo', box: G.home.promo, at: 2, from: 'top' },
  { name: 'delivery', src: 'p-delivery', box: G.home.delivery, at: 7, from: 'top' },
  { name: 'logo', src: 'p-logo', box: G.home.logo, at: 13, from: 'scale' },
  { name: 'search', src: 'p-search', box: G.home.search, at: 18, from: 'scaleX' },
  { name: 'icons', src: 'p-icons', box: G.home.icons, at: 23, from: 'right' },
  { name: 'nav', src: 'p-nav', box: G.home.nav, at: 28, from: 'left' },
  { name: 'tools', src: 'p-tools', box: G.home.tools, at: 34, from: 'left' },
]

/** Les huit cartes, deux par temps : c'est le rythme du plan. */
const CARD_FROM = 44
const CARD_STEP = 4.5

export const Assemble: React.FC = () => {
  const frame = useCurrentFrame()
  const stage = useStage()
  const { u, wide, tall } = stage

  // La camera : elle part legerement en arriere et pousse jusqu'a la fin du
  // plan. Un plan fixe sur une interface qui se monte paraitrait plat.
  const push = lerp(frame, [0, LEN], [0.995, 1.055], EASE.inOut)
  const focus: Box = {
    x: FULL.x + (FULL.w * (1 - 1 / push)) / 2,
    y: FULL.y + (FULL.h * (1 - 1 / push)) / 2,
    w: FULL.w / push,
    h: FULL.h / push,
  }

  // En 16:9 la page remplit le cadre. En 1:1 et 9:16 elle devient une
  // fenetre, et le texte vit dessous : rogner une page de bureau pour en
  // faire un format vertical ne montrerait que son quart gauche.
  const rect = windowRect(stage, tall ? 0.5 : 0.62, 0.2)
  const mode = wide ? 'cover' : 'contain'
  const padding = wide ? 1 : 0.98

  // Le fondu vers la capture entiere : elle apporte les rangees du bas, que
  // l'assemblage ne montre pas.
  const settle = lerp(frame, [LEN - 48, LEN - 30], [0, 1], EASE.out)

  const titleIn = pop(frame, { delay: 62, damping: 17, stiffness: 140 })

  return (
    <AbsoluteFill>
      <Backdrop frame={frame} energy={0.85} focus={{ x: 50, y: wide ? 45 : 32 }} />

      <Frame
        focus={focus}
        mode={mode}
        padding={padding}
        rect={rect}
        radius={rect ? 18 : 0}
        chrome={Boolean(rect)}
      >
        {/* Le fond de la page, pour que les pieces ne flottent pas dans le
            vide pendant qu'elles arrivent. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: C.bg,
            opacity: lerp(frame, [0, 6], [0, 1], EASE.out),
            borderRadius: wide ? 0 : 14,
          }}
        />

        {PIECES.map((p) => {
          const g = glide(frame, p.at)
          const o = lerp(frame, [p.at, p.at + 7], [0, 1], EASE.out)
          const slide =
            p.from === 'top'
              ? `translateY(${(1 - g) * -p.box.h * 1.4}px)`
              : p.from === 'left'
                ? `translateX(${(1 - g) * -160}px)`
                : p.from === 'right'
                  ? `translateX(${(1 - g) * 160}px)`
                  : p.from === 'scaleX'
                    ? `scaleX(${0.2 + g * 0.8})`
                    : `scale(${0.55 + g * 0.45})`
          return (
            <Img
              key={p.name}
              src={shotFile(p.src as never)}
              style={{
                position: 'absolute',
                left: p.box.x,
                top: p.box.y,
                width: p.box.w,
                height: p.box.h,
                opacity: o,
                transform: slide,
                transformOrigin: p.from === 'scaleX' ? 'left center' : 'center',
              }}
            />
          )
        })}

        {/* Le compteur du site : « 22 maillots », son vrai libelle. */}
        <Img
          src={shotFile('p-count')}
          style={{
            position: 'absolute',
            left: G.home.count.x,
            top: G.home.count.y,
            width: G.home.count.w,
            height: G.home.count.h,
            opacity: lerp(frame, [40, 48], [0, 1], EASE.out),
          }}
        />

        {G.home.cards.map((card, i) => {
          const at = CARD_FROM + i * CARD_STEP
          const p = pop(frame, { delay: at, damping: 15, stiffness: 170, mass: 0.8 })
          const o = lerp(frame, [at, at + 5], [0, 1], EASE.out)
          return (
            <Img
              key={card.href}
              src={shotFile(('p-card-' + (i + 1)) as never)}
              style={{
                position: 'absolute',
                left: card.x,
                top: card.y,
                width: card.w,
                height: card.h,
                opacity: o,
                transform: `translateY(${(1 - p) * 52}px) scale(${0.88 + p * 0.12})`,
              }}
            />
          )
        })}

        {/* La capture entiere prend le relais : meme geometrie, donc la
            transition ne se voit pas — elle ne fait qu'apporter le bas. */}
        <Img
          src={shotFile('d-home')}
          style={{
            position: 'absolute',
            inset: 0,
            width: SHOT.w,
            height: SHOT.h,
            opacity: settle,
          }}
        />
      </Frame>

      {/* L'adresse, en pastille : la seule chose de ce plan qui ne vienne pas
          d'une capture, parce qu'elle n'est pas dans la page. */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          ...(rect ? { top: rect.y + rect.h + rect.gap } : { bottom: stage.safeBottom }),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10 * u,
          opacity: titleIn,
          transform: `translateY(${(1 - titleIn) * 24 * u}px)`,
        }}
      >
        {!wide ? (
          <span
            style={{
              fontFamily: DISPLAY,
              fontSize: 92 * u,
              lineHeight: 0.9,
              color: C.fg,
            }}
          >
            {/* Le compteur du site, releve a la capture — pas un nombre
                ecrit dans le film. Bebas n'a que des capitales. */}
            {G.home.countText.toUpperCase()}
          </span>
        ) : null}
        <span
          style={{
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 26 * u,
            letterSpacing: 1.5 * u,
            color: C.bgDeep,
            background: C.primary,
            borderRadius: 999,
            padding: `${9 * u}px ${24 * u}px`,
          }}
        >
          {COPY.assemble.url}
        </span>
      </div>
    </AbsoluteFill>
  )
}
