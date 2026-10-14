'use client'

/**
 * Le seul endroit d'où le Pixel Meta est appelé. Les composants passent des
 * francs et des identifiants ; la devise, la conversion, la mise en forme des
 * `contents` et la déduplication se décident ici.
 *
 * **Tout appel est inoffensif.** Trois protections, parce qu'un bloqueur de
 * publicité est le cas normal et non l'exception :
 *
 *   1. `NEXT_PUBLIC_META_PIXEL_ID` absent : `meta-pixel.tsx` ne rend rien,
 *      `window.fbq` n'existe pas, et le `?.` ci-dessous ne fait rien.
 *   2. `fbevents.js` bloqué mais le snippet exécuté : `fbq` existe en file
 *      d'attente, les appels s'y empilent et personne ne les lit. Sans erreur.
 *   3. Snippet lui-même bloqué, ou extension qui remplace `fbq` par quelque
 *      chose qui lève : le `try/catch` de `send()` avale tout.
 *
 * Aucune de ces fonctions ne doit jamais faire tomber une page qui vend.
 */

import { eurFromCfa } from '@/lib/money'

type Fbq = (...args: unknown[]) => void

/** Un maillot tel que Meta veut le lire dans `contents`. */
export type PixelItem = {
  productId: number
  quantity: number
}

function fbq(): Fbq | null {
  if (typeof window === 'undefined') return null
  return (window as unknown as { fbq?: Fbq }).fbq ?? null
}

/**
 * L'appel, et le filet. Une extension qui monkey-patche `fbq` peut lever :
 * c'est son problème, pas celui du tunnel de commande.
 */
function send(...args: unknown[]): void {
  try {
    fbq()?.(...args)
  } catch {
    // Mesure perdue, page intacte. C'est le bon sens de l'échange.
  }
}

/**
 * Les champs communs à tous les événements de valeur.
 *
 * `currency` est **toujours** EUR, et `value` toujours converti : voir
 * `lib/money.ts`. Meta ne sait pas lire le XOF, donc un événement en francs est
 * un événement sans valeur.
 */
function payload(francs: number, items: PixelItem[]) {
  return {
    content_type: 'product',
    content_ids: items.map((item) => String(item.productId)),
    contents: items.map((item) => ({ id: String(item.productId), quantity: item.quantity })),
    num_items: items.reduce((total, item) => total + item.quantity, 0),
    currency: 'EUR',
    value: eurFromCfa(francs),
  }
}

/**
 * Une vue de page.
 *
 * Le snippet de base ne la déclenche plus lui-même : c'est `PixelPageView` qui
 * l'envoie, au premier rendu comme à chaque navigation. Deux raisons de ne pas
 * la laisser dans le snippet : la boutique navigue côté client, donc une seule
 * vue serait comptée pour toute la visite ; et si le snippet la déclenchait
 * *aussi*, le premier chargement en compterait deux.
 */
export function trackPageView(): void {
  send('track', 'PageView')
}

export function trackViewContent(productId: number, name: string, francs: number): void {
  send('track', 'ViewContent', {
    ...payload(francs, [{ productId, quantity: 1 }]),
    content_name: name,
  })
}

/**
 * Un maillot mis au panier. La taille choisie part dans `content_name` : c'est
 * ce qui distingue deux ajouts du même maillot dans Events Manager, et
 * `contents` n'a pas de champ standard pour une taille.
 */
export function trackAddToCart(
  productId: number,
  name: string,
  size: string | null,
  francs: number,
): void {
  send('track', 'AddToCart', {
    ...payload(francs, [{ productId, quantity: 1 }]),
    content_name: size ? `${name} · taille ${size}` : name,
  })
}

export function trackInitiateCheckout(items: PixelItem[], francs: number): void {
  send('track', 'InitiateCheckout', payload(francs, items))
}

/**
 * L'achat, une fois la commande enregistrée — jamais au chargement d'une page.
 *
 * Deux choses s'y jouent.
 *
 * `eventId` doit être **exactement** celui que le serveur envoie à l'API de
 * conversions (`purchase_<numéro>`), sinon la même vente est comptée deux fois.
 * C'est aussi lui qui protège du rafraîchissement : Meta déduplique sur cet
 * identifiant, et `PurchaseEvent` refuse en plus de le renvoyer.
 *
 * `phone` est de la correspondance avancée, et elle compte plus ici que partout
 * ailleurs : on encaisse à la livraison, donc il n'y a ni email, ni paiement en
 * ligne, ni compte client. Le numéro est à peu près le seul signal qui permette
 * à Meta de rattacher la vente à la personne qui a vu la publicité. Il part en
 * chiffres, indicatif 221 compris, et **c'est le Pixel qui le hache** — rien
 * n'est envoyé en clair. Ni le nom, ni l'adresse ne sortent d'ici.
 */
export function trackPurchase(
  eventId: string,
  items: PixelItem[],
  francs: number,
  phone: string | null,
): void {
  const digits = phone?.replace(/\D/g, '')
  if (digits) {
    // Ré-`init` avec les données utilisateur : c'est la façon documentée de
    // fournir la correspondance avancée quand elle n'est connue qu'après le
    // chargement. Le même identifiant, donc le même pixel, pas un second.
    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
    if (pixelId) send('init', pixelId, { ph: digits })
  }

  send('track', 'Purchase', payload(francs, items), { eventID: eventId })
}
