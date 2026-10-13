import Link from 'next/link'

import { DeliveryZoneNotice } from '@/components/shop/delivery-zone'
import { Logo } from '@/components/shop/logo'
import { formatPhone } from '@/lib/constants'
import type { ShopSettings } from '@/lib/shop-types'

/**
 * Pied de page de la boutique, présent sur toutes les pages — donc sur le
 * catalogue, dont le LCP se joue déjà sur le fil principal. Composant serveur,
 * aucun état, aucun gestionnaire d'événement : il n'ajoute pas un octet au
 * bundle client. Les animations sont en CSS (voir `.footer-reveal` dans
 * globals.css et les variantes `hover:` ci-dessous).
 *
 * **Il faisait près de 500 px sur un téléphone.** Pas à cause de ses marges :
 * à cause de ses rangées. Cinq liens à 44 px qui passaient à la ligne deux
 * fois, puis l'e-mail et le téléphone l'un sous l'autre, faisaient à eux seuls
 * plus de 200 px. Chaque rangée tient maintenant sur une ligne, sans rien
 * perdre de la zone tactile : `gap-x-4` au lieu de `gap-x-6` suffit à faire
 * entrer les cinq libellés dans les 343 px d'un écran de 375.
 */

/** Figée à l'import, donc au build : `new Date()` pendant le rendu prérendu
 *  ferait sortir la page de la coquille statique. */
const YEAR = new Date().getFullYear()

/**
 * Adresse publique de la boutique, volontairement en dur. À ne pas confondre
 * avec `settings.orderEmail`, qui est la boîte où arrivent les notifications
 * de commande et ne doit jamais s'afficher sur le site.
 */
const CONTACT_EMAIL = 'contact@louyomb.com'
const INSTAGRAM_URL = 'https://instagram.com/babacar__thior'

const LINKS = [
  { href: '/', label: 'Tous' },
  { href: '/clubs', label: 'Clubs' },
  { href: '/selections', label: 'Sélections' },
  { href: '/retro', label: 'Rétro' },
  { href: '/favoris', label: 'Favoris' },
] as const

/**
 * Zone tactile de 44 px garantie, et le trait qui se déploie au survol.
 * `foreground/80` plutôt que `muted-foreground` : le contraste passe de 6,7:1
 * à 8,9:1 sur le fond des cartes, les liens cessent d'être délavés.
 */
const linkClass =
  'relative inline-flex min-h-11 items-center px-1 text-sm text-foreground/80 ' +
  'transition-colors duration-200 hover:text-foreground focus-visible:text-foreground ' +
  'after:pointer-events-none after:absolute after:inset-x-1 after:bottom-3 after:h-px ' +
  'after:origin-left after:scale-x-0 after:bg-current after:transition-transform ' +
  'after:duration-300 after:ease-out hover:after:scale-x-100 focus-visible:after:scale-x-100'

/** Barre du bas : même zone tactile de 44 px sur téléphone, supprimée dès que
 *  la rangée tient sur une ligne et qu'un pouce ne risque plus de se tromper. */
const fineClass =
  'inline-flex min-h-11 items-center transition-colors duration-200 hover:text-foreground sm:min-h-0'

