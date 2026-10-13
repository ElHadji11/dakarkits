/**
 * La planche-contact : une image par plan, avant le rendu complet.
 *
 * Rendre vingt secondes pour s'apercevoir que le quatrieme plan est mal
 * cadre coute dix minutes. Rendre sept images en coute une.
 *
 *   node scripts/contact-sheet.mjs                 # Spot (16:9)
 *   node scripts/contact-sheet.mjs SpotVertical    # un autre format
 *   node scripts/contact-sheet.mjs Reel            # le reel vertical
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

/**
 * Un instant parlant par plan, et son titre, par composition.
 *
 * Les deux films n'ont ni le meme nombre de plans ni les memes bornes : une
 * liste unique montrerait, pour l'un des deux, sept frames prises au hasard
 * au milieu des coupes.
 */
const SHEETS = {
  Spot: [
    [74, '1 · Accroche', 'TROP CHER frappe, le trait le barre'],
    [168, '2 · Le produit', 'les cartes se posent une a une'],
    [248, '3a · Cherche', '« barca » tape, la liste est tombee'],
    [300, '3b · Choisis', 'taille M prise, le panier passe a 1'],
    [380, '3c · Commande', 'trois champs remplis, le bouton attend'],
    [462, '4 · Le chiffre', '13 000 F, remise pack posee'],
    [548, '5 · Signature', 'monogramme, adresse, appel'],
  ],
  Reel: [
    [30, '0 · Accroche', 'le lion parle, bouche ouverte sur une syllabe'],
    [82, '1a · Senegal', 'un maillot et un prix, pas de logo'],
    [128, '1b · Maroc', 'le deuxieme maillot, plein cadre'],
    // La frame du croisement. Elle etait noire jusqu'au 2026-10-13 : le
    // Maroc etait sorti, le Barca pas encore entre. C'est pour la surveiller
    // qu'elle est sur la planche, et pour rien d'autre.
    [150, '1 · Le raccord', 'les deux maillots se croisent — jamais de cadre vide'],
    [186, '1c · Barcelone', 'l’offre se pose sur le troisieme'],
    [231, '2a · Le champ', '« barca » se tape, cadre serre a 300 px'],
    [262, '2b · Le resultat', 'la liste est tombee, le prix cale a droite est entier'],
    [292, '3 · Choisis', 'taille M prise, les cinq tailles en entier'],
    [326, '3b · Au panier', 'la barre du bas est dans le cadre, le doigt aussi'],
    [352, '4a · Le nom', 'le champ rempli en gros plan'],
    [400, '4b · L’adresse', 'la camera a suivi, toujours a 300 px'],
    [444, '4c · Le bouton', 'reouverture : « Confirmer ma commande » presse'],
    [500, '5 · C’est passe', 'la coche, et rien a payer maintenant'],
    [620, '6 · Signature', 'le lion, le logo, l’adresse'],
  ],
}

/**
 * Les accroches ont leur propre planche : trois images sur deux secondes.
 *
 * Elles se jouent trop vite pour qu'une seule frame dise si elles tiennent —
 * ce qui compte est l'ordre dans lequel les choses arrivent, et c'est ca que
 * trois images cote a cote montrent.
 */
const HOOK_SHEET = [
  [4, 'a · La claque', 'le maillot arrive, le montant tombe dessus'],
  [26, 'b · Le nom', 'de quel maillot il s’agit — et pas avant'],
  [48, 'c · La promesse', '« Livré chez toi » pose la derniere ligne'],
]
SHEETS.ReelPrice = HOOK_SHEET
SHEETS.ReelMarket = [
  [8, 'a · Le montant du marche', '15 000 F seul dans le cadre'],
  [18, 'b · Le trait', 'barre net, juste avant la bascule'],
  [34, 'c · Le notre', 'le maillot a claque, 7 500 F prend la place'],
]

const SHOTS = SHEETS[COMP] ?? SHEETS[COMP.replace(/(Vertical|Square|Ad)$/, '')] ?? SHEETS.Spot

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
<h1>DakarKits · ${COMP} — planche-contact</h1>
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
