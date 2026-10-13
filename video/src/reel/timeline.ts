import { G } from '../spot/geometry'
import { JERSEYS, type Jersey } from '../theme'

/**
 * Le montage du reel, en un seul endroit.
 *
 * 20 secondes, 30 fps, 600 frames. 120 BPM : un temps dure 15 frames, une
 * mesure 60. **Toutes les bornes sont des multiples de 30**, donc chaque
 * coupe tombe sur un temps fort ou sur le milieu de la mesure — jamais entre
 * deux. La musique est ecrite sur les memes nombres
 * (`scripts/make-reel-audio.mjs`) : deplacer une borne hors de cette grille
 * decolle le montage du son.
 */
export const FPS = 30
export const LEN = 660
export const BEAT = 15
export const BAR = 60

export const BEATS = {
  /**
   * 0. Le lion ouvre, et parle.
   *
   * **Une mesure exactement**, soixante frames. C'est la seule facon
   * d'inserer un plan sans toucher au reste : a 120 BPM une mesure dure deux
   * secondes, donc tout ce qui suit est decale d'un nombre entier de mesures
   * et retombe sur la meme phase musicale qu'avant. Un plan de 45 ou de 90
   * frames aurait oblige a reecrire chaque borne a la main.
   *
   * Il tient le cadre seul : c'est le seul moment du film ou rien d'autre
   * n'est a regarder, et c'est pour ca que la voix off commence ici. Elle
   * continue ensuite par-dessus les maillots et la commande, ou il n'y a plus
   * de place pour lui — les 350 px du bas sont manges par l'interface de
   * TikTok, et le reste du cadre porte le produit.
   */
  hook: [0, 60],
  /** 1. Trois maillots plein cadre, et leur prix. Pas de marque. */
  parade: [60, 210],
  /** 2. « barca » trouve le FC Barcelone. */
  search: [210, 270],
  /** 3. La taille, puis le panier. */
  pick: [270, 330],
  /** 4. Trois champs, et le bouton. */
  fill: [330, 450],
  /** 5. C'est commande — et il n'y a rien a payer. */
  done: [450, 540],
  /**
   * 6. La signature — le seul plan de marque du film.
   *
   * Elle y arrive **en grand** pour la premiere fois. Le mot-symbole se voit
   * bien avant, mais a l'interieur de l'interface : sur telephone la barre de
   * recherche est posee sous l'en-tete, et cadrer l'une sans l'autre est
   * impossible. Un logo de trente pixels dans une capture n'est pas une
   * revelation de marque — c'est le site, et le montrer entier est justement
   * le propos de ces plans-la.
   */
  endcard: [540, 660],
} as const

export type BeatName = keyof typeof BEATS
export const at = (b: BeatName) => BEATS[b][0]
export const len = (b: BeatName) => BEATS[b][1] - BEATS[b][0]

/** Les coupes, hors la premiere : c'est la que passent les souffles. */
export const CUT_FRAMES = [
  BEATS.parade[0],
  BEATS.search[0],
  BEATS.pick[0],
  BEATS.fill[0],
  BEATS.done[0],
  BEATS.endcard[0],
]

/* ------------------------------------------------------------- la parade */

/**
 * Les trois maillots d'ouverture.
 *
 * **Rien d'autre que des maillots pendant cinq secondes**, et le prix sur
 * chacun. Personne ne connait DakarKits : une marque posee a la frame 0 ne
 * dit rien a personne, un maillot et un montant disent tout. La marque attend
 * le carton de fin.
 *
 * L'ordre n'est pas esthetique. Le Senegal d'abord, parce que le film se
 * regarde a Dakar. Le Barca en dernier, parce que le plan suivant tape
 * « barca » dans la recherche : le maillot ne disparait pas, il devient le
 * resultat. C'est la seule coupe du film qui raconte quelque chose.
 */
const pick = (team: string): Jersey => {
  const found = JERSEYS.find((j) => j.team === team)
  if (!found) throw new Error(`maillot introuvable : ${team}`)
  return found
}

export type ParadeShot = {
  jersey: Jersey
  /** Le nom affiche. Court : a cette vitesse, une ligne de plus ne se lit pas. */
  label: string
  /** Le halo derriere le maillot, repris de ses propres couleurs. */
  halo: string
  /** Frame d'entree, relative au plan. */
  at: number
  /** Le maillot entre par la droite ou par la gauche. */
  dir: 1 | -1
}

export const PARADE: ParadeShot[] = [
  { jersey: pick('Sénégal'), label: 'SÉNÉGAL', halo: '#1FA866', at: 0, dir: 1 },
  { jersey: pick('Maroc'), label: 'MAROC', halo: '#C8102E', at: 45, dir: -1 },
  { jersey: pick('FC Barcelone'), label: 'FC BARCELONE', halo: '#4B6BD6', at: 90, dir: 1 },
]

/**
 * Le maillot que le film designe.
 *
 * C'est le dernier de la parade, et ce n'est pas un hasard : le plan suivant
 * tape « barca » dans la recherche. Les accroches de `hooks/Shock.tsx`
 * ouvrent sur **le meme**, par la fin de la liste et non par une constante a
 * elles — si l'ordre de la parade change un jour, l'accroche suit, et le
 * raccord « barca » reste celui qu'on vient de montrer.
 */
export const HERO = PARADE[PARADE.length - 1]

