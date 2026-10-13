import React from 'react'
import { AbsoluteFill } from 'remotion'
import { EASE, lerp, pop } from '../components/anim'
import { DISPLAY, SANS } from '../fonts'
import { C, SAFE } from '../theme'
import { SHOT, SHOT_M, type Box } from '../spot/geometry'
import { clampBox } from '../spot/stage'

/**
 * La fenetre ou l'interface du site est montree.
 *
 * Une page de bureau de 1920 px de large etalee sur un cadre de 1080 n'en
 * montrerait que la colonne de gauche : elle vit donc dans une fenetre, et le
 * libelle du plan vit dessous. La fenetre est plus large que haute — c'est un
 * ecran d'ordinateur, et un cadre carre autour d'une barre de recherche fait
 * paraitre la barre deux fois plus petite qu'elle n'est.
 *
 * Les deux nombres tiennent dans la bande utile : 400 + 660 = 1060, le
 * libelle de 1130 a 1520, et la zone morte du bas commence a 1570.
 */
export const WIN = { x: 48, y: 400, w: 984, h: 660 } as const

/**
 * La fenetre large, pour le formulaire — et pour lui seul.
 *
 * Le tunnel de commande affiche d'abord un recapitulatif, puis les trois
 * champs, puis le bouton. Les champs font 1 120 px de large et le bloc utile
 * (de « Ou te livrer » au bouton) 540 px de haut : **aucun cadrage au rapport
 * de la fenetre carree ne peut contenir les champs en entier sans remonter
 * dans le recapitulatif**. Et le recapitulatif annonce un total de deux
 * maillots, alors que le film n'en a mis qu'un au panier.
 *
 * D'ou une fenetre plus large que haute sur ce plan : elle cadre la bande du
 * formulaire, et ce qui depasse sous le bouton montre le fond de la fenetre
 * — qui est deja, au pixel pres, la couleur du fond de la page. Le
 * changement de forme se lit comme un choix de montage — on passe d'un ecran
 * a une bande — et non comme une erreur.
 *
 * 560 de haut, et non 410 : a 410 la fenetre ne remplissait qu'un cinquieme
 * du cadre, et le plan avait l'air d'un timbre pose au milieu du noir.
 */
export const WIN_FILL = { x: 48, y: 470, w: 984, h: 560 } as const

/**
 * La fenetre du telephone — celle des trois plans de commande.
 *
 * Les deux fenetres ci-dessus cadrent une page de bureau de 1920 px de large.
 * Dans un 9:16 ca oblige a un recadrage si serre que le formulaire sortait a
 * 1 180 px de page pour 984 px de fenetre, soit 0,83x : les libelles des
 * champs tombaient a douze pixels de haut a l'ecran. C'est le defaut que ce
 * plan corrige, et il ne se corrige pas en zoomant — a ce rapport-la, zoomer
 * fait sortir du cadre les champs qu'on veut montrer.
 *
 * La capture de telephone fait 430 px de large. Dans cette fenetre elle est a
 * **2,09x** : un libelle de 16 px s'affiche a 33 px de haut, et les 480 px de
 * page visibles portent, pour le plan du formulaire, le total, les trois
 * champs et le bouton d'un seul tenant.
 *
 * La fenetre s'arrete a 1 100 px pour laisser le libelle a sa place
 * habituelle : les trois plans de commande ne changent pas la grammaire du
 * film, ils changent seulement ce qu'il y a dans la fenetre.
 */
export const WIN_PHONE = { x: 90, y: 270, w: 900, h: 1004 } as const

/** L'echelle a laquelle la fenetre du telephone montre la capture. */
export const PHONE_SCALE = WIN_PHONE.w / SHOT_M.w

/**
 * La hauteur de page visible dans la fenetre, en pixels CSS mobiles.
 *
 * Elle est constante parce que la largeur l'est : 1 004 / 2,09 = 480 px de
 * page a l'image, sur les 932 de l'ecran. Un plan choisit donc **ou** il
 * regarde, jamais de combien il serre.
 */
export const PHONE_VIEW_H = (WIN_PHONE.h / WIN_PHONE.w) * SHOT_M.w

