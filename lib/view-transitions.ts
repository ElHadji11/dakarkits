/**
 * Les noms et les types des transitions de vue — une seule source, parce que
 * c'est leur égalité exacte qui fait jouer l'effet.
 *
 * Un nom partagé est une promesse entre deux pages : la carte du catalogue et
 * la première photo de la fiche portent le même, et le navigateur fait glisser
 * l'une vers l'autre. Écrit à la main dans deux fichiers, une faute de frappe
 * d'un côté ne casse rien de visible — l'effet cesse simplement de jouer, sans
 * erreur. D'où ces fonctions plutôt que des gabarits recopiés.
 */

/**
 * Le nom de la photo d'un maillot, porté par la carte, la première photo de la
 * galerie et le bloc image de `ProductSkeleton`.
 *
 * Le slug et non l'`id` : le squelette est rendu avant que la fiche ait lu sa
 * base — il ne connaît que l'URL. Un slug sort de `slugify` (minuscules,
 * chiffres, tirets) et le préfixe empêche qu'il commence par un chiffre : c'est
 * donc toujours un identifiant CSS valide.
 *
 * **Deux éléments portant le même nom à l'écran annulent toute la
 * transition**, sans rien afficher en console. Un maillot ne doit donc
 * apparaître qu'une fois par page sous ce nom — voir `ProductGrid` et la
 * grille statique.
 */
export function kitPhotoName(slug: string): string {
  return `maillot-${slug}`
}

/** L'en-tête de la boutique et celui du tunnel : ancrés, ils ne glissent pas. */
export const HEADER_NAME = 'site-header'

/** La barre d'achat collée du bas de l'écran (fiche produit, page panier). */
export const BUY_BAR_NAME = 'barre-achat'

/**
 * Les deux sens de navigation, posés sur les liens par `transitionTypes`.
 *
 * Le sens n'est pas déduit, il est décidé lien par lien : on « avance » vers
 * un maillot, le panier, la commande ; on « revient » au catalogue par le logo
 * ou « Voir les maillots ». Les liens latéraux (onglets de catégorie, pages
 * légales) n'en portent aucun, et ne glissent pas.
 *
 * Le bouton retour du navigateur ne porte pas de type non plus : il ne glisse
 * pas, mais la photo partagée, elle, fait quand même son trajet.
 */
export const NAV_FORWARD = ['nav-forward']
export const NAV_BACK = ['nav-back']
