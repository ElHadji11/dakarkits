/**
 * `assets/shots/*.png` -> `public/shots/*.webp`.
 *
 * Les captures sortent en 2x et 3x : d-home.png pese 1,9 Mo, d-home-full.png
 * 5,7 Mo. Remotion redecode chaque image a chaque frame — servir les PNG tels
 * quels fait passer le rendu de quelques minutes a une demi-heure, et gonfle
 * le depot de 60 Mo.
 *
 * La conversion passe par le canvas de Chromium, deja installe pour Playwright :
 * pas de dependance de plus, et le WebP garde le texte d'interface net la ou
 * le JPEG le ferait baver.
 *
 *   node scripts/optimize-assets.mjs
 */
import { chromium } from '@playwright/test'
import { mkdir, readdir, readFile, writeFile, stat } from 'node:fs/promises'
import { basename, resolve } from 'node:path'

const SRC = resolve(import.meta.dirname, '../assets/shots')
const OUT = resolve(import.meta.dirname, '../public/shots')

/**
 * Largeur maximale par famille de capture.
 *
 * Les plans ou la camera plonge gardent leurs 3840 px : une image servie a la
 * taille de l'ecran puis agrandie trois fois redevient floue. Les pages
 * entieres ne servent que de fond en mouvement, 1920 suffit.
 */
const MAX_WIDTH = [
  [/-full$/, 1920],
  [/^m-/, 1290],
  [/^[dfp]-/, 3840],
]
const widthFor = (name) => MAX_WIDTH.find(([re]) => re.test(name))?.[1] ?? 3840
const QUALITY = 0.92

await mkdir(OUT, { recursive: true })
const files = (await readdir(SRC)).filter((f) => f.endsWith('.png'))
if (files.length === 0) {
  console.error('Aucune capture dans assets/shots — lancer `npm run capture` d abord.')
  process.exit(1)
}

const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto('about:blank')

let before = 0
let after = 0
const index = []

for (const file of files) {
  const name = basename(file, '.png')
  const png = await readFile(resolve(SRC, file))
  before += (await stat(resolve(SRC, file))).size

  const { data, w, h } = await page.evaluate(
    async ([b64, maxW, quality]) => {
      const img = new Image()
      img.src = 'data:image/png;base64,' + b64
      await img.decode()
      const scale = Math.min(1, maxW / img.naturalWidth)
      const w = Math.round(img.naturalWidth * scale)
      const h = Math.round(img.naturalHeight * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, w, h)
      return { data: canvas.toDataURL('image/webp', quality).split(',')[1], w, h }
    },
    [png.toString('base64'), widthFor(name), QUALITY],
  )

  const buf = Buffer.from(data, 'base64')
  await writeFile(resolve(OUT, name + '.webp'), buf)
  after += buf.length
  index.push({ name, w, h })
  process.stdout.write('.')
}

await browser.close()

// Les dimensions reelles de chaque fichier servi : un plan cadre sur une
// image dont on suppose la taille se decale de quelques pixels, et ca se voit.
await writeFile(
  resolve(import.meta.dirname, '../src/spot/assets.ts'),
  [
    '/** Genere par `npm run assets` — ne pas editer a la main. */',
    'export type AssetName =',
    ...index.map((a) => "  | '" + a.name + "'"),
    '',
    'export const ASSETS: Record<AssetName, { w: number; h: number }> = {',
    ...index.map((a) => "  '" + a.name + "': { w: " + a.w + ', h: ' + a.h + ' },'),
    '}',
    '',
  ].join('\n'),
)

const mb = (n) => (n / 1024 / 1024).toFixed(1) + ' Mo'
console.log(
  '\n' + index.length + ' images  ' + mb(before) + ' -> ' + mb(after) +
    '  (' + Math.round((1 - after / before) * 100) + ' % de moins)',
)