/**
 * Un cadrage dans la fenetre du telephone : ou on regarde, et de combien on
 * serre.
 *
 * Sans largeur, c'est le cadrage **d'etablissement** — celui qui montre la
 * page telle qu'elle est : 430 px, donc 2,09x, donc 480 px de page visibles,
 * et un seul degre de liberte, le regard vertical, ce qui est exactement ce
 * qu'on fait d'un telephone.
 *
 * `page` vaut l'ecran entier et non la capture : les captures de telephone
 * sont des **vues de fenetre**, prises apres defilement, et `GM` est mesure
 * dans ce meme defilement. Les deux coincident donc au pixel, sans le pont
 * `scrollY` que le plan de bureau devait faire a la main.
 *
 * ---
 *
 * **Pourquoi la largeur est redevenue un parametre.**
 *
 * Elle ne l'etait pas, et la regle disait : « une capture d'ecran de
 * telephone se montre en entier dans sa largeur, ou pas du tout ». Elle
 * venait d'un vrai accident — un premier montage serrait a 338 px et sortait
 * « 7 50 » au bord du cadre, avec le monogramme coupe en face.
 *
 * Mais a 430 px de large, un libelle de 16 px sort a 33 px sur une image de
 * 1 920 : sur un telephone tenu en main, ca fait une douzaine de pixels
 * reels. Le plan qui porte toute la promesse — « trois champs, pas de
 * compte » — restait celui qu'on ne pouvait pas lire. La regle protegeait le
 * cadrage et perdait le texte.
 *
 * Ce qui la remplace n'est pas « serrer librement », c'est : **serrer sur ce
 * que le plan montre, et seulement quand ce qui compte y tient.** La
 * difference se decide ligne par ligne, et elle est deja dans la page :
 *
 *  - les **champs du formulaire** sont cales a gauche — libelle a x = 16,
 *    saisie a x = 28. Une fenetre de 300 px partant du bord gauche les porte
 *    en entier, a 3,0x. C'est 43 % de plus, et c'est la que la frappe se
 *    lit ;
 *  - la **liste de resultats** porte son prix cale **a droite**, et le
 *    bouton du panier vit dans le coin bas-droit. Ces moments-la restent a
 *    430 px — serrer dessus, c'est refaire l'accident de 2026-10-11.
 *
 * Donc : on serre pendant qu'un champ se remplit, on s'ouvre des qu'un bord
 * porte quelque chose. Le mouvement entre les deux n'est pas un effet, c'est
 * le regard de quelqu'un qui remplit un formulaire sur son telephone.
 */
export const framePhone = (cx: number, cy: number, w: number = SHOT_M.w): Box =>
  spanIn(WIN_PHONE, cx, cy, w, SHOT_M, false)

/** Un point de passage de la camera : ou elle regarde, et de combien elle serre. */
export type Look = { at: number; cx?: number; cy: number; w?: number }

/**
 * La camera d'un plan de commande, decrite par ses points de passage.
 *
 * Les trois valeurs — centre horizontal, centre vertical, largeur — sont
 * interpolees **separement** entre deux points. C'est ce qui permet de
 * descendre d'un champ au suivant sans rouvrir le cadre, puis de rouvrir sans
 * bouger le regard.
 *
 * `EASE.inOut` partout : une camera qui part sec ou qui s'arrete sec se
 * remarque, et ce qui doit se remarquer dans ces plans, c'est le champ qui se
 * remplit.
 */
export const track = (frame: number, looks: readonly Look[]): Box => {
  const w = (l: Look) => l.w ?? SHOT_M.w
  const cx = (l: Look) => l.cx ?? SHOT_M.w / 2
  const first = looks[0]
  const last = looks[looks.length - 1]
  if (frame <= first.at) return framePhone(cx(first), first.cy, w(first))
  if (frame >= last.at) return framePhone(cx(last), last.cy, w(last))
  for (let i = 0; i < looks.length - 1; i++) {
    const a = looks[i]
    const b = looks[i + 1]
    if (frame < a.at || frame > b.at) continue
    const span = [a.at, b.at] as const
    return framePhone(
      lerp(frame, span, [cx(a), cx(b)], EASE.inOut),
      lerp(frame, span, [a.cy, b.cy], EASE.inOut),
      lerp(frame, span, [w(a), w(b)], EASE.inOut),
    )
  }
  return framePhone(cx(last), last.cy, w(last))
}

/**
 * Le haut du libelle, sous la fenetre.
 *
 * La fenetre du telephone descend jusqu'a 1 274 ; le libelle se pose dessous,
 * et le bloc entier — fenetre plus libelle — est centre dans la bande sure
 * (250 a 1 570). Sans ca tout le film se tassait en haut et laissait six
 * cents pixels de vide sous le texte, juste la ou l'interface de TikTok ne
 * couvre rien.
 */
export const CAPTION_Y = 1300

/**
 * Une region de la page a cadrer, donnee par son centre et sa largeur.
 *
 * La hauteur suit le rapport de **la fenetre visee**, jamais celui du cadre :
 * un plan dit « cadre 448 px de page autour du champ de recherche », et la
 * fenetre decide du reste. C'est ce qui permet de faire varier le zoom sans
 * jamais deformer la capture.
 *
 * `clamp` ramene la region dans la page. Le formulaire s'en passe : sa
 * capture s'arrete 80 px sous le bouton, et ramener la region vers le haut y
 * ferait rentrer le recapitulatif — tout l'inverse du but.
 */
export const spanIn = (
  win: { w: number; h: number },
  cx: number,
  cy: number,
  w: number,
  page: { w: number; h: number } = SHOT,
  clamp = true,
): Box => {
  const h = (w * win.h) / win.w
  const box = { x: cx - w / 2, y: cy - h / 2, w, h }
  return clamp ? clampBox(box, page) : box
}