export function SiteFooter({ settings }: { settings: ShopSettings }) {
  /**
   * Le numéro appelable. Si seul le WhatsApp est renseigné dans les réglages,
   * c'est lui qu'on affiche : un pied de page sans aucun moyen de joindre la
   * boutique est pire qu'un numéro qui n'est pas celui de la ligne fixe.
   */
  const phone = settings.shopPhone ?? settings.shopWhatsapp

  return (
    /* `footer-surface` (globals.css) : le dégradé démarre pile sur ce bord —
       son stop 0 % vaut `--background`, donc rien ne trahit la jointure — et
       descend vers le violet jusqu'au bas de la page. Il remplace l'ancien
       `bg-card` : le pied de page n'est plus une carte posée sur la page,
       c'est la page qui s'éteint dedans. */
    <footer className="footer-surface mt-8">
      {/* Filet dégradé : la même séparation que `border-t`, en moins net. Seul
          repère du haut du pied de page, maintenant que le fond est continu. */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="footer-reveal mx-auto w-full max-w-6xl px-4">
        {/* Trois colonnes seulement à partir de 1024 px : à 768 la rangée de
            liens et le contact passent à la ligne et la mise en page se casse.
            En dessous, tout s'empile, centré. */}
        <div className="flex flex-col items-center gap-6 py-6 text-center lg:grid lg:grid-cols-3 lg:items-start lg:gap-6 lg:text-left">
          <div className="space-y-2 lg:justify-self-start">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 transition-transform duration-300 hover:scale-[1.03]"
            >
              <Logo className="h-6 w-auto transition-colors duration-300 group-hover:text-primary" />
              <span className="font-display text-2xl leading-none tracking-wide">DakarKits</span>
            </Link>
            {/* La ligne « Paiement à la livraison · Livraison à Dakar » est
                partie d'ici : le bandeau de l'en-tête dit déjà exactement ça,
                sur toutes les pages, et la répéter coûtait 28 px au pied de
                page sans rien apprendre à personne.

                La notice de zone, elle, dit ce que le bandeau ne dit pas : où
                s'arrête le gratuit. Sans elle, un visiteur qui ne touche
                jamais une fiche produit ne lit nulle part les 23 stations ni
                les 500 m. C'est le seul endroit rendu sur toutes les pages du
                catalogue — et un pied de page est l'endroit où on va chercher
                une zone de livraison.

                Elle est alignée à gauche mais centrée dans la colonne : la
                pastille en début de flex, posée devant quatre lignes
                centrées, flottait toute seule dans la marge. */}
            <DeliveryZoneNotice className="mx-auto max-w-xs text-left text-xs text-foreground/80 lg:mx-0" />
          </div>

          {/* `flex-nowrap` : les cinq libellés tiennent dans 343 px avec
              `gap-x-4`. En `flex-wrap`, la rangée passait à la ligne deux fois
              et coûtait 88 px de pied de page sur un téléphone. */}
          <nav
            aria-label="Pied de page"
            className="flex flex-nowrap items-center justify-center gap-x-4 sm:gap-x-6 lg:justify-self-center"
          >
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass}>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* E-mail et téléphone côte à côte sous 1024 px : deux rangées de
              44 px l'une sous l'autre, c'était 44 px de pied de page pour
              rien. */}
          <div className="flex flex-row items-center justify-center gap-x-4 lg:flex-col lg:items-end lg:gap-x-0 lg:justify-self-end">
            <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
              {CONTACT_EMAIL}
            </a>
            {phone ? (
              /* `tel:` sur le numéro E.164 brut : avec les espaces que pose
                 `formatPhone`, Android ouvre le clavier sur un numéro
                 tronqué. L'affichage est formaté, le lien ne l'est pas. */
              <a href={`tel:${phone}`} className={linkClass}>
                {formatPhone(phone)}
              </a>
            ) : null}
          </div>
        </div>

        {/* `foreground/80` et non `muted-foreground` : cette rangée tombe sur
            le point le plus clair du dégradé (~oklch 0.44). `muted-foreground`
            y descendrait à 3:1, sous le seuil AA ; `foreground/80` tient 4,9:1.
            Même raison pour la bordure, qui suit le fond au lieu de `--border`,
            calculé lui pour une surface sombre et unie.

            `pb-24` sur téléphone : la barre d'achat collée en bas de la fiche
            produit fait 80 px, et elle recouvrait
            « Confidentialité » et « CGV » — les deux liens que la loi demande
            de pouvoir atteindre. 96 px et non 80 : à égalité, le lien touche
            le bord de la barre, et un pouce qui vise 2 px trop bas appuie sur
            « Commander ». Le pied de page porte cette garde au sol lui-même,
            au lieu de compter sur chaque page pour la lui donner — c'est la
            seule position qui marche, puisque la barre est `fixed` et flotte
            au-dessus du tout dernier pixel de la page. */}
        <div className="flex flex-col items-center gap-2 border-t border-foreground/10 pb-24 pt-4 text-center text-xs text-foreground/80 sm:flex-row sm:justify-between sm:pb-4 sm:text-left">
          <p className="flex flex-wrap items-center justify-center gap-x-2">
            {/* « Tous droits réservés » est une formule sans effet juridique —
                le droit d'auteur existe sans elle — et elle faisait passer la
                ligne sur deux rangées de 44 px sur un écran de 375. */}
            <span>© {YEAR} DakarKits</span>
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className={fineClass}>
              Made by ElHadji
            </a>
          </p>
          <div className="flex items-center gap-6">
            <Link href="/confidentialite" className={fineClass}>
              Confidentialité
            </Link>
            <Link href="/cgv" className={fineClass}>
              CGV
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
