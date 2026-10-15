'use client'

/**
 * Dix millisecondes de vibration sur les appuis qui engagent.
 *
 * C'est la règle n° 2 de Telegram (PLAN-FLUIDITE.md) : un appui répond avant
 * même que l'action ait lieu. Sur un téléphone il n'y a pas de survol, donc le
 * retour au doigt est tout ce qu'il reste — et une vibration part dans la
 * milliseconde, là où une animation attend la prochaine image.
 *
 * **Trois moments, et nulle part ailleurs** : la taille choisie, l'ajout au
 * panier (les deux boutons de la fiche y ajoutent, « Commander maintenant »
 * compris), la commande envoyée. Un téléphone qui bourdonne à chaque tap
 * fatigue, et la vibration cesse alors de vouloir dire « c'est pris ».
 *
 * `navigator.vibrate` n'existe pas sur iOS Safari, qui ne l'implémente pas du
 * tout. C'est donc une amélioration progressive : le parc visé est très
 * majoritairement Android, et les autres ne perdent rien de ce qu'ils avaient.
 *
 * Coupée sous `prefers-reduced-motion`, comme tout le reste du dépôt. La
 * préférence est relue à chaque appel plutôt que mise en cache : elle suit
 * alors le réglage du système sans rechargement, et un `matchMedia` par appui
 * ne coûte rien à côté de ce que fait le clic lui-même.
 *
 * À n'appeler que depuis un gestionnaire d'événement : sans geste de
 * l'utilisateur les navigateurs refusent l'appel, et Chrome l'écrit en
 * console.
 */
export function tap() {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  navigator.vibrate(10)
}