/** Le cadrage dans la fenetre standard. */
export const span = (
  cx: number,
  cy: number,
  w: number,
  page: { w: number; h: number } = SHOT,
): Box => spanIn(WIN, cx, cy, w, page)

/**
 * Le libelle d'un plan : un numero, un titre, une ligne.
 *
 * Toujours au meme endroit d'un plan a l'autre — c'est ce qui tient le
 * montage quand la camera, elle, bouge sans arret.
 */
export const Caption: React.FC<{
  index: string
  title: string
  line: string
  frame: number
  at: number
  /** Frame ou le libelle s'efface. Par defaut, il reste. */
  until?: number
}> = ({ index, title, line, frame, at, until }) => {
  const p = pop(frame, { delay: at, damping: 16, stiffness: 150 })
  const out = until === undefined ? 0 : lerp(frame, [until, until + 8], [0, 1], EASE.in)
  if (p <= 0.001) return null
  return (
    <div
      style={{
        position: 'absolute',
        left: WIN.x,
        right: WIN.x,
        top: CAPTION_Y,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        opacity: p * (1 - out),
        transform: `translateY(${(1 - p) * 30 - out * 22}px)`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
        <span
          style={{
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 30,
            letterSpacing: 3,
            color: C.primary,
          }}
        >
          {index}
        </span>
        <span style={{ fontFamily: DISPLAY, fontSize: 112, lineHeight: 0.9, color: C.fg }}>
          {title}
        </span>
      </div>
      <span
        style={{
          fontFamily: SANS,
          fontWeight: 500,
          fontSize: 38,
          lineHeight: 1.35,
          color: C.fg,
          marginTop: 14,
        }}
      >
        {line}
      </span>
    </div>
  )
}

/**
 * Le fond des plans d'interface : sobre, et immobile.
 *
 * Pendant ces plans, le mouvement est celui de la camera sur la page. Un fond
 * qui bouge en meme temps donnerait deux mouvements concurrents et plus
 * aucun des deux ne se lirait.
 */
export const UiBackdrop: React.FC<{ frame: number }> = ({ frame }) => (
  <AbsoluteFill style={{ background: C.bgDeep }}>
    <AbsoluteFill
      style={{
        background: `radial-gradient(110% 56% at 50% 34%, ${C.card} 0%, ${C.bg} 46%, ${C.bgDeep} 84%)`,
      }}
    />
    <AbsoluteFill
      style={{
        background: `radial-gradient(64% 36% at 50% ${
          ((WIN.y + WIN.h / 2) / 1920) * 100
        }%, ${C.primaryDeep}3A 0%, transparent 72%)`,
        opacity: lerp(frame, [0, 10], [0.5, 1]),
      }}
    />
    <AbsoluteFill
      style={{
        background: `radial-gradient(86% 76% at 50% 46%, transparent 44%, ${C.bgDeep}CC 100%)`,
      }}
    />
  </AbsoluteFill>
)

/**
 * L'ombre et le liseré de la fenetre, poses **derriere** elle.
 *
 * La fenetre elle-meme est en `overflow: hidden` pour rogner la capture :
 * une ombre portee dessus serait rognee avec. Elle est donc dessinee par un
 * bloc jumeau, une frame en arriere dans l'empilement.
 */
export const WindowShadow: React.FC<{
  frame: number
  at?: number
  win?: { x: number; y: number; w: number; h: number }
}> = ({ frame, at = 0, win = WIN }) => {
  const p = pop(frame, { delay: at, damping: 20, stiffness: 120 })
  return (
    <div
      style={{
        position: 'absolute',
        left: win.x,
        top: win.y,
        width: win.w,
        height: win.h,
        borderRadius: 26,
        background: C.bg,
        boxShadow: `0 54px 110px -28px rgba(0,0,0,0.92), 0 0 0 1px ${C.border}, 0 0 90px -20px ${C.primary}66`,
        opacity: lerp(p, [0, 0.3], [0, 1]),
      }}
    />
  )
}

/** Le repere « zone sure » du format vertical, pour les plans de controle. */
export const SAFE_BAND = SAFE

/**
 * Le grain. Fixe, jamais anime.
 *
 * Il n'est pas decoratif : un degrade sombre sur un fond aussi sombre se
 * decoupe en bandes des que l'encodeur travaille en 8 bits, et ce film est
 * fait de degrades sombres. Un grain tres fin casse les paliers.
 *
 * Un grain qui bouge d'une frame a l'autre est du bruit pur pour l'encodeur :
 * il coute des centaines de kilo-octets par seconde de debit et mange le
 * budget la ou il faudrait le mettre, sur les maillots.
 */
const GRAIN_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140">
       <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3"/>
       <feColorMatrix type="saturate" values="0"/></filter>
       <rect width="140" height="140" filter="url(#n)" opacity="0.5"/>
     </svg>`,
  )

export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.05 }) => (
  <AbsoluteFill
    style={{
      backgroundImage: `url("${GRAIN_URL}")`,
      backgroundSize: '140px',
      opacity,
      mixBlendMode: 'overlay',
    }}
  />
)
