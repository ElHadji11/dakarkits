import React from 'react'
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion'
import { burst, flash, shake } from '../components/anim'
import { Chroma, ChromaDefs, Flash, Scanlines } from '../components/Overlays'
import { SANS } from '../fonts'
import { C } from '../theme'
import { Wipe } from '../spot/Backdrop'
import { Grain } from './Stage'
import { HOOKS, type HookName } from './hooks'
import { Parade } from './scenes/Parade'
import { Fill, Pick, Search } from './scenes/Order'
import { Done } from './scenes/Done'
import { Endcard } from './scenes/Endcard'
import { ReelAudio } from './ReelAudio'
import { BEATS, CUT_FRAMES, LEN, type Cta } from './timeline'

/**
 * Le reel, 20 secondes, vertical.
 *
 * Six plans, une seule idee de montage : **montrer avant de nommer**. Cinq
 * secondes de maillots et de prix, quatre secondes de commande reelle, un
 * carton de fin. La marque n'apparait qu'a la dix-septieme seconde.
 *
 * Chaque plan est une `Sequence` : ses composants comptent les frames depuis
 * leur propre debut, donc une borne qui bouge dans `timeline.ts` ne demande
 * de retoucher aucune animation.
 *
 * **Toutes les coupes sont traitees pareil** — balayage, eclat, secousse,
 * separation RVB. C'est ce qui empeche le montage de paraitre bricole : un
 * plan qui aurait sa transition a lui attirerait l'attention sur la
 * transition plutot que sur ce qu'elle montre. Et chacune tombe sur un kick,
 * voir `BEATS`.
 */

const SCENES = [
  { name: 'parade', beat: BEATS.parade, Comp: Parade },
  { name: '01-cherche', beat: BEATS.search, Comp: Search },
  { name: '02-choisis', beat: BEATS.pick, Comp: Pick },
  { name: '03-commande', beat: BEATS.fill, Comp: Fill },
  { name: 'commande-passee', beat: BEATS.done, Comp: Done },
] as const

/** Duree de la dechirure RVB apres une coupe. Au-dela, ce n'est plus un accident. */
const FRINGE = 5

/**
 * La barre de progression : elle dit au spectateur que c'est court.
 * Elle vit sous la zone morte du bas, la ou l'interface de TikTok ne la
 * recouvre pas tout a fait.
 */
const Progress: React.FC = () => {
  const frame = useCurrentFrame()
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        bottom: 0,
        height: 5,
        width: `${(frame / LEN) * 100}%`,
        background: C.primary,
        opacity: 0.85,
      }}
    />
  )
}

export const Reel: React.FC<{ hook: HookName; cta: Cta }> = ({ hook, cta }) => {
  const frame = useCurrentFrame()
  const opening = HOOKS[hook]

  // La camera encaisse chaque coupe. Les secousses s'additionnent, mais elles
  // ne se recouvrent jamais : les plans durent plus que leur amortissement.
  const kick = CUT_FRAMES.reduce(
    (acc, at) => {
      const s = shake(frame, at, 15, 7)
      return { x: acc.x + s.x, y: acc.y + s.y, r: acc.r + s.r }
    },
    { x: 0, y: 0, r: 0 },
  )

  const cutFlash = CUT_FRAMES.reduce((acc, at) => Math.max(acc, flash(frame, at, 5, 0.4)), 0)
  const fringe = CUT_FRAMES.reduce((acc, at) => Math.max(acc, burst(frame, at, FRINGE, 14)), 0)

  // Pas d'ouverture au noir : la frame 0 porte deja un maillot plein cadre.
  // Seule la fermeture se fait en fondu, et elle est dans `Endcard`.
  return (
    <AbsoluteFill style={{ background: C.bgDeep, fontFamily: SANS }}>
      <ChromaDefs />
      <ReelAudio hook={hook} />

      <AbsoluteFill
        style={{
          transform: `translate(${kick.x}px, ${kick.y}px) rotate(${kick.r}deg) scale(1.015)`,
        }}
      >
        {/* La separation RVB ne coute ses trois rendus que pendant les cinq
            frames qui suivent une coupe ; ailleurs, `Chroma` passe droit. */}
        <Chroma amount={fringe} fill>
          {/* L'accroche. C'est le seul plan que les trois versions du film ne
              partagent pas — voir `hooks/index.ts`. */}
          <Sequence
            from={BEATS.hook[0]}
            durationInFrames={BEATS.hook[1] - BEATS.hook[0]}
            name={'accroche · ' + hook}
          >
            <opening.Comp />
          </Sequence>
          {SCENES.map(({ name, beat, Comp }) => (
            <Sequence key={name} from={beat[0]} durationInFrames={beat[1] - beat[0]} name={name}>
              <Comp />
            </Sequence>
          ))}
          <Sequence
            from={BEATS.endcard[0]}
            durationInFrames={BEATS.endcard[1] - BEATS.endcard[0]}
            name="carton de fin"
          >
            <Endcard cta={cta} />
          </Sequence>
        </Chroma>

        {/* Les balayages passent par-dessus les plans : ils masquent la coupe
            plutot que de la souligner. */}
        {CUT_FRAMES.map((at) => (
          <Wipe key={at} frame={frame} at={at - 5} len={12} />
        ))}

        <Flash amount={cutFlash} color={C.primary} />
        <Scanlines />
        <Grain />
      </AbsoluteFill>

      <Progress />
    </AbsoluteFill>
  )
}
