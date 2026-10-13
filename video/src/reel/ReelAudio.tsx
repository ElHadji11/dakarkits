import React from 'react'
// `Audio` de `remotion` est deprecie depuis la 4.0.5xx au profit de celui de
// `@remotion/media`, qui decode hors du fil principal.
import { Audio } from '@remotion/media'
import { Sequence, staticFile } from 'remotion'
import { lerp } from '../components/anim'
import { HOOKS, type HookName } from './hooks'
import { BEATS, CUT_FRAMES, PARADE, VO_AT } from './timeline'
import { VO } from './vo-envelope'

/**
 * Le dosage, en un seul endroit.
 *
 * **Ce film s'entend seul.** Les deux precedents melangeaient leur lit a 0,6
 * d'un fichier deja calibre pour passer sous une voix off : crete reelle vers
 * -13 dBFS, RMS vers -25, soit un fichier dont on dit en toute bonne foi
 * qu'il « n'a pas de son ». La voix off n'a jamais ete enregistree. Le lit
 * sort donc a -4 dBFS crete (`make-reel-audio.mjs`) et passe ici a 0,84.
 *
 * Les valeurs ont ete reglees **sur le rendu, pas a l'oreille** : a 0,92 le
 * fichier sortait a -1,0 dBFS crete, ce qui ecrete a la premiere conversion.
 * Le reglage ci-dessous tient le melange sous -3 dBFS crete tout en restant
 * environ sept decibels au-dessus de l'ancien (RMS -18 contre -25).
 *
 * Si une voix off arrive un jour, c'est **ce nombre-la** qu'on baisse, pas le
 * fichier qu'on regenere.
 *
 * Les bruitages ne sont pas poses « a peu pres sur la musique » : chaque clic
 * est a la frame ou le curseur enfonce le bouton dans `scenes/Order.tsx`, et
 * ces frames-la tombent sur des temps. Decaler un clic d'une frame s'entend.
 */
export const MIX = {
  /**
   * La voix off est arrivee — donc c'est **ce nombre** qui baisse, comme
   * annonce ci-dessus, et pas le fichier qui se regenere.
   *
   * 0,84 -> 0,52 pendant que le lion parle, et 0,84 des qu'il se tait. Le
   * creux est fait par `MUSIC_DUCK` plus bas : baisser le lit sur toute la
   * duree du film couterait les sept decibels qu'on venait d'aller chercher,
   * alors que seules douze des vingt-deux secondes portent une voix.
   */
  music: 0.84,
  /** Le lit pendant la voix off. */
  musicDucked: 0.52,
  voice: 1,
  whip: 0.4,
  click: 0.58,
  key: 0.38,
  impact: 0.4,
  tick: 0.32,
  pop: 0.32,
  ding: 0.4,
} as const

const file = (name: string) => staticFile(`audio/${name}.wav`)

/**
 * Le fouette culmine au milieu de son fichier, pas a son debut : il part cinq
 * frames avant la coupe pour que son sommet tombe exactement dessus.
 */
const WHIP_LEAD = 5

/** Les clics, en frames absolues — les memes nombres que les curseurs. */
const CLICKS = [
  BEATS.search[0] + 8, // le champ de recherche
  BEATS.search[0] + 46, // le resultat « FC Barcelone »
  BEATS.pick[0] + 16, // la taille M
  BEATS.pick[0] + 42, // Ajouter au panier
  BEATS.fill[0] + 10, // Nom complet
  BEATS.fill[0] + 34, // Telephone
  BEATS.fill[0] + 56, // Adresse
  BEATS.fill[0] + 100, // Confirmer ma commande
]

/**
 * La frappe. Une touche sur deux seulement : a trente caracteres par seconde,
 * toutes les poser donne un gresillement, pas une frappe — et une cinquantaine
 * de pistes audio de plus a melanger.
 */
const keysFor = (from: number, count: number, per: number) =>
  Array.from({ length: Math.ceil(count / 2) }, (_, i) => Math.round(from + i * 2 * per))

const KEYS = [
  ...keysFor(BEATS.search[0] + 12, 5, 2), // « barca »
  ...keysFor(BEATS.fill[0] + 13, 12, 1.1), // Fatou Ndiaye
  ...keysFor(BEATS.fill[0] + 37, 12, 1.1), // 77 123 45 67
  ...keysFor(BEATS.fill[0] + 59, 23, 0.9), // l'adresse
]

