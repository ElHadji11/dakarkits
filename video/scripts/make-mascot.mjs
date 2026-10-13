/**
 * La mascotte : fond detoure, image rognee au plus juste.
 *
 *   node scripts/make-mascot.mjs
 *
 * Le personnage est genere sur un aplat magenta (#d5037c) choisi pour ca :
 * aucune de ses couleurs — doré, brun, violet — n'en approche, donc le
 * detourage se fait a la distance colorimetrique, sans masque dessine a la
 * main et sans service exterieur.
 *
 * Le resultat est **rogne sur le personnage**. Une marge transparente de
 * largeur inconnue obligerait a caler la mascotte a l'oeil dans chaque plan,
 * et a tout recaler le jour ou l'image change ; rognee, l'image a la taille
 * du lion, et `MASCOT` donne ses proportions au film.
 *
 * Ce lion est **le notre**. Il ne porte ni anneaux, ni millesime, ni nom
 * d'evenement, ni ecusson — voir la note dans `components/Mascot.tsx`.
 */
import { closeSync, existsSync, ftruncateSync, openSync, writeSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import sharp from 'sharp'

const ROOT = resolve(import.meta.dirname, '..')
const SRC = resolve(ROOT, 'assets/mascot/lion-open.png')
const OUT_DIR = resolve(ROOT, 'public/mascot')
const OUT = resolve(OUT_DIR, 'lion.webp')
const META = resolve(ROOT, 'src/reel/mascot-asset.ts')

/** L'aplat du fond, releve au pixel sur la generation. */
const KEY = [0xd5, 0x03, 0x7c]

/**
 * Les deux seuils du detourage, en distance RGB.
 *
 * Sous `INNER` c'est le fond, au-dessus de `OUTER` c'est le lion, entre les
 * deux l'alpha monte progressivement — c'est cette bande qui rattrape
 * l'antialiasing des poils de la criniere. Un seuil unique donnerait un
 * contour en escalier, tres visible sur une criniere.
 */
const INNER = 70
const OUTER = 130

const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true })
const { width: W, height: H } = info
const out = Buffer.alloc(W * H * 4)

let minX = W
let minY = H
let maxX = -1
let maxY = -1

for (let i = 0, p = 0; p < W * H; p++, i += 3) {
  const r = data[i]
  const g = data[i + 1]
  const b = data[i + 2]
  const d = Math.hypot(r - KEY[0], g - KEY[1], b - KEY[2])
  const a = Math.max(0, Math.min(1, (d - INNER) / (OUTER - INNER)))
  const o = p * 4

  /*
   * Le degorgement du fond.
   *
   * Sur les pixels a moitie transparents, le magenta a deja teinte le poil :
   * detoure tel quel, le lion garde un lisere rose qui se voit immediatement
   * sur le fond sombre du film. On retire donc du rouge et du bleu en
   * proportion de la transparence, ce qui ramene ces pixels vers la couleur
   * du poil qu'ils auraient eue sans le fond.
   */
  const spill = (1 - a) * 0.55
  out[o] = Math.round(r * (1 - spill) + g * spill)
  out[o + 1] = g
  out[o + 2] = Math.round(b * (1 - spill) + g * spill)
  out[o + 3] = Math.round(a * 255)

  if (a > 0.5) {
    const x = p % W
    const y = (p / W) | 0
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
}

if (maxX < 0) throw new Error('aucun pixel de personnage : le fond a-t-il change de couleur ?')

// Deux pixels de marge : le rognage se fait sur l'alpha > 0,5, donc les poils
// les plus fins tombent juste en dehors de la boite.
const PAD = 2
const left = Math.max(0, minX - PAD)
const top = Math.max(0, minY - PAD)
// Le lion deborde du cadre en bas et sur les cotes : les bornes hautes sont
// donc bien souvent le dernier pixel de l'image, et la marge n'a nulle part
// ou aller. Les quatre bords sont ramenes dans l'image avant la soustraction.
const right = Math.min(W - 1, maxX + PAD)
const bottom = Math.min(H - 1, maxY + PAD)
const box = { left, top, width: right - left + 1, height: bottom - top + 1 }

await mkdir(OUT_DIR, { recursive: true })
await sharp(out, { raw: { width: W, height: H, channels: 4 } })
  .extract(box)
  .webp({ quality: 92, alphaQuality: 100 })
  .toFile(OUT)

const meta = await sharp(OUT).metadata()

const body = [
  '/** Genere par `npm run mascot` — ne pas editer a la main. */',
  '',
  '/**',
  ' * Les proportions du lion detoure (`public/mascot/lion.webp`).',
  ' *',
  ' * L’image est rognee sur le personnage : ces deux nombres sont donc ceux',
  ' * du lion lui-meme, et un plan qui lui donne une hauteur sait aussitot sa',
  ' * largeur. Regenerer la mascotte met ces valeurs a jour toutes seules.',
  ' */',
  'export const MASCOT = { w: ' + meta.width + ', h: ' + meta.height + ' } as const',
  '',
].join('\n')

if (existsSync(META)) {
  const buf = Buffer.from(body, 'utf8')
  const fd = openSync(META, 'r+')
  try {
    ftruncateSync(fd, 0)
    writeSync(fd, buf, 0, buf.length, 0)
  } finally {
    closeSync(fd)
  }
} else {
  await writeFile(META, body)
}

console.log(
  'lion detoure ' + meta.width + 'x' + meta.height + ' (de ' + W + 'x' + H + ') -> public/mascot/lion.webp',
)
