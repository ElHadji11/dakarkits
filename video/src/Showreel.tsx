import React from 'react'
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion'
import { Backdrop } from './components/Backdrop'
import {
  Chroma,
  ChromaDefs,
  Flash,
  Glitch,
  Grain,
  Scanlines,
  Vignette,
} from './components/Overlays'
import { EASE, burst, flash, lerp, shake } from './components/anim'
import { Catalogue } from './scenes/Catalogue'
import { Delivery } from './scenes/Delivery'
import { Experience } from './scenes/Experience'
import { Ignition } from './scenes/Ignition'
import { Lockup } from './scenes/Lockup'
import { Price } from './scenes/Price'
import { Soundtrack } from './Soundtrack'
import { C, CUTS, DURATION } from './theme'

const SCENES = [
  { key: 'ignition', at: CUTS.ignition, Component: Ignition },
  { key: 'catalogue', at: CUTS.catalogue, Component: Catalogue },
  { key: 'price', at: CUTS.price, Component: Price },
  { key: 'experience', at: CUTS.experience, Component: Experience },
  { key: 'delivery', at: CUTS.delivery, Component: Delivery },
  { key: 'lockup', at: CUTS.lockup, Component: Lockup },
] as const

/** Les coupes, hors la première : c'est là que tapent l'éclat et la secousse. */
const CUT_FRAMES: number[] = SCENES.slice(1).map((s) => s.at[0])

/** Durée de la déchirure, en frames. Au-delà, ce n'est plus un accident. */
const GLITCH_LEN = 5

/**
 * Le film.
 *
 * Un fond continu, six plans en coupe franche, et une couche d'optique
 * par-dessus tout — grain, balayage, vignetage.
 *
 * **Toutes les coupes sont traitées pareil** : éclat violet, secousse caméra,
 * déchirure en bandes et séparation RVB. C'est ce qui empêche le montage de
 * paraître bricolé — un plan qui aurait sa transition à lui attirerait
 * l'attention sur la transition plutôt que sur ce qu'elle montre.
 *
 * Et chacune tombe sur un kick : voir `CUTS` dans `theme.ts`.
 */
export const Showreel: React.FC = () => {
  const frame = useCurrentFrame()

  // La caméra encaisse chaque coupe. Les secousses s'additionnent, mais elles
  // ne se recouvrent jamais : les plans durent plus que leur amortissement.
  const kick = CUT_FRAMES.reduce(
    (acc, at) => {
      const s = shake(frame, at, 16, 8)
      return { x: acc.x + s.x, y: acc.y + s.y, r: acc.r + s.r }
    },
    { x: 0, y: 0, r: 0 },
  )

  const cutFlash = CUT_FRAMES.reduce((acc, at) => Math.max(acc, flash(frame, at, 5, 0.45)), 0)
  const glitch = CUT_FRAMES.reduce((acc, at) => Math.max(acc, burst(frame, at, GLITCH_LEN, 1)), 0)
  const fringe = CUT_FRAMES.reduce((acc, at) => Math.max(acc, burst(frame, at, GLITCH_LEN, 16)), 0)

  // Pas d'ouverture au noir : la frame 0 doit déjà porter la marque et la
  // promesse. Seule la fermeture se fait en fondu.
  const fadeOut = lerp(frame, [DURATION - 12, DURATION], [1, 0], EASE.in)

  return (
    <AbsoluteFill style={{ backgroundColor: C.bgDeep }}>
      <ChromaDefs />
      <Soundtrack />
      <AbsoluteFill
        style={{
          opacity: fadeOut,
          transform: `translate(${kick.x}px, ${kick.y}px) rotate(${kick.r}deg) scale(1.02)`,
        }}
      >
        <Backdrop />

        {/* La séparation RVB ne coûte ses trois rendus que pendant les cinq
            frames qui suivent une coupe ; ailleurs, `Chroma` passe droit. */}
        <Chroma amount={fringe} fill>
          {SCENES.map(({ key, at, Component }) => (
            <Sequence key={key} from={at[0]} durationInFrames={at[1] - at[0]} name={key}>
              <Component />
            </Sequence>
          ))}
        </Chroma>

        <Glitch amount={glitch} seed={Math.floor(frame / 2)} />
        <Flash amount={cutFlash} color={C.primary} />
        <Vignette />
        <Scanlines />
        <Grain />
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
