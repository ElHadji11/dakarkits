import { loadFont as loadBebas } from '@remotion/google-fonts/BebasNeue'
import { loadFont as loadInter } from '@remotion/google-fonts/Inter'

/**
 * Deux polices, deux rôles — la règle du projet tient aussi en vidéo.
 * Bebas : capitales seulement, gros titres et montants mis en avant.
 * Inter : tout le reste, y compris les noms de maillots.
 *
 * Inter est chargée en variable sur tous ses poids par défaut, soit plus de
 * cent requêtes avant la première frame. On ne demande que ce que le film
 * utilise réellement.
 */
export const DISPLAY = loadBebas('normal', {
  weights: ['400'],
  subsets: ['latin'],
}).fontFamily

export const SANS = loadInter('normal', {
  weights: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
}).fontFamily
