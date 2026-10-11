import { useVideoConfig } from 'remotion'
import { SHOT, type Box } from './geometry'

/**
 * Un seul montage, trois formats.
 *
 * Le film n'est pas dessine en 1920x1080 puis rogne : chaque plan demande a
 * cadrer **une region reelle de la capture** (`fitBox`), et c'est le format
 * qui decide de l'echelle. Un bouton cadre serre reste cadre serre en 1:1 et
 * en 9:16 ; seule la quantite d'interface autour de lui change.
 *
 * Les blocs de texte, eux, se redimensionnent sur `u` : un titre a `80 * u`
 * occupe la meme part de la largeur dans les trois formats.
 */
export type Stage = {
  width: number
  height: number
  /** 16:9. */
  wide: boolean
  /** 1:1, a 5 % pres. */
  square: boolean
  /** 9:16. */
  tall: boolean
  /** Unite typographique. Vaut 1 en 1920x1080. */
  u: number
  /** Marge laterale. Rien de lisible ne la depasse. */
  pad: number
  /**
   * Bandes mortes des formats verticaux : l'interface de TikTok et des Reels
   * recouvre le haut et le bas de l'image.
   */
  safeTop: number
  safeBottom: number
  /** Centre optique de la bande utile — au-dessus du centre geometrique. */
  centerY: number
}

export const useStage = (): Stage => {
  const { width, height } = useVideoConfig()
  const ratio = width / height
  const wide = ratio > 1.2
  const tall = ratio < 0.85
  const square = !wide && !tall

  // La reference de largeur n'est pas la meme selon le format : en vertical,
  // un titre doit remplir 1080 px de large, pas en paraitre le quart.
  const u = width / (wide ? 1920 : tall ? 1120 : 1320)
  const pad = width * (wide ? 0.055 : 0.07)
  const safeTop = tall ? height * 0.13 : height * 0.06
  const safeBottom = tall ? height * 0.18 : height * 0.06

  return {
    width,
    height,
    wide,
    square,
    tall,
    u,
    pad,
    safeTop,
    safeBottom,
    centerY: safeTop + (height - safeTop - safeBottom) / 2,
  }
}

/* ------------------------------------------------------------------ boites */

export const box = (x: number, y: number, w: number, h: number): Box => ({ x, y, w, h })

/** Interpolation lineaire de deux cadrages — un mouvement de camera. */
export const lerpBox = (a: Box, b: Box, t: number): Box => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  w: a.w + (b.w - a.w) * t,
  h: a.h + (b.h - a.h) * t,
})

/** Elargit une boite de `m` pixels de chaque cote (ou d'un facteur si < 1). */
export const grow = (b: Box, m: number): Box => {
  const mx = m < 1 ? b.w * m : m
  const my = m < 1 ? b.h * m : m
  return { x: b.x - mx, y: b.y - my, w: b.w + mx * 2, h: b.h + my * 2 }
}

/** Le centre d'une boite. */
export const center = (b: Box) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 })

/** Reunit plusieurs boites. */
export const union = (...boxes: Box[]): Box => {
  const x = Math.min(...boxes.map((b) => b.x))
  const y = Math.min(...boxes.map((b) => b.y))
  const r = Math.max(...boxes.map((b) => b.x + b.w))
  const d = Math.max(...boxes.map((b) => b.y + b.h))
  return { x, y, w: r - x, h: d - y }
}

/**
 * L'echelle et la translation qui amenent `focus` (en pixels de la capture)
 * au centre du cadre.
 *
 * `cover` remplit l'image — rien du fond ne transparait, mais la region peut
 * deborder. `contain` garantit que toute la region est visible, avec `pad`
 * de marge relative.
 */
