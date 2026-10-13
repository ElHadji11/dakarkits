/** Genere par `npm run mascot` — ne pas editer a la main. */

/**
 * Les proportions du lion detoure (`public/mascot/lion.webp`).
 *
 * L’image est rognee sur le personnage : ces deux nombres sont donc ceux
 * du lion lui-meme, et un plan qui lui donne une hauteur sait aussitot sa
 * largeur. Regenerer la mascotte met ces valeurs a jour toutes seules.
 */
export const MASCOT = { w: 667, h: 1072 } as const
