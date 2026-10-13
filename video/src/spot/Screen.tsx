import React from 'react'
import { Img, staticFile } from 'remotion'
import { C } from '../theme'
import { ASSETS, type AssetName } from './assets'
import { SHOT, type Box } from './geometry'
import { fitBox, useStage } from './stage'

/**
 * Tout ce qui montre l'interface du produit passe par ici.
 *
 * Regle du film : **l'interface n'est jamais redessinee**. Ces composants ne
 * savent qu'une chose — prendre une capture de louyomb.com et l'amener dans
 * le cadre. Ce qui bouge, c'est la camera et les morceaux reels, jamais une
 * reconstitution.
 */

/**
 * L'echelle du cadrage courant, pour les elements qui doivent garder une
 * taille constante a l'ecran — le curseur, les libelles — alors qu'ils vivent
 * dans l'espace de la page.
 */
const Scale = React.createContext(1)
export const useFrameScale = () => React.useContext(Scale)

export const shotFile = (name: AssetName) => staticFile('shots/' + name + '.webp')

type FrameProps = {
  /** La region de la capture a amener dans le cadre, en pixels CSS. */
  focus: Box
  mode?: 'cover' | 'contain'
  /** < 1 laisse de la marge autour de la region. */
  padding?: number
  /** Taille de l'espace de page ; par defaut le cadrage 1920x1080. */
  page?: { w: number; h: number }
  /**
   * Decalage du cadrage, en pixels d'ecran. Sert aux formats verticaux :
   * l'interface remonte pour laisser le texte s'installer dessous.
   */
  shift?: { x?: number; y?: number }
  /**
   * La zone de l'ecran ou l'interface est montree. Par defaut le cadre
   * entier ; en 1:1 et en 9:16 c'est une fenetre, parce qu'une page de
   * bureau etalee sur un format vertical ne montrerait que sa colonne de
   * gauche.
   */
  rect?: { x: number; y: number; w: number; h: number }
  radius?: number
  /** Bordure et ombre de la fenetre — seulement quand il y a une fenetre. */
  chrome?: boolean
  children: React.ReactNode
  style?: React.CSSProperties
}

/**
 * Place un espace de page dans le cadre : `focus` finit centre, a la bonne
 * echelle pour le format courant. C'est le seul endroit du film ou une
 * capture rencontre les dimensions de la composition.
 */
export const Frame: React.FC<FrameProps> = ({
  focus,
  mode = 'cover',
  padding = 1,
  page = SHOT,
  shift,
  rect,
  radius = 0,
  chrome = false,
  children,
  style,
}) => {
  const stage = useStage()
  const r = rect ?? { x: 0, y: 0, w: stage.width, h: stage.height }
  const { scale, cx, cy } = fitBox(focus, { width: r.w, height: r.h }, mode, padding)
  return (
    <div
      style={{
        position: 'absolute',
        left: r.x,
        top: r.y,
        width: r.w,
        height: r.h,
        overflow: 'hidden',
        borderRadius: radius,
        border: chrome ? `1px solid ${C.border}` : undefined,
        boxShadow: chrome ? `0 ${0.04 * r.h}px ${0.1 * r.h}px rgba(0,0,0,.55)` : undefined,
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: r.w / 2 + (shift?.x ?? 0),
          top: r.h / 2 + (shift?.y ?? 0),
          width: page.w,
          height: page.h,
          transformOrigin: '0 0',
          transform: `scale(${scale}) translate(${-cx}px, ${-cy}px)`,
        }}
      >
        <Scale.Provider value={scale}>{children}</Scale.Provider>
      </div>
    </div>
  )
}

export type ShotProps = Omit<FrameProps, 'children' | 'page'> & {
  src: AssetName
  /** Elements poses par-dessus la capture, en coordonnees de page. */
  children?: React.ReactNode
  /** Assombrit la capture — pour laisser passer un titre. */
  dim?: number
  blur?: number
  /**
   * La largeur CSS de l'espace de page de la capture. 1920 pour le bureau,
   * `SHOT_M.w` (430) pour le telephone.
   *
   * Sans ce reglage, une capture de telephone serait placee dans un espace de
   * 1920 px : les boites de `GM`, mesurees dans une fenetre de 430, viseraient
   * le quart gauche de l'image. Les deux jeux de coordonnees ne se melangent
   * pas, et c'est ce parametre qui dit lequel on habite.
   */
  base?: number
}

/**
 * Une capture entiere, cadree sur une region.
 *
 * La capture est en 2x ou 3x : elle est dessinee a sa taille CSS et le
 * fichier a deux ou trois fois plus de pixels, donc un gros plan reste net.
 */
export const Shot: React.FC<ShotProps> = ({
  src,
  children,
  dim = 0,
  blur = 0,
  base = SHOT.w,
  ...frame
}) => {
  const asset = ASSETS[src]
  // Les captures pleine page sont plus hautes que le cadrage : leur espace de
  // page suit leur propre ratio, sinon l'image serait ecrasee.
  const page = { w: base, h: (asset.h / asset.w) * base }
  return (
    <Frame {...frame} page={page}>
      <Img
        src={shotFile(src)}
        style={{
          width: page.w,
          height: page.h,
          display: 'block',
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
        }}
      />
      {dim > 0 ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(7, 7, 14, ${dim})`,
          }}
        />
      ) : null}
      {children}
    </Frame>
  )
}

/**
 * Un morceau d'interface, pose a sa vraie coordonnee dans la page.
 *
 * `box` vient de `geometry.ts`, releve sur le site : le plan « l'interface se
 * monte » reconstruit donc la vraie mise en page, et quand les pieces se
 * posent l'image est celle de la capture entiere, au pixel pres.
 */
export const Piece: React.FC<{
  src: AssetName
  box: Box
  style?: React.CSSProperties
  radius?: number
}> = ({ src, box, style, radius }) => (
  <Img
    src={shotFile(src)}
    style={{
      position: 'absolute',
      left: box.x,
      top: box.y,
      width: box.w,
      height: box.h,
      display: 'block',
      borderRadius: radius,
      ...style,
    }}
  />
)

/**
 * Une region d'une capture, decoupee a l'affichage.
 *
 * Evite d'aller recapturer un morceau qu'on a deja dans une vue entiere :
 * l'image complete est posee dans une fenetre a la bonne coordonnee, decalee
 * de l'oppose. C'est ainsi que le champ de recherche finit par montrer le
 * vrai « barca » de `d-search-barca` et pas seulement du texte repose.
 */
export const Crop: React.FC<{
  src: AssetName
  box: Box
  style?: React.CSSProperties
  /** Largeur CSS de l'espace de page — voir `base` sur `Shot`. */
  base?: number
}> = ({ src, box, style, base = SHOT.w }) => {
  const asset = ASSETS[src]
  return (
    <div
      style={{
        position: 'absolute',
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
        overflow: 'hidden',
        ...style,
      }}
    >
      <Img
        src={shotFile(src)}
        style={{
          position: 'absolute',
          left: -box.x,
          top: -box.y,
          width: base,
          height: (asset.h / asset.w) * base,
          maxWidth: 'none',
        }}
      />
    </div>
  )
}

/**
 * Un rectangle pose en coordonnees de page : surlignage d'un bouton, masque
 * qui cache un etat, zone de frappe.
 */
export const Mark: React.FC<{
  box: Box
  style?: React.CSSProperties
  children?: React.ReactNode
}> = ({ box, style, children }) => (
  <div
    style={{
      position: 'absolute',
      left: box.x,
      top: box.y,
      width: box.w,
      height: box.h,
      ...style,
    }}
  >
    {children}
  </div>
)
