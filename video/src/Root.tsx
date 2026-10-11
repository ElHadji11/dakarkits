import React from 'react'
import { Composition } from 'remotion'
import { Showreel } from './Showreel'
import { Spot } from './spot/Spot'
import { DURATION, FPS, HEIGHT, WIDTH } from './theme'
import { LEN } from './spot/timeline'

/**
 * Trois formats, un seul montage.
 *
 * `Spot` ne sait pas dans quel cadre il est rendu : il demande a `useStage()`
 * et recadre. Les trois compositions ci-dessous ne different donc que par
 * leurs dimensions — jamais par leur contenu, qui resterait a resynchroniser
 * a chaque retouche.
 *
 * `Showreel` est le premier film, vertical, laisse tel quel.
 */
export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Spot"
      component={Spot}
      durationInFrames={LEN}
      fps={FPS}
      width={1920}
      height={1080}
    />
    <Composition
      id="SpotSquare"
      component={Spot}
      durationInFrames={LEN}
      fps={FPS}
      width={1080}
      height={1080}
    />
    <Composition
      id="SpotVertical"
      component={Spot}
      durationInFrames={LEN}
      fps={FPS}
      width={1080}
      height={1920}
    />
    <Composition
      id="Showreel"
      component={Showreel}
      durationInFrames={DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  </>
)
