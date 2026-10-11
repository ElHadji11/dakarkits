import Link from 'next/link'

import { Logo } from '@/components/shop/logo'

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
    <header className="border-b border-border">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-center px-4">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-6 w-auto" />
          <span className="font-display text-2xl leading-none tracking-wide">DakarKits</span>
        </Link>
      </div>
    </header>
  )
}