/** La frame ou l'offre se pose sur le troisieme maillot. */
export const OFFER_AT = 104

/* ----------------------------------------------------------------- texte */

/**
 * Le texte. Francais, et uniquement ce que le site dit vraiment : les prix,
 * la phrase du pack et les libelles sont ceux de louyomb.com, releves a la
 * capture du 2026-10-11 (`assets/manifest.json`).
 *
 * Jamais « officiel » ni « authentique » — regle du projet, et la raison pour
 * laquelle ce film ne montre que nos propres photos.
 */
export const COPY = {
  /**
   * Le nombre de maillots vient de la capture, pas d'ici : le premier film
   * annoncait « +20 maillots » pour 13 publies, et le catalogue a bouge deux
   * fois depuis. Une seule source, et elle est relevee sur le site.
   *
   * Le « + » n'est pas un arrondi vers le haut, c'est l'inverse : il fait du
   * nombre releve un **plancher**. Le catalogue grossit, le film ne bouge
   * pas ; « 32 maillots » devient faux des le trente-troisieme publie, alors
   * que « +32 » reste vrai tant que rien n'est depublie. C'est la seule
   * direction dans laquelle une annonce chiffree peut vieillir sans mentir —
   * et c'est pour l'avoir prise a l'envers que le premier film annoncait plus
   * de maillots qu'il n'y en avait.
   */
  count: '+' + G.home.countText.replace(/\D/g, ''),
  from: '7 500',

  /**
   * L'accroche, dite par le lion et ecrite au-dessus de lui.
   *
   * Les deux lignes reprennent **mot pour mot** le debut de la voix off. Un
   * texte qui dit autre chose que ce qu'on entend force a lire et a ecouter
   * deux choses a la fois, et on ne retient ni l'une ni l'autre — alors que
   * la meme phrase lue et entendue ensemble s'imprime deux fois.
   */
  hook: {
    title: 'TON MAILLOT',
    line: 'Livré à Dakar. Payé à la livraison.',
  },

  search: {
    index: '01',
    title: 'CHERCHE',
    line: 'Tape « barca ». Il trouve Barcelone.',
  },
  pick: {
    index: '02',
    title: 'CHOISIS',
    line: 'Ta taille, avec le vrai stock.',
  },
  fill: {
    index: '03',
    title: 'COMMANDE',
    line: 'Trois champs. Pas de compte.',
  },

  /**
   * Le recapitulatif de la capture `m-form-bottom` : un seul maillot, FC
   * Barcelone a 7 500 F, livraison gratuite, 7 500 F a payer a la livraison.
   * Le montant est **celui que la capture affiche** — le film ne recalcule
   * rien, il lirait faux.
   *
   * Il valait 17 500 F tant que les plans de commande etaient montes sur les
   * captures de bureau : ce panier-la contenait deux maillots, parce que le
   * meme parcours de capture sert aussi a montrer le pack. Le film, lui, n'en
   * met qu'un au panier. Le plan de bureau devait donc cadrer sous le
   * recapitulatif pour ne pas afficher un total qui ne correspondait a rien
   * de ce qu'on venait de voir ; le plan telephone montre le sien, qui est le
   * bon.
   */
  done: {
    kicker: 'C’est commandé',
    total: '7 500',
    now: 'Rien à payer maintenant',
    terms: 'Wave, Orange Money ou espèces à la livraison',
    delay: 'Livré en 24/48h à Dakar',
  },

  /** Releve sur la fiche produit (`d-pack`). */
  pack: '2 maillots au choix pour 13 000 F',

  endcard: {
    url: 'LOUYOMB.COM',
    /**
     * Sur un post organique, une adresse ecrite ne se clique pas : il faut
     * dire ou aller la chercher, et les deux endroits ou le lien existe
     * vraiment sont la bio et la description.
     *
     * En publicite, le bouton de la plateforme porte le lien : repeter
     * « lien en bio » y est au mieux inutile, au pire une raison de refus.
     */
    bio: 'Lien en bio et en description',
    ad: 'Livraison gratuite à Dakar',
  },
} as const

/* -------------------------------------------------------------- la voix */

/**
 * La frame ou la voix off demarre.
 *
 * **La meme pour les trois accroches**, et c'est ce qui permet de n'avoir
 * qu'un nombre ici. Elle part a la huitieme frame du plan d'accroche : sur
 * l'accroche au lion, il a le temps d'entrer dans le cadre et d'etre vu avant
 * d'ouvrir la bouche — un personnage qui parle avant d'etre installe donne
 * l'impression que le son est en avance sur l'image. Sur les accroches du
 * choc, le maillot a claque et le montant est pose.
 *
 * **Sa duree, elle, n'est pas ici** : les trois voix font 367, 372 et 428
 * frames (`VO` dans `vo-envelope.ts`). Elles s'arretent donc entre la frame
 * 375 et la frame 436, c'est-a-dire toutes pendant le plan du formulaire. La
 * fin du film se joue sans parole : la coche, la signature et l'adresse n'ont
 * besoin de personne pour les dire.
 *
 * Le lion n'est a l'ecran que pour l'accroche — et seulement sur la sienne —
 * et pour le carton de fin. Entre les deux la voix continue seule, par-dessus
 * les maillots et la commande : un presentateur qui ouvre, le produit qui
 * parle, le presentateur qui signe.
 */
export const VO_AT = 8

/** Les variantes de carton de fin. */
export type Cta = 'organic' | 'ads'
