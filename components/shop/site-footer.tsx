import Link from 'next/link'

import { Logo } from '@/components/shop/logo'
import type { ShopSettings } from '@/lib/shop-types'

/**
 * Pied de page de la boutique, présent sur toutes les pages — donc sur le
 * catalogue, dont le LCP se joue déjà sur le fil principal. Composant serveur,
 * aucun état, aucun gestionnaire d'événement : il n'ajoute pas un octet au
 * bundle client. Les animations sont en CSS (voir `.footer-reveal` dans
 * globals.css et les variantes `hover:` ci-dessous).
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

/** +221774354688 -> +221 77 435 46 88 */
function formatPhone(value: string): string {
  const groups = value.replace(/\D/g, '').match(/^221(\d{2})(\d{3})(\d{2})(\d{2})$/)
  return groups ? `+221 ${groups[1]} ${groups[2]} ${groups[3]} ${groups[4]}` : value
}

const LINKS = [
  { href: '/', label: 'Clubs' },
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
  return (
    <footer className="mt-10 bg-card">
      {/* Filet dégradé : la même séparation que `border-t`, en moins net. */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="footer-reveal mx-auto w-full max-w-6xl px-4">
        {/* Trois colonnes seulement à partir de 1024 px : à 768 la rangée de
            liens et le contact passent à la ligne et la mise en page se casse.
            En dessous, tout s'empile, centré. */}
        <div className="flex flex-col items-center gap-8 py-10 text-center lg:grid lg:grid-cols-3 lg:items-start lg:gap-8 lg:text-left">
          <div className="space-y-2 lg:justify-self-start">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 transition-transform duration-300 hover:scale-[1.03]"
            >
              <Logo className="h-6 w-auto transition-colors duration-300 group-hover:text-primary" />
              <span className="font-display text-2xl leading-none tracking-wide">DakarKits</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Paiement à la livraison · Livraison à Dakar
            </p>
            
          </div>

          <nav
            aria-label="Pied de page"
            className="flex flex-wrap items-center justify-center gap-x-6 lg:justify-self-center"
          >
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col items-center lg:items-end lg:justify-self-end">
            <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
              {CONTACT_EMAIL}
            </a>
            {settings.shopPhone ? (
              <a href={`tel:${settings.shopPhone}`} className={linkClass}>
                {formatPhone(settings.shopPhone)}
              </a>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 border-t border-border py-5 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
          <p className="flex flex-wrap items-center justify-center gap-x-2">
            <span>© {YEAR} DakarKits. Tous droits réservés.</span>
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className={fineClass}>
              Made by ElHadji
            </a>
          </p>
          <div className="flex items-center gap-5">
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
