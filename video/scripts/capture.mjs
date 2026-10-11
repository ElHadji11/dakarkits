/**
 * Capture le vrai site (louyomb.com) pour le film : chaque plan du spot est une
 * capture, jamais une interface redessinée.
 *
 *   node scripts/capture.mjs            # production
 *   node scripts/capture.mjs http://localhost:3000
 *
 * Rien n'est envoyé au serveur : la recherche, le choix de taille et le panier
 * sont côté client. Le formulaire de commande est capturé vide — la frappe et
 * le clic « Confirmer » sont animés dans Remotion, pour ne jamais créer une
 * vraie commande en production.
 */
import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const BASE = (process.argv[2] ?? 'https://louyomb.com').replace(/\/+$/, '')
const OUT = resolve(import.meta.dirname, '../assets/shots')
const DESKTOP = { width: 1920, height: 1080 }
const PHONE = { width: 430, height: 932 }

const manifest = []
/** Geometrie reelle, par page, en pixels CSS du cadrage 1920x1080. */
const geometry = {}

async function settle(page) {
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.evaluate(() => document.fonts.ready)
  // Les images produit viennent d'ImageKit : attendre qu'elles soient décodées,
  // sinon la capture montre des cartes vides.
  await page
    .waitForFunction(() => [...document.images].every((i) => !i.currentSrc || i.complete), null, {
      timeout: 15000,
    })
    .catch(() => {})
  // Et surtout : plus aucun squelette a l'ecran. Sur une navigation client,
  // `networkidle` se declenche alors que le Suspense montre encore ses barres
  // grises — la fiche produit est sortie comme ca une fois, et le plan « 02 ·
  // Choisis » montrait une page en train de charger.
  await page
    .waitForFunction(() => document.querySelectorAll('[class*="animate-pulse"]').length === 0, null, {
      timeout: 15000,
    })
    .catch(() => {})
  await page.waitForTimeout(600)
}

/**
 * La boite d'un element, en pixels CSS du cadrage 1920x1080. Le curseur du
 * film vise ces coordonnees : il clique la ou le bouton se trouve vraiment.
 */
async function measure(map) {
  const out = {}
  for (const [name, locator] of Object.entries(map)) {
    const box = await locator.boundingBox().catch(() => null)
    if (box)
      out[name] = {
        x: +box.x.toFixed(1),
        y: +box.y.toFixed(1),
        w: +box.width.toFixed(1),
        h: +box.height.toFixed(1),
      }
  }
  return out
}

async function shot(page, name, opts = {}) {
  const path = resolve(OUT, name + '.png')
  await mkdir(dirname(path), { recursive: true })
  const target = opts.locator ?? page
  await target.screenshot({ path, animations: 'disabled', scale: 'device', ...opts.shot })
  const dpr = await page.evaluate(() => devicePixelRatio)
  manifest.push({ name, url: page.url(), dpr, note: opts.note ?? '' })
  console.log('  ok ' + name)
}

/** Les jetons reels du theme, releves sur l'app en marche. */
async function readTheme(page) {
  return page.evaluate(() => {
    const keys = [
      '--background',
      '--foreground',
      '--primary',
      '--primary-foreground',
      '--card',
      '--card-foreground',
      '--muted',
      '--muted-foreground',
      '--border',
      '--accent',
      '--destructive',
      '--radius',
      '--font-display',
      '--font-sans',
    ]
    const s = getComputedStyle(document.documentElement)
    const vars = {}
    for (const k of keys) vars[k] = s.getPropertyValue(k).trim()
    const body = getComputedStyle(document.body)
    const display = document.querySelector('[class*="font-display"]')
    const h1 = document.querySelector('h1')
    return {
      htmlClass: document.documentElement.className,
      colorScheme: body.colorScheme,
      bodyBackground: body.backgroundColor,
      bodyColor: body.color,
      bodyFont: body.fontFamily,
      displayFont: display ? getComputedStyle(display).fontFamily : null,
      displayText: display ? display.textContent.trim().slice(0, 40) : null,
      h1Font: h1 ? getComputedStyle(h1).fontFamily : null,
      vars,
      fontFaces: [...document.fonts].map((f) => f.family + ' ' + f.weight),
    }
  })
}

