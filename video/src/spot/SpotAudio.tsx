import React from 'react'
// `Audio` de `remotion` est deprecie depuis la 4.0.5xx au profit de celui de
// `@remotion/media`, qui decode hors du fil principal.
import { Audio } from '@remotion/media'
import { Sequence, staticFile } from 'remotion'
import { BEATS, CUT_FRAMES } from './timeline'

/**
 * Le dosage, en un seul endroit.
 *
 * Les bruitages ne sont pas poses « a peu pres sur la musique » : chaque clic
 * est a la frame ou le curseur enfonce le bouton dans `Features.tsx`, et ces
 * frames-la tombent sur des temps. Decaler un clic d'une frame s'entend.
 *
 * La musique reste basse : elle est faite pour passer **sous** une voix off
 * ajoutee plus tard, sans re-encoder ce fichier.
 */
export const MIX = {
  music: 0.6,
  whoosh: 0.42,
  click: 0.75,
  key: 0.5,
  impact: 0.62,
  tick: 0.4,
  pop: 0.38,
  ding: 0.45,
} as const

const file = (name: string) => staticFile(`audio/${name}.wav`)

/**
 * Le souffle culmine au milieu de son fichier : il part six frames avant la
 * coupe pour que son sommet tombe exactement dessus.
 */
const WHOOSH_LEAD = 6

/** Les clics, en frames absolues — les memes nombres que les curseurs. */
const CLICKS = [
  BEATS.f1[0] + 10, // le champ de recherche
  BEATS.f1[0] + 44, // le resultat « Barcelona »
  BEATS.f2[0] + 14, // la taille M
  BEATS.f2[0] + 36, // Ajouter au panier
  BEATS.f3[0] + 8, // Nom complet
  BEATS.f3[0] + 22, // Telephone
  BEATS.f3[0] + 34, // Adresse
  BEATS.f3[0] + 54, // Confirmer ma commande
]

/**
 * La frappe. Une touche sur deux seulement : a trente caracteres par
 * seconde, toutes les poser donne un grésillement, pas une frappe — et
 * quarante-six pistes audio de plus a melanger.
 */
const keysFor = (from: number, count: number, per: number) =>
  Array.from({ length: Math.ceil(count / 2) }, (_, i) => Math.round(from + i * 2 * per))

const KEYS = [
  ...keysFor(BEATS.f1[0] + 16, 5, 2), // « barca »
  ...keysFor(BEATS.f3[0] + 10, 12, 1), // Fatou Ndiaye
  ...keysFor(BEATS.f3[0] + 24, 12, 1), // 77 123 45 67
  ...keysFor(BEATS.f3[0] + 36, 22, 0.8), // l'adresse
]

/** Le cliquetis du compteur, tant que les chiffres defilent. */
const TICKS = Array.from({ length: 18 }, (_, i) => BEATS.metric[0] + 4 + i * 2)

export const SpotAudio: React.FC = () => (
  <>
    <Audio src={file('spot-music')} volume={MIX.music} />

    {CUT_FRAMES.map((at) => (
      <Sequence key={`w-${at}`} from={at - WHOOSH_LEAD} name={`whoosh ${at}`}>
        <Audio src={file('whoosh')} volume={MIX.whoosh} />
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

    {TICKS.map((at) => (
      <Sequence key={`t-${at}`} from={at} name={`tic ${at}`}>
        <Audio src={file('tick')} volume={MIX.tick} />
      </Sequence>
    ))}

    {/* Le chiffre se pose : l'impact est sur la frame ou il arrete de
        defiler, pas sur la coupe. */}
    <Sequence from={BEATS.metric[0] + 42} name="impact du chiffre">
      <Audio src={file('impact')} volume={MIX.impact} />
    </Sequence>

    {/* La pastille du panier qui passe a 1. */}
    <Sequence from={BEATS.f2[0] + 37} name="pop panier">
      <Audio src={file('pop')} volume={MIX.pop} />
    </Sequence>

    {/* La signature : la cloche sur le monogramme. */}
    <Sequence from={BEATS.lockup[0] + 16} name="ding signature">
      <Audio src={file('ding')} volume={MIX.ding} />
    </Sequence>
  </>
)
