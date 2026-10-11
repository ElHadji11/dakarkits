/**
 * Le montage et le texte du spot, en un seul endroit.
 *
 * 20 secondes, 30 fps, 600 frames. 120 BPM : un temps dure 15 frames, une
 * mesure 60. **Toutes les bornes ci-dessous sont des multiples de 30**, donc
 * chaque coupe tombe sur un temps fort ou sur le milieu de la mesure — jamais
 * entre deux. Deplacer une borne hors de cette grille desynchronise le
 * montage de la musique, qui est ecrite sur les memes nombres
 * (`scripts/make-spot-audio.mjs`).
 */
export const FPS = 30
export const LEN = 600
export const BEAT = 15
export const BAR = 60

export const BEATS = {
  /** 1. L'accroche : le probleme en cinq mots. */
  hook: [0, 90],
  /** 2. Le produit arrive, l'interface se monte piece par piece. */
  assemble: [90, 210],
  /** 3. Trois fonctions, trois gestes reels du curseur. */
  f1: [210, 270],
  f2: [270, 330],
  f3: [330, 390],
  /** 4. Le chiffre qui prouve. */
  metric: [390, 480],
  /** 5. Signature et appel a l'action. */
  lockup: [480, 600],
} as const

export type BeatName = keyof typeof BEATS
export const at = (b: BeatName) => BEATS[b][0]
export const len = (b: BeatName) => BEATS[b][1] - BEATS[b][0]

/** Les coupes, hors la premiere : c'est la que passent les souffles. */
export const CUT_FRAMES = [90, 210, 270, 330, 390, 480]

/**
 * Le texte. Francais, et uniquement ce que le site dit vraiment : les prix,
 * la phrase du pack et les libelles sont ceux releves sur louyomb.com le
 * 2026-10-11 (`assets/manifest.json`).
 *
 * Jamais « officiel » ni « authentique » — regle du projet, et la raison pour
 * laquelle ce film ne montre que nos propres photos.
 */
export const COPY = {
  /** Cinq mots. Le probleme, pas le produit. */
  hook: ['UN', 'MAILLOT', 'NEUF', 'TROP', 'CHER'],
  /** Les trois premiers tiennent la ligne, les deux derniers la frappent. */
  hookSplit: 3,

  assemble: {
    url: 'louyomb.com',
    kicker: 'La boutique',
    /**
     * Le nombre de maillots **n'est pas ecrit ici**. Les formats verticaux
     * l'affichent en gros a cote de la pastille du site qui dit la meme
     * chose : deux sources pour un meme nombre divergent le jour ou le
     * catalogue bouge. Il vient de `G.home.countText`, relevé a la capture.
     *
     * Le premier film porte deja cette dette — il annonce « +20 maillots »
     * pour 13 publies.
     */
  },

  features: [
    {
      index: '01',
      title: 'CHERCHE',
      line: 'Tape « barca ». Il trouve Barcelone.',
      tag: 'Recherche instantanée',
    },
    {
      index: '02',
      title: 'CHOISIS',
      line: 'Ta taille, avec le vrai stock.',
      // Pas « S épuisé » : sur ce maillot-la, les cinq tailles sont
      // disponibles. Le site grise les tailles epuisees — c'est la fonction
      // qu'on annonce, pas l'etat d'un maillot qui changera demain.
      tag: 'Une taille épuisée est grisée',
    },
    {
      index: '03',
      title: 'COMMANDE',
      line: 'Trois champs. Pas de compte.',
      tag: 'Paiement à la livraison',
    },
  ],

  /**
   * Le chiffre qui prouve : le panier de la capture. Sous-total 15 500 F,
   * remise pack -2 500 F, a payer 13 000 F. Tout vient de `d-cart-2`.
   */
  metric: {
    from: 15500,
    to: 13000,
    label: 'À payer à la livraison',
    note: 'deux maillots, livraison comprise',
    unit: 'soit 6 500 F le maillot',
  },

  lockup: {
    mark: 'DAKARKITS',
    url: 'louyomb.com',
    cta: 'Commande en trois champs',
    terms: 'Paiement à la livraison · Livraison gratuite à Dakar',
  },
} as const

/** Les mots de l'accroche tombent un par temps. */
export const HOOK_WORD_AT = (i: number) => i * BEAT