const browser = await chromium.launch()

// ---------------------------------------------------------------- bureau 16:9
{
  const ctx = await browser.newContext({
    viewport: DESKTOP,
    deviceScaleFactor: 2,
    reducedMotion: 'reduce',
    locale: 'fr-SN',
    timezoneId: 'Africa/Dakar',
    colorScheme: 'dark',
  })
  const page = await ctx.newPage()

  console.log('\n[bureau 1920x1080 @2x] ' + BASE)
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await settle(page)

  const theme = await readTheme(page)
  await writeFile(resolve(OUT, '../theme-live.json'), JSON.stringify(theme, null, 2))
  console.log('  theme:', theme.bodyBackground, theme.bodyColor, '|', theme.htmlClass || '(aucune classe)')
  console.log('  fonts:', theme.bodyFont, '/', theme.displayFont)

  await shot(page, 'd-home', { note: 'catalogue, haut de page' })
  await shot(page, 'd-home-full', { shot: { fullPage: true }, note: 'catalogue entier' })

  const header = page.locator('header').first()
  if (await header.count()) await shot(page, 'd-header', { locator: header, note: 'en-tete + logo' })

  const card = page.locator('main a[href^="/maillot/"]').first()
  if (await card.count()) await shot(page, 'd-card', { locator: card, note: 'une carte produit' })

  // --- Les pieces de l'interface, avec leur vraie coordonnee.
  // Le plan « l'interface se monte » les fait voler a leur position reelle :
  // la mise en page du film est celle du site, pas une approximation.
  const boxes = await page.evaluate(() => {
    const el = {
      promo: () => document.querySelector('div.bg-primary'),
      delivery: () => document.querySelector('header > div'),
      logo: () => document.querySelector('header a svg')?.closest('a'),
      search: () =>
        document.querySelector('[role="combobox"]')?.closest('div.relative') ??
        document.querySelector('[role="combobox"]'),
      icons: () => document.querySelector('header div.ml-auto'),
      nav: () => document.querySelector('main nav'),
      tools: () => document.querySelector('main nav')?.nextElementSibling,
      count: () =>
        [...document.querySelectorAll('main p')].find((p) => /maillots?$/i.test(p.textContent.trim())),
    }
    const out = {}
    const rect = (n) => {
      const r = n.getBoundingClientRect()
      return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) }
    }
    for (const [name, get] of Object.entries(el)) {
      const node = get()
      if (node) out[name] = rect(node)
    }
    out.cards = [...document.querySelectorAll('main ul > li')].slice(0, 8).map((li) => ({
      ...rect(li),
      title: li.querySelector('h2, h3, p')?.textContent?.trim().slice(0, 48) ?? '',
      href: li.querySelector('a')?.getAttribute('href') ?? '',
    }))
    // Le compteur du catalogue, en toutes lettres.
    //
    // Le film l'affiche en gros dans les formats verticaux, a cote de la
    // pastille du site qui dit la meme chose : deux sources pour un meme
    // nombre, c'est une divergence programmee. Le premier film porte deja
    // cette dette (« +20 maillots » pour 13 publies) — celui-ci lit la vraie
    // valeur au moment de la capture.
    const counter = el.count()
    out.countText = counter ? counter.textContent.trim() : ''
    out.viewport = { w: innerWidth, h: innerHeight }
    return out
  })

  for (const [name, b] of Object.entries(boxes)) {
    // `boxes` porte aussi des valeurs qui ne sont pas des boites (le texte du
    // compteur, la taille du cadrage, la liste des cartes).
    if (name === 'cards' || name === 'viewport' || typeof b !== 'object' || b === null) continue
    await shot(page, 'p-' + name, {
      shot: { clip: { x: b.x, y: b.y, width: b.w, height: b.h } },
      note: 'piece ' + name,
    })
    manifest[manifest.length - 1].box = b
  }
  for (let i = 0; i < boxes.cards.length; i++) {
    const c = boxes.cards[i]
    await shot(page, 'p-card-' + (i + 1), {
      shot: { clip: { x: c.x, y: c.y, width: c.w, height: c.h } },
      note: 'carte ' + c.title,
    })
    manifest[manifest.length - 1].box = c
  }
  geometry.home = boxes

  // 1. Recherche instantanee : « barca » trouve Barcelone par son alias.
  const search = page.getByRole('combobox', { name: /Chercher un maillot/i }).first()
  if (await search.count()) {
    geometry.searchColor = await search.evaluate((el) => {
      const cv = document.createElement('canvas')
      cv.width = cv.height = 1
      const ctx = cv.getContext('2d')
      ctx.fillStyle = getComputedStyle(el).backgroundColor
      ctx.fillRect(0, 0, 1, 1)
      const d = ctx.getImageData(0, 0, 1, 1).data
      return '#' + [d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, '0')).join('')
    })
    await search.click()
    await shot(page, 'd-search-open', { note: 'champ de recherche actif' })
    await search.pressSequentially('barca', { delay: 90 })
    await page.waitForTimeout(800)
    await shot(page, 'd-search-barca', { note: 'resultats instantanes pour barca' })
    const box = page.getByRole('listbox').first()
    if (await box.count())
      await shot(page, 'd-search-listbox', { locator: box, note: 'la liste de resultats seule' })
    geometry.search = await measure({
      field: search,
      listbox: box,
      firstResult: page.getByRole('listbox').getByRole('link').first(),
    })
    const first = page.getByRole('listbox').getByRole('link').first()
    const href = await first.getAttribute('href').catch(() => null)
    console.log('  -> resultat:', href)
    if (href) {
      await first.click()
      await page.waitForLoadState('domcontentloaded')
      await settle(page)
    }
  }

  // 2. Fiche produit : la taille, puis « Ajouter au panier ».
  if (!page.url().includes('/maillot/')) {
    const any = await page.locator('a[href^="/maillot/"]').first().getAttribute('href')
    await page.goto(BASE + any, { waitUntil: 'domcontentloaded' })
    await settle(page)
  }
  const productUrl = page.url()
  console.log('  -> fiche:', productUrl)
  await shot(page, 'd-product', { note: 'fiche produit' })
  await shot(page, 'd-product-full', { shot: { fullPage: true } })

  const sizeGroup = page.getByRole('group', { name: /Taille/i }).first()
  if (await sizeGroup.count()) {
    await shot(page, 'd-sizes', { locator: sizeGroup, note: 'selecteur de taille' })
    // Une taille epuisee rend son bouton `disabled` : ne jamais la choisir.
    const sizes = sizeGroup.locator('button:not([disabled])').filter({ hasNotText: /^$/ })
    const n = await sizes.count()
    if (n > 0) {
      const pick = sizes.nth(Math.min(1, n - 1))
      console.log('  -> taille:', (await pick.innerText()).trim())
      await pick.click()
      await page.waitForTimeout(400)
      await shot(page, 'd-sizes-picked', { locator: sizeGroup, note: 'taille choisie, etat actif reel' })
      await shot(page, 'd-product-sized', { note: 'fiche avec la taille choisie' })
    }
  }

  const pack = page.getByText(/maillots au choix pour/i).first()
  if (await pack.count())
    await shot(page, 'd-pack', { locator: pack, note: 'la phrase du bareme de pack' })

  const addBtn = page.getByRole('button', { name: /Ajouter au panier/i }).last()
  geometry.product = await measure({
    title: page.getByRole('heading', { level: 1 }).first(),
    price: page.getByText(/^\d[\d  ]*F$/).first(),
    photo: page.locator('main img').first(),
    sizeGroup: sizeGroup,
    sizeS: sizeGroup.locator('button', { hasText: /^S$/ }).first(),
    sizeM: sizeGroup.locator('button', { hasText: /^M$/ }).first(),
    sizeL: sizeGroup.locator('button', { hasText: /^L$/ }).first(),
    sizeXL: sizeGroup.locator('button', { hasText: /^XL$/ }).first(),
    orderNow: page.getByRole('button', { name: /Commander maintenant/i }).first(),
    addToCart: addBtn,
    pack: page.getByText(/maillots au choix pour/i).first(),
    cartIcon: page.locator('header div.ml-auto').first(),
  })
  if (await addBtn.count()) {
    await shot(page, 'd-add-button', { locator: addBtn, note: 'bouton Ajouter au panier' })
    await addBtn.click()
    await page.waitForTimeout(1400)
    await shot(page, 'd-added', { note: 'apres l ajout, panier a 1' })
    // La pastille du panier passee a 1 : c'est la recompense du clic, et elle
    // doit etre la vraie, pas un rond redessine.
    const icons = geometry.product.cartIcon
    if (icons)
      await shot(page, 'p-icons-1', {
        shot: { clip: { x: icons.x, y: icons.y, width: icons.w, height: icons.h } },
        note: 'en-tete apres l ajout, pastille a 1',
      })
  }

  // 3. Le panier : total a payer a la livraison, relance du pack, Commander.
  await page.goto(BASE + '/panier', { waitUntil: 'domcontentloaded' })
  await settle(page)
  await shot(page, 'd-cart-1', { note: 'panier, un maillot' })
  await shot(page, 'd-cart-1-full', { shot: { fullPage: true } })

  // Un deuxieme maillot : le bareme s'active.
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await settle(page)
  const second = page.locator('main a[href^="/maillot/"]').nth(3)
  const secondHref = await second.getAttribute('href').catch(() => null)
  if (secondHref && !productUrl.endsWith(secondHref)) {
    await page.goto(BASE + secondHref, { waitUntil: 'domcontentloaded' })
    await settle(page)
    const g = page.getByRole('group', { name: /Taille/i }).first()
    if (await g.count()) {
      const b = g.locator('button:not([disabled])').filter({ hasNotText: /^$/ }).first()
      if (await b.count()) await b.click().catch(() => {})
    }
    const add2 = page.getByRole('button', { name: /Ajouter au panier/i }).last()
    if (await add2.count()) {
      await add2.click()
      await page.waitForTimeout(1400)
    }
  }
  await page.goto(BASE + '/panier', { waitUntil: 'domcontentloaded' })
  await settle(page)
  await shot(page, 'd-cart-2', { note: 'panier a deux, le prix du pack s applique' })
  await shot(page, 'd-cart-2-full', { shot: { fullPage: true } })
  const totals = page.getByText(/payer a la livraison|payer à la livraison/i).first()
  let totalBlock = null
  if (await totals.count()) {
    totalBlock = totals.locator('xpath=ancestor::*[self::div or self::section][1]')
    await shot(page, 'd-total', { locator: totalBlock, note: 'le bloc du total' })
  }
  geometry.cart = await measure({
    relance: page.getByText(/Ajoute un maillot/i).first(),
    totalBlock: totalBlock ?? page.locator('main').first(),
    totalLine: totals,
    order: page.getByRole('link', { name: /^Commander$/i }).first(),
    line1: page.locator('main li, main [class*="border-b"]').first(),
  })
  for (const name of ['relance', 'order']) {
    const b = geometry.cart[name]
    if (b)
      await shot(page, 'p-' + name, {
        shot: { clip: { x: b.x, y: b.y, width: b.w, height: b.h } },
        note: 'piece panier ' + name,
      })
  }

  // 4. Le formulaire, capture vide : jamais envoye depuis la production.
  await page.goto(BASE + '/commande', { waitUntil: 'domcontentloaded' })
  await settle(page)
  await shot(page, 'd-form', { note: 'formulaire de commande, vide et non envoye' })
  await shot(page, 'd-form-full', { shot: { fullPage: true } })
  const confirm = page.getByRole('button', { name: /Confirmer ma commande/i }).last()
  if (await confirm.count())
    await shot(page, 'd-confirm-button', { locator: confirm, note: 'bouton Confirmer, non clique' })

  const fName = page.getByLabel('Nom complet')
  const fPhone = page.getByLabel('Téléphone')
  const fAddr = page.getByLabel('Adresse de livraison')

  // Les trois champs et le bouton dans un seul cadre : c'est ce plan que le
  // film anime. La geometrie est relevee dans ce defilement-la, sinon le
  // curseur viserait des coordonnees qui ne correspondent a aucune image.
  await fName.scrollIntoViewIfNeeded()
  await page.evaluate(() => scrollBy(0, -140))
  await page.waitForTimeout(500)
  await shot(page, 'd-form-fields', { note: 'les trois champs et le bouton, en un cadre' })
  geometry.form = await measure({
    legend: page.getByText(/Où te livrer/i).first(),
    name: fName,
    phone: fPhone,
    address: fAddr,
    confirm,
  })
  geometry.form.scrollY = await page.evaluate(() => Math.round(scrollY))

  /**
   * Les couleurs de fond des champs, en sRGB exact.
   *
   * Les champs sont captures vides, donc avec leur texte d'invite ; le film
   * doit pouvoir l'effacer avant d'y poser sa frappe. Un aplat « a peu pres
   * de la bonne couleur » se verrait comme une rustine, alors Chromium
   * convertit lui-meme le `lab()` calcule en hexadecimal.
   */
  geometry.colors = await page.evaluate(() => {
    const hex = (color) => {
      const cv = document.createElement('canvas')
      cv.width = cv.height = 1
      const ctx = cv.getContext('2d')
      ctx.fillStyle = color
      ctx.fillRect(0, 0, 1, 1)
      const d = ctx.getImageData(0, 0, 1, 1).data
      return '#' + [d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, '0')).join('')
    }
    const bg = (sel) => {
      const el = document.querySelector(sel)
      return el ? hex(getComputedStyle(el).backgroundColor) : null
    }
    return {
      input: bg('input[name="name"], input[type="text"], input:not([type="hidden"])'),
      textarea: bg('textarea'),
      page: hex(getComputedStyle(document.body).backgroundColor),
    }
  })
  // Les trois champs, capture vides : la frappe est animee dans Remotion.
  for (const [n, loc] of [['name', fName], ['phone', fPhone], ['address', fAddr]])
    if (await loc.count()) await shot(page, 'f-' + n, { locator: loc, note: 'champ ' + n })

  await ctx.close()
}

