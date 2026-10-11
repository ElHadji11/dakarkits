/**
 * La planche-contact : une image par plan, avant le rendu complet.
 *
 * Rendre vingt secondes pour s'apercevoir que le quatrieme plan est mal
 * cadre coute dix minutes. Rendre sept images en coute une.
 *
 *   node scripts/contact-sheet.mjs                 # Spot (16:9)
 *   node scripts/contact-sheet.mjs SpotVertical    # un autre format
 *
 * Les frames choisies ne sont pas les premieres de chaque plan : une
 * premiere frame montre un plan qui n'est pas encore installe. On prend le
 * moment ou le plan dit ce qu'il a a dire.
 */
import { execFileSync } from 'node:child_process'
import { chromium } from '@playwright/test'
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { resolve } from 'node:path'

const COMP = process.argv[2] ?? 'Spot'
const ROOT = resolve(import.meta.dirname, '..')
const TMP = resolve(ROOT, 'out', 'sheet-' + COMP)
const OUT = resolve(ROOT, 'out', 'contact-sheet-' + COMP + '.png')

/** Un instant parlant par plan, et son titre. */
const SHOTS = [
  [74, '1 · Accroche', 'TROP CHER frappe, le trait le barre'],
  [168, '2 · Le produit', 'les cartes se posent une a une'],
  [248, '3a · Cherche', '« barca » tape, la liste est tombee'],
  [300, '3b · Choisis', 'taille M prise, le panier passe a 1'],
  [380, '3c · Commande', 'trois champs remplis, le bouton attend'],
  [462, '4 · Le chiffre', '13 000 F, remise pack posee'],
  [548, '5 · Signature', 'monogramme, adresse, appel'],
]

await rm(TMP, { recursive: true, force: true })
await mkdir(TMP, { recursive: true })

console.log('Rendu de ' + SHOTS.length + ' images (' + COMP + ')...')
for (const [frame] of SHOTS) {
  // `shell: true` : sous Windows, npx est un .cmd, que spawn refuse de
  // lancer directement depuis Node 20 (EINVAL).
  execFileSync(
    'npx',
    ['remotion', 'still', COMP, resolve(TMP, 'f' + frame + '.png'), '--frame=' + frame, '--log=error'],
    { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'], shell: true },
  )
  process.stdout.write('  ' + frame)
}
console.log('')

// Le montage de la planche : une page HTML, puis une capture. Chromium est
// deja la pour Playwright, et il sait mettre en page mieux qu'un collage
// calcule a la main.
const cards = await Promise.all(
  SHOTS.map(async ([frame, title, note]) => {
    const b64 = (await readFile(resolve(TMP, 'f' + frame + '.png'))).toString('base64')
    return { frame, title, note, b64 }
  }),
)

const cols = cards.length <= 4 ? 2 : 3
const html = `<!doctype html><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
  :root { color-scheme: dark }
  body { margin:0; padding:40px; background:#07070E; font-family:Inter,sans-serif; color:#E0E2F5 }
  h1 { font-size:30px; margin:0 0 6px; letter-spacing:-.5px }
  p.sub { margin:0 0 30px; color:#9CA1C0; font-size:15px }
  .grid { display:grid; grid-template-columns:repeat(${cols},1fr); gap:26px }
  figure { margin:0 }
  .thumb { border:1px solid #2B3152; border-radius:10px; overflow:hidden; background:#0D0F1A; display:flex }
  img { width:100%; display:block }
  figcaption { margin-top:10px }
  .t { font-weight:800; font-size:16px }
  .n { color:#9CA1C0; font-size:13.5px; margin-top:2px }
  .f { color:#9592FE; font-size:12px; font-variant-numeric:tabular-nums; margin-top:2px }
</style>
<h1>DakarKits · spot 20 s — planche-contact</h1>
<p class="sub">${COMP} · un plan par image · louyomb.com · captures reelles du site</p>
<div class="grid">
${cards
  .map(
    (c) => `<figure>
  <div class="thumb"><img src="data:image/png;base64,${c.b64}"></div>
  <figcaption><div class="t">${c.title}</div><div class="n">${c.note}</div>
  <div class="f">frame ${c.frame} · ${(c.frame / 30).toFixed(1)} s</div></figcaption>
</figure>`,
  )
  .join('\n')}
</div>`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1800, height: 1200 }, deviceScaleFactor: 1 })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: OUT, fullPage: true })
await browser.close()
await writeFile(resolve(TMP, 'sheet.html'), html)

console.log('planche -> ' + OUT.replace(ROOT + '\\', '').replace(ROOT + '/', ''))
