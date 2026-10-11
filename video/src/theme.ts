import { staticFile } from 'remotion'

/**
 * Cosmic Night, en sombre — les mêmes valeurs que l'app en marche.
 * Satori, les SVG statiques et Remotion ne lisent pas les variables CSS du
 * thème : comme `app/icon.svg`, ce fichier en garde une copie. Si le thème
 * bouge, il ne suivra pas tout seul.
 *
 * Vérifiées le 2026-10-11 sur louyomb.com en production. Le navigateur rend
 * ces variables en `lab()` : pour les relire, lui faire faire la conversion
 * (`ctx.fillStyle = …` puis `getImageData`, comme dans `capture.mjs`) plutôt
 * que de convertir soi-même — une conversion Lab→sRGB faite à la main s'est
 * trompée de deux à trois points sur chaque canal, assez pour que le violet
 * du film ne soit plus celui du site.
 *
 * `field` est le fond des champs de saisie : le film doit pouvoir effacer le
 * texte d'invite d'un champ capturé vide avant d'y poser sa frappe.
 */
export const C = {
  bg: '#0F0F1A',
  bgDeep: '#07070E',
  card: '#1A1A2E',
  cardHi: '#222244',
  border: '#303052',
  field: '#2E2E53',
  fg: '#E2E2F5',
  muted: '#A0A0C0',
  primary: '#A48FFF',
  primaryDeep: '#6C4FE8',
  cyan: '#58B6E8',
  pink: '#FF5470',
} as const

export const FPS = 30
export const WIDTH = 1080
export const HEIGHT = 1920
export const DURATION = 450

/**
 * Zones mortes de TikTok et des Reels : la barre du haut et toute
 * l'interface du bas (légende, boutons, pseudo) recouvrent l'image.
 * Rien de lisible ne sort de cette bande.
 */
export const SAFE = { top: 250, bottom: 350 } as const
export const SAFE_HEIGHT = HEIGHT - SAFE.top - SAFE.bottom
/** Centre optique de la bande utile — au-dessus du centre géométrique. */
export const SAFE_CENTER = SAFE.top + SAFE_HEIGHT / 2

/**
 * Points de coupe, calés sur la musique.
 *
 * 120 BPM à 30 fps : un temps dure 15 frames, une mesure 60. Toutes les
 * bornes ci-dessous sont des multiples de 30, donc chaque changement de plan
 * tombe sur le temps 1 ou le temps 3 — jamais sur un temps faible. Le kick de
 * `public/audio/music.wav` frappe exactement là.
 *
 * Déplacer une borne sans la garder sur un multiple de 30 désynchronise le
 * montage de la musique.
 */
export const CUTS = {
  ignition: [0, 60],
  catalogue: [60, 150],
  price: [150, 240],
  experience: [240, 330],
  delivery: [330, 390],
  lockup: [390, 450],
} as const

/** 120 BPM à 30 fps. */
export const FRAMES_PER_BEAT = 15

export type Jersey = {
  src: string
  name: string
  team: string
  price: number
  was?: number
}

/** Les maillots photographiés par la boutique, relevés le 2026-10-10. */
export const JERSEYS: Jersey[] = [
  { src: 'j1.png', name: 'Maroc domicile', team: 'Maroc', price: 8000, was: 12000 },
  { src: 'j2.png', name: 'Man. United third', team: 'Manchester United', price: 8000, was: 12000 },
  { src: 'j3.png', name: 'États-Unis domicile', team: 'États-Unis', price: 8000, was: 12000 },
  { src: 'j4.png', name: 'Paris Saint-Germain', team: 'PSG', price: 8000, was: 12000 },
  { src: 'j5.png', name: 'Sport Recife extérieur', team: 'Recife', price: 7500, was: 8000 },
  { src: 'j6.png', name: 'Brésil domicile 2026', team: 'Brésil', price: 8000 },
  { src: 'j7.png', name: 'Chelsea', team: 'Chelsea', price: 7500 },
  { src: 'j8.png', name: 'Manchester City', team: 'Man. City', price: 8000, was: 10000 },
  { src: 'j9.png', name: 'Sénégal extérieur 2026', team: 'Sénégal', price: 7500, was: 10000 },
  { src: 'j10.png', name: 'Aston Villa third', team: 'Aston Villa', price: 8000, was: 12000 },
  { src: 'j11.png', name: 'Barcelona', team: 'FC Barcelone', price: 7500, was: 10000 },
  { src: 'j12.png', name: 'Fulham', team: 'Fulham', price: 7500, was: 10000 },
  { src: 'j13.png', name: 'Manchester City', team: 'Man. City', price: 7500, was: 10000 },
]

export const jerseyFile = (j: Jersey) => staticFile(`jerseys/${j.src}`)

/**
 * Francs CFA, entiers, séparés par une espace — jamais `toLocaleString`, dont
 * l'espace fine insécable casse le rendu dans Bebas.
 */
export const money = (n: number) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} F`

export const discount = (j: Jersey) =>
  j.was ? Math.round(((j.was - j.price) / j.was) * 100) : null
