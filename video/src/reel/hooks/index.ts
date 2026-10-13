import type React from 'react'
import { LionHook } from './Lion'
import { MarketHook, PriceHook } from './Shock'
import type { VoName } from '../vo-envelope'

/**
 * Les accroches — la seule chose qui change d'une version du film a l'autre.
 *
 * Le reel est un montage de sept plans dont **six sont fixes** : la parade,
 * les trois plans de commande, la commande passee, la signature. Ils disent
 * ce que vend la boutique et comment on y commande, et ca ne depend pas de la
 * facon dont le film ouvre. Seules les deux premieres secondes decident si le
 * pouce s'arrete, et ce sont elles qu'on teste.
 *
 * D'ou ce registre : une accroche est un plan de **60 frames exactement**
 * (une mesure a 120 BPM), une voix off, et un lit musical. Changer
 * d'accroche ne deplace aucune borne de `timeline.ts`, ne retouche aucune
 * animation, et ne demande pas de relire le reste du film.
 *
 * **Si une accroche future dure autre chose que 60 frames**, toutes les
 * coupes suivantes changent de phase musicale et le montage se decolle du
 * son. Une mesure, ou un multiple entier de mesures, et rien d'autre.
 */
export type HookName = 'lion' | 'price' | 'market'

export type HookDef = {
  /** Le plan d'accroche. Exactement 60 frames. */
  Comp: React.FC
  /**
   * La voix off du film, dans `public/audio/vo-<nom>.mp3`.
   *
   * Elle n'est pas « la voix de l'accroche » : elle couvre l'accroche, la
   * parade et la commande. Mais ses premiers mots sont **ceux qui sont
   * ecrits a l'image** dans les deux premieres secondes — un texte qui dit
   * autre chose que ce qu'on entend force a lire et a ecouter deux choses a
   * la fois. Changer l'accroche change donc la voix entiere.
   */
  vo: VoName
  /** Le lit musical, dans `public/audio/<nom>.wav`. */
  music: 'reel-music' | 'reel-music-shock'
  /** Ce que le fichier rendu s'appelle. */
  slug: string
}

export const HOOKS: Record<HookName, HookDef> = {
  /** A — le lion ouvre et parle. Le premier montage. */
  lion: { Comp: LionHook, vo: 'lion', music: 'reel-music', slug: 'reel' },
  /** B — le maillot claque, 7 500 F, rien d'autre. */
  price: { Comp: PriceHook, vo: 'price', music: 'reel-music-shock', slug: 'reel-prix' },
  /** C — arrete de payer 15 000 F. */
  market: { Comp: MarketHook, vo: 'market', music: 'reel-music-shock', slug: 'reel-marche' },
}
