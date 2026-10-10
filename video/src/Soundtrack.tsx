import React from 'react'
// `Audio` de `remotion` est déprécié depuis la 4.0.5xx au profit de celui de
// `@remotion/media`, qui décode hors du fil principal.
import { Audio } from '@remotion/media'
import { Sequence, staticFile } from 'remotion'
import { CUTS } from './theme'

/**
 * Le dosage, en un seul endroit.
 *
 * La musique est volontairement basse : elle est faite pour passer **sous**
 * une voix off ajoutée plus tard. Le lit seul tient autour de -25 dBFS RMS.
 *
 * Mesuré sur le rendu : crête -6 dBFS, atteinte sur la cloche de
 * « LIVRAISON GRATUITE ». Il reste donc six décibels de marge pour poser une
 * voix par-dessus sans toucher à ce fichier.
 *
 * Pour remesurer, parcours les chunks RIFF du WAV au lieu de supposer un
 * en-tête de 44 octets : ffmpeg insère un chunk LIST, et lire à 44 donne de
 * l'en-tête pris pour du son — donc une fausse crête à -0,6 dBFS et un clic
 * imaginaire à t=0.
 */
export const MIX = {
  music: 0.55,
  whoosh: 0.5,
  pop: 0.42,
  tick: 0.5,
  ding: 0.5,
} as const

const file = (name: string) => staticFile(`audio/${name}.wav`)

/** Les coupes, hors la première : c'est là que passent les souffles. */
const CUT_FRAMES = [
  CUTS.catalogue[0],
  CUTS.price[0],
  CUTS.experience[0],
  CUTS.delivery[0],
  CUTS.lockup[0],
]

/**
 * Le souffle culmine au milieu de son fichier, pas à son début : il faut
 * donc le lancer six frames avant la coupe pour que son sommet tombe
 * exactement dessus.
 */
const WHOOSH_LEAD = 6

/** Pastilles et puces qui apparaissent — un « pop » sur chacune. */
const POPS = [
  CUTS.catalogue[0] + 32, // « MAILLOTS » sous le compteur
  CUTS.price[0] + 18, // la pastille -25 %
  CUTS.price[0] + 48, // les trois puces de conditions
  CUTS.price[0] + 53,
  CUTS.price[0] + 58,
  CUTS.experience[0] + 44, // les trois chiffres
  CUTS.experience[0] + 52,
  CUTS.experience[0] + 57,
  CUTS.lockup[0] + 8, // l'adresse
  CUTS.lockup[0] + 20, // « Lien dans la bio »
  CUTS.lockup[0] + 30, // « Commande en 30 secondes »
]

/**
 * Le cliquetis du compteur. Une frappe toutes les deux frames pendant que
 * les roues tournent — il s'arrête quand le montant se pose, sinon on
 * entend le prix continuer à défiler alors qu'il est déjà lisible.
 */
const TICK_FROM = CUTS.price[0] + 18
const TICK_TO = CUTS.price[0] + 52
const TICKS = Array.from(
  { length: Math.floor((TICK_TO - TICK_FROM) / 2) },
  (_, i) => TICK_FROM + i * 2,
)

export const Soundtrack: React.FC = () => (
  <>
    <Audio src={file('music')} volume={MIX.music} />

    {CUT_FRAMES.map((at) => (
      <Sequence key={`w-${at}`} from={at - WHOOSH_LEAD} name={`whoosh ${at}`}>
        <Audio src={file('whoosh')} volume={MIX.whoosh} />
      </Sequence>
    ))}

    {TICKS.map((at) => (
      <Sequence key={`t-${at}`} from={at} name={`tick ${at}`}>
        <Audio src={file('tick')} volume={MIX.tick} />
      </Sequence>
    ))}

    {POPS.map((at) => (
      <Sequence key={`p-${at}`} from={at} name={`pop ${at}`}>
        <Audio src={file('pop')} volume={MIX.pop} />
      </Sequence>
    ))}

    {/* « LIVRAISON GRATUITE » : la cloche tombe sur le premier mot. */}
    <Sequence from={CUTS.delivery[0] + 1} name="ding">
      <Audio src={file('ding')} volume={MIX.ding} />
    </Sequence>
  </>
)
