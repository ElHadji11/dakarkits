import React from 'react'
import { AbsoluteFill } from 'remotion'
import { SAFE } from '../theme'

/**
 * La bande utile du format vertical.
 *
 * TikTok et les Reels posent leur interface par-dessus l'image : la barre du
 * haut mange 250 px, la légende et les boutons du bas en mangent 350. Tout ce
 * qui doit se lire vit entre les deux. Le décor, lui, peut déborder —
 * c'est même ce qui fait tenir le plein cadre.
 */
export const Safe: React.FC<{
  children: React.ReactNode
  justify?: React.CSSProperties['justifyContent']
  style?: React.CSSProperties
}> = ({ children, justify = 'center', style }) => (
  <AbsoluteFill
    style={{
      paddingTop: SAFE.top,
      paddingBottom: SAFE.bottom,
      paddingLeft: 60,
      paddingRight: 60,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: justify,
      ...style,
    }}
  >
    {children}
  </AbsoluteFill>
)
