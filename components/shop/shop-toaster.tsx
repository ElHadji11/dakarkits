'use client'

import dynamic from 'next/dynamic'

// Comme le panneau Filtres et le guide des tailles : sonner n'entre pas dans le
// paquet initial. `ssr: false` ne retarde pas le montage au premier clic — le
// morceau part dès l'hydratation, donc bien avant qu'un pouce arrive — mais il
// le sort du chemin critique du catalogue.
const Toaster = dynamic(() => import('@/components/ui/sonner').then((m) => m.Toaster), {
  ssr: false,
})

/**
 * Le `<Toaster>` de la boutique.
 *
 * Il n'existait **nulle part** côté public : seul `AdminShell` en montait un.
 * Tous les `toast()` de la boutique partaient donc dans le vide — vérifié le
 * 2026-10-15 sur louyomb.com, où « Ajouté au panier » n'apparaissait jamais
 * alors que la ligne entrait bien dans le panier.
 *
 * **En haut, et non en bas**, contrairement à la barre « Annuler » de Telegram :
 * la fiche produit et la page panier portent une barre d'achat `fixed` en bas
 * d'écran sur téléphone. Un toast au-dessus recouvrirait « Commander
 * maintenant », et le bouton « Annuler » tomberait à quelques pixels de
 * l'action qui engage l'achat. L'en-tête, lui, s'efface au défilement.
 *
 * Rendu par `(shop)` et `(checkout)`, jamais par `app/layout.tsx` : le layout
 * racine enveloppe aussi `/admin`, qui a déjà le sien — deux `<Toaster>`
 * afficheraient chaque message de l'admin en double.
 */
export function ShopToaster() {
  return <Toaster position="top-center" />
}