/**
 * Le cliquetis des compteurs de prix. Un par maillot de la parade : les roues
 * partent quatre frames apres l'entree et se posent une vingtaine de frames
 * plus tard. Il s'arrete quand le montant se pose, sinon on entend le prix
 * continuer a defiler alors qu'il est deja lisible.
 */
const TICKS = PARADE.flatMap((shot) =>
  Array.from({ length: 7 }, (_, i) => shot.at + 4 + i * 2),
)

/**
 * Le creux du lit sous la voix, en frames.
 *
 * Il descend en dix frames avant la premiere syllabe et remonte en vingt
 * apres la derniere : une musique qui retombe d'un coup s'entend comme une
 * coupure, une musique qui remonte lentement s'entend comme un retour.
 */
const DUCK_IN = 10
const DUCK_OUT = 20

/**
 * Le volume du lit, frame par frame.
 *
 * `volume` accepte une fonction de la frame — c'est ce qui permet de creuser
 * sous la voix sans decouper la musique en plusieurs `Sequence`, ce qui
 * s'entendrait a chaque raccord.
 */
const musicVolume = (voFrames: number) => (f: number) => {
  const start = VO_AT
  const end = VO_AT + voFrames
  if (f <= start - DUCK_IN || f >= end + DUCK_OUT) return MIX.music
  if (f < start) return lerp(f, [start - DUCK_IN, start], [MIX.music, MIX.musicDucked])
  if (f <= end) return MIX.musicDucked
  return lerp(f, [end, end + DUCK_OUT], [MIX.musicDucked, MIX.music])
}

/**
 * Le son suit l'accroche.
 *
 * Deux choses en dependent, et une seule saute aux oreilles. Le **lit
 * musical** change de caractere avec l'ouverture (`hooks/index.ts`) : le
 * lion ouvre sur une nappe qui s'installe, le choc du prix ouvre sur un coup.
 * La **voix** change avec lui, puisque ses premiers mots sont ceux qui sont
 * ecrits a l'image.
 *
 * Et la troisieme, celle qu'on oublie : les trois voix n'ont pas la meme
 * duree — 367, 372 et 428 frames. Le creux du lit est donc calcule sur la
 * voix du film qu'on rend, jamais sur une constante. Avec un nombre fige, la
 * version la plus longue garderait sa musique a plein volume sous ses deux
 * dernieres secondes de parole.
 */
export const ReelAudio: React.FC<{ hook: HookName }> = ({ hook }) => {
  const vo = VO[HOOKS[hook].vo]
  return (
  <>
    <Audio src={file(HOOKS[hook].music)} volume={musicVolume(vo.frames)} />

    {/* La voix. Elle couvre l'accroche, les maillots et la commande ;
        la fin du film se joue sans parole. */}
    <Sequence from={VO_AT} name="voix off">
      <Audio src={staticFile(vo.file)} volume={MIX.voice} />
    </Sequence>

    {CUT_FRAMES.map((at) => (
      <Sequence key={`w-${at}`} from={at - WHIP_LEAD} name={`fouette ${at}`}>
        <Audio src={file('whip')} volume={MIX.whip} />
      </Sequence>
    ))}

    {TICKS.map((at) => (
      <Sequence key={`t-${at}`} from={at} name={`tic ${at}`}>
        <Audio src={file('tick')} volume={MIX.tick} />
      </Sequence>
    ))}

    {CLICKS.map((at) => (
      <Sequence key={`c-${at}`} from={at} name={`clic ${at}`}>
        <Audio src={file('click')} volume={MIX.click} />
      </Sequence>
    ))}

    {KEYS.map((at) => (
      <Sequence key={`k-${at}`} from={at} name={`touche ${at}`}>
        <Audio src={file('key')} volume={MIX.key} />
      </Sequence>
    ))}

    {/* La pastille du panier qui passe a 1. */}
    <Sequence from={BEATS.pick[0] + 43} name="pop panier">
      <Audio src={file('pop')} volume={MIX.pop} />
    </Sequence>

    {/* La commande part : l'impact est sur la coupe, la cloche sur la coche
        qui se referme douze frames plus tard. */}
    <Sequence from={BEATS.done[0]} name="impact commande">
      <Audio src={file('impact')} volume={MIX.impact} />
    </Sequence>
    <Sequence from={BEATS.done[0] + 22} name="ding coche">
      <Audio src={file('ding')} volume={MIX.ding} />
    </Sequence>

    {/* La signature : la cloche sur le monogramme qui se remplit. */}
    <Sequence from={BEATS.endcard[0] + 20} name="ding signature">
      <Audio src={file('ding')} volume={MIX.ding} />
    </Sequence>
  </>
  )
}
