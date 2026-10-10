import React from 'react'
import { Composition } from 'remotion'
import { Showreel } from './Showreel'
import { DURATION, FPS, HEIGHT, WIDTH } from './theme'

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Showreel"
    component={Showreel}
    durationInFrames={DURATION}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
  />
)