export const fitBox = (
  focus: Box,
  stage: Pick<Stage, 'width' | 'height'>,
  mode: 'cover' | 'contain' = 'cover',
  padding = 1,
) => {
  const sx = stage.width / focus.w
  const sy = stage.height / focus.h
  const scale = (mode === 'cover' ? Math.max(sx, sy) : Math.min(sx, sy)) * padding
  const c = center(focus)
  return { scale, cx: c.x, cy: c.y }
}

/** La page entiere, en pixels de capture. */
export const FULL: Box = { x: 0, y: 0, w: SHOT.w, h: SHOT.h }

/**
 * Une region d'interet exprimee par son centre et sa largeur ; la hauteur
 * suit le format courant.
 *
 * C'est la cle du multi-format : un plan dit « cadre 1 150 px de page autour
 * du champ de recherche », pas « cadre ce rectangle ». En 16:9 ca donne une
 * bande large, en 9:16 une region haute — dans les deux cas le sujet occupe
 * la meme part de l'image.
 */
export const spanBox = (
  cx: number,
  cy: number,
  w: number,
  stage: Pick<Stage, 'width' | 'height'>,
): Box => {
  const h = w * (stage.height / stage.width)
  return { x: cx - w / 2, y: cy - h / 2, w, h }
}

/**
 * Ou l'interface est montree a l'ecran, selon le format.
 *
 * En 16:9 elle occupe tout le cadre : c'est un ecran de bureau dans un cadre
 * de bureau. En 1:1 et en 9:16 elle devient une fenetre posee en haut, parce
 * qu'etaler une page de 1920 px sur un cadre de 1080 px de large n'en
 * montrerait que la colonne de gauche. Le texte du plan vit sous la fenetre.
 */
export const windowRect = (stage: Stage, share = 0.46, captionShare = 0.22) => {
  if (stage.wide) return undefined
  const w = stage.width - stage.pad * 2
  const h = stage.height * share
  const gap = stage.height * 0.05
  // La fenetre et son texte forment un bloc, et c'est le bloc qu'on centre
  // dans la bande utile. Poser la fenetre en haut laisserait un tiers de
  // l'image vide sous le texte.
  const usable = stage.height - stage.safeTop - stage.safeBottom
  const group = h + gap + stage.height * captionShare
  return {
    x: stage.pad,
    y: stage.safeTop + Math.max(0, (usable - group) / 2),
    w,
    h,
    gap,
  }
}

/**
 * Ramene un cadrage a l'interieur de la page.
 *
 * Une region centree sur le champ de recherche, elargie a la hauteur d'un
 * format vertical, deborde par le haut : le cadre montrait alors une bande
 * vide au-dessus de la page. Si la region tient dans la page, on la fait
 * glisser ; sinon on la centre, il n'y a rien de mieux a faire.
 */
export const clampBox = (b: Box, page: { w: number; h: number } = SHOT): Box => ({
  x: b.w <= page.w ? Math.min(Math.max(b.x, 0), page.w - b.w) : (page.w - b.w) / 2,
  y: b.h <= page.h ? Math.min(Math.max(b.y, 0), page.h - b.h) : (page.h - b.h) / 2,
  w: b.w,
  h: b.h,
})

/**
 * Estime la largeur d'un texte sans le mesurer.
 *
 * Remotion rend chaque frame dans un onglet neuf : mesurer le DOM demande un
 * `delayRender`, et une police qui arrive en retard donne une taille
 * differente d'une frame a l'autre. Une estimation a partir de l'avance
 * moyenne de la police est deterministe, donc toujours la meme a la frame
 * 120 qu'a la frame 121.
 *
 * Ratios releves sur les deux polices du projet, en capitales.
 */
export const ADVANCE = { display: 0.44, sans: 0.62, sansBody: 0.52 } as const

/** La plus grande taille a laquelle `text` tient dans `maxWidth`. */
export const fitText = (
  text: string,
  maxWidth: number,
  advance: number = ADVANCE.display,
  max = Infinity,
) => Math.min(max, maxWidth / Math.max(1, text.length * advance))