// ------------------------------------------------------------- telephone 9:16
{
  const ctx = await browser.newContext({
    viewport: PHONE,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
    locale: 'fr-SN',
    timezoneId: 'Africa/Dakar',
    colorScheme: 'dark',
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36',
  })
  const page = await ctx.newPage()
  console.log('\n[telephone 430x932 @3x]')
  const routes = [
    ['m-home', '/'],
    ['m-selections', '/selections'],
    ['m-cart', '/panier'],
    ['m-form', '/commande'],
  ]
  for (const [name, path] of routes) {
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded' })
    await settle(page)
    await shot(page, name, { note: 'telephone ' + path })
  }
  const card = page.locator('main a[href^="/maillot/"]').first()
  const href = await card.getAttribute('href').catch(() => null)
  if (href) {
    await page.goto(BASE + href, { waitUntil: 'domcontentloaded' })
    await settle(page)
    await shot(page, 'm-product', { note: 'telephone, fiche produit' })
  }
  await ctx.close()
}

await browser.close()

const capturedAt = new Date().toISOString()
await writeFile(
  resolve(OUT, '../manifest.json'),
  JSON.stringify({ base: BASE, capturedAt, viewport: DESKTOP, shots: manifest }, null, 2),
)
await writeFile(resolve(OUT, '../geometry.json'), JSON.stringify(geometry, null, 2))

// Le film lit la geometrie a la compilation, pas au rendu : une capture qui
// manque doit casser le build, pas sortir un plan vide a la 400e frame.
await writeFile(
  resolve(import.meta.dirname, '../src/spot/geometry.ts'),
  [
    '/**',
    ' * Genere par `npm run capture` — ne pas editer a la main.',
    ' *',
    ' * La geometrie reelle de louyomb.com dans un cadrage ' + DESKTOP.width + 'x' + DESKTOP.height + ',',
    ' * relevee le ' + capturedAt.slice(0, 10) + '. Le curseur du spot vise ces boites : il',
    ' * clique la ou le bouton se trouve vraiment, et les pieces de l’interface',
    ' * volent a leur vraie place.',
    ' */',
    'export type Box = { x: number; y: number; w: number; h: number }',
    '',
    'export const SHOT = { w: ' + DESKTOP.width + ', h: ' + DESKTOP.height + ' } as const',
    '',
    'export const G = ' + JSON.stringify(geometry, null, 2) + ' as const',
    '',
  ].join('\n'),
)

console.log('\n' + manifest.length + ' captures -> assets/shots')
console.log('geometrie -> assets/geometry.json + src/spot/geometry.ts')
