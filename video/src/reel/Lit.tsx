import React from 'react'
import { AbsoluteFill, Img } from 'remotion'
import { C, jerseyFile, type Jersey } from '../theme'
import { lerp } from '../components/anim'

/**
 * Un maillot, en pleine lumiere.
 *
 * Le defaut du premier film etait la : les maillots vivaient **derriere** le
 * texte, sous deux voiles sombres poses pour rendre les titres lisibles. Un
 * maillot a 60 % de luminosite derriere une phrase blanche n'est plus un
 * produit, c'est une texture — et c'est le produit qui doit arreter le pouce.
 *
 * Ici c'est l'inverse : rien ne passe par-dessus le maillot, et le texte se
 * range dans les bandes libres au-dessus et en dessous. La lumiere est faite
 * de trois couches, dans cet ordre :
 *
 *  1. un halo colore, tres flou, pris **dans les couleurs du maillot** — il
 *     detache le sujet du violet du theme sans ajouter une couleur de plus au
 *     film ;
 *  2. une copie floue du maillot en `screen`, qui lui fait rendre sa propre
 *     lumiere plutot que d'en recevoir une ;
 *  3. le maillot net, legerement pousse en luminosite et en saturation.
 *
 * La copie floue coute un rendu d'image de plus par frame. C'est le seul
 * endroit du film ou on se le permet, et c'est ce qui fait la difference
 * entre un detourage pose sur un fond et un objet eclaire.
 */
export const LitJersey: React.FC<{
  jersey: Jersey
  /**
   * La boite ou le maillot doit tenir — **une hauteur, pas seulement une
   * largeur**.
   *
   * Les photos ne sont pas toutes au meme rapport : `j9` et `j1` sont
   * carrees (700 × 700), `j11` fait 700 × 888. A largeur egale, le Barca
   * descend donc 240 px plus bas que les deux autres, et son prix finit
   * ecrit en travers du maillot. La boite est fixe et le maillot s'y
   * contient : les trois plans se cadrent pareil, quelle que soit la photo
   * qu'on ajoutera demain.
   */
  box: { w: number; h: number }
  /** La couleur du halo, relevee sur le maillot. */
  halo: string
  /** 0 → eteint, 1 → pleine puissance. Monte a l'entree du plan. */
  power?: number
  style?: React.CSSProperties
}> = ({ jersey, box, halo, power = 1, style }) => {
  const src = jerseyFile(jersey)
  const fit: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    display: 'block',
  }
  return (
    <div style={{ position: 'relative', width: box.w, height: box.h, ...style }}>
      <div
        style={{
          position: 'absolute',
          left: '-24%',
          top: '-16%',
          width: '148%',
          height: '132%',
          background: `radial-gradient(circle at 50% 48%, ${halo} 0%, ${halo}55 34%, transparent 66%)`,
          filter: 'blur(64px)',
          opacity: 0.68 * power,
        }}
      />
      <Img
        src={src}
        style={{
          ...fit,
          position: 'absolute',
          left: 0,
          top: 0,
          filter: 'blur(24px) brightness(1.55) saturate(1.35)',
          mixBlendMode: 'screen',
          opacity: 0.52 * power,
        }}
      />
      <Img
        src={src}
        style={{
          ...fit,
          position: 'relative',
          filter: `brightness(${lerp(power, [0, 1], [0.86, 1.12])}) saturate(1.1) contrast(1.05) drop-shadow(0 44px 64px rgba(0,0,0,0.82))`,
        }}
      />
    </div>
  )
}

/**
 * Le fond d'un plan de maillot : la couleur du maillot, tres diluee, sur le
 * fond du theme. Jamais un aplat sombre — c'est ce qui donne l'impression que
 * la lumiere vient de quelque part.
 */
export const LitBackdrop: React.FC<{ halo: string; power?: number }> = ({ halo, power = 1 }) => (
  <AbsoluteFill style={{ background: C.bgDeep }}>
    <AbsoluteFill
      style={{
        background: `radial-gradient(118% 62% at 50% 38%, ${C.card} 0%, ${C.bg} 44%, ${C.bgDeep} 82%)`,
      }}
    />
    <AbsoluteFill
      style={{
        background: `radial-gradient(76% 44% at 50% 40%, ${halo}2E 0%, transparent 72%)`,
        opacity: power,
      }}
    />
    {/* Vignette : ramene l'oeil au maillot, et masque les coins ou le degrade
        est le plus plat. */}
    <AbsoluteFill
      style={{
        background: `radial-gradient(84% 74% at 50% 44%, transparent 42%, ${C.bgDeep}D9 100%)`,
      }}
    />
  </AbsoluteFill>
)
