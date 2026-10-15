import Link from 'next/link'

import { Logo } from '@/components/shop/logo'
import { HEADER_NAME, NAV_BACK } from '@/lib/view-transitions'

/**
 * L'en-tête du tunnel de commande : le mot-symbole, et rien.
 *
 * Pas de recherche, pas de favoris, pas de panier, pas de pied de page — c'est
 * tout l'objet du groupe de routes `(checkout)`. À partir du moment où le
 * formulaire est ouvert, chaque lien est une sortie : la recherche ramène au
 * catalogue, le pied de page propose cinq catégories, et un panier à moitié
 * rempli revient le lendemain au mieux. Ne reste que ce qui rassure — le nom
 * de la boutique, qui dit où on est — et le logo reste cliquable parce
 * qu'enfermer quelqu'un dans un formulaire est pire que de le laisser partir.
 *
 * Composant serveur : aucun JavaScript n'arrive ici pour afficher un logo.
 */
export function CheckoutHeader() {
  return (
    // Ancré comme celui de la boutique, et sous le même nom : voir `SiteHeader`.
    <header className="border-b border-border" style={{ viewTransitionName: HEADER_NAME }}>
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-center px-4">
        <Link href="/" transitionTypes={NAV_BACK} className="flex items-center gap-2">
          <Logo className="h-6 w-auto" />
          <span className="font-display text-2xl leading-none tracking-wide">DakarKits</span>
        </Link>
      </div>
    </header>
  )
}
