import React from 'react'
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion'
import { C } from '../theme'
import { SANS } from '../fonts'
import { Wipe } from './Backdrop'
import { Hook } from './scenes/Hook'
import { Assemble } from './scenes/Assemble'
import { Order, Search, Size } from './scenes/Features'
import { Metric } from './scenes/Metric'
import { Lockup } from './scenes/Lockup'
import { SpotAudio } from './SpotAudio'
import { useStage } from './stage'
import { BEATS, CUT_FRAMES, LEN } from './timeline'

/**
 * Le spot, 20 secondes, un seul montage pour les trois formats.
 *
 * Chaque plan est une `Sequence` : ses composants comptent les frames depuis
 * leur propre debut, donc une borne qui bouge dans `timeline.ts` ne demande
 * de retoucher aucune animation.
 */

const SCENES = [
  { name: 'hook', beat: BEATS.hook, Comp: Hook },
  { name: 'assemble', beat: BEATS.assemble, Comp: Assemble },
  { name: 'f1-cherche', beat: BEATS.f1, Comp: Search },
  { name: 'f2-choisis', beat: BEATS.f2, Comp: Size },
  { name: 'f3-commande', beat: BEATS.f3, Comp: Order },
  { name: 'metric', beat: BEATS.metric, Comp: Metric },
  { name: 'lockup', beat: BEATS.lockup, Comp: Lockup },
] as const

/** La barre de progression : elle dit au spectateur que c'est court. */
const Progress: React.FC = () => {
  const frame = useCurrentFrame()
  const stage = useStage()
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        bottom: 0,
        height: Math.max(3, 4 * stage.u),
        width: `${(frame / LEN) * 100}%`,
        background: C.primary,
        opacity: 0.85,
      }}
    />
  )
}

export const Spot: React.FC = () => {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill style={{ background: C.bgDeep, fontFamily: SANS }}>
      {SCENES.map(({ name, beat, Comp }) => (
        <Sequence key={name} from={beat[0]} durationInFrames={beat[1] - beat[0]} name={name}>
          <Comp />
        </Sequence>
      ))}

      {/* Les balayages passent par-dessus les plans : ils masquent la coupe
          plutot que de la souligner. */}
      {CUT_FRAMES.map((at) => (
        <Wipe key={at} frame={frame} at={at - 5} len={12} />
      ))}

      <Progress />
      <SpotAudio />
    </AbsoluteFill>
  )
}
