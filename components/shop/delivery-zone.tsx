import { MapPin } from 'lucide-react'

import { BRT_STATIONS, DELIVERY_ZONE_NOTICE, DELIVERY_ZONE_OUTSIDE } from '@/lib/constants'
import { cn } from '@/lib/utils'

/**
 * La notice de zone : les deux terminus du BRT, ses 23 stations, le rayon, et
 * ce que coûte une adresse en dehors.
 *
 * Elle existe parce que la phrase courte ne suffit plus. « Livraison gratuite
 * partout à Dakar » n'avait rien à préciser ; « sur tout l'axe du BRT » tient
 * dans un bandeau mais laisse le client deviner s'il est dedans — et, s'il
 * n'y est pas, s'il peut commander quand même. La notice répond aux deux une
 * fois, au même endroit du texte, partout où la question se pose : sur la
 * fiche au moment de choisir la taille, dans le panier avant de commander,
 * au pied de page, et sur la commande.
 *
 * Les 23 noms ne sont pas ici : une liste de stations au milieu d'une fiche
 * produit, c'est douze lignes à faire défiler au-dessus du bouton
 * « Ajouter ». Ils se déplient dans `BrtStationList`, là où on en a vraiment
 * besoin — au moment de déclarer sa zone — et ils sont énumérés dans les CGV.
 *
 * `withOutside` tombe à `false` au seul endroit où le prix d'en dehors est
 * déjà affiché en toutes lettres : le choix de zone du formulaire de
 * commande, et le récapitulatif qui en découle.
 */
export function DeliveryZoneNotice({
  withOutside = true,
  className,
}: {
  withOutside?: boolean
  className?: string
}) {
  return (
    <p className={cn('flex items-start gap-2 text-sm text-muted-foreground', className)}>
      <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
      {/* Toute la phrase dans un seul enfant du flex : un segment sorti à nu y
          deviendrait un élément flex de plus, donc 8 px de gouttière au milieu
          d'une phrase. */}
      <span>
        {DELIVERY_ZONE_NOTICE}
        {withOutside ? ` ${DELIVERY_ZONE_OUTSIDE}` : null}
      </span>
    </p>
  )
}

/**
 * Les 23 stations, repliées.
 *
 * Un `<details>` natif : zéro octet de JavaScript, et il s'ouvre même si
 * l'hydratation n'est pas encore passée — ce qui compte, puisque la question
 * « suis-je dans la zone ? » se pose au moment précis où l'on remplit le
 * formulaire. Deux colonnes : douze lignes au lieu de vingt-trois.
 *
 * Numérotées dans l'ordre du trajet, de Petersen à Guédiawaye. C'est l'ordre
 * dans lequel on les cite ici, et celui dans lequel on les voit défiler.
 */
export function BrtStationList({ className }: { className?: string }) {
  return (
    <details
      className={cn(
        'rounded-card border border-border px-4 text-sm text-muted-foreground',
        className,
      )}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center font-medium text-foreground">
        Voir les {BRT_STATIONS.length} stations
      </summary>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1 pb-4 text-xs">
        {BRT_STATIONS.map((station, index) => (
          <li key={station}>
            <span className="tabular-nums text-muted-foreground/60">{index + 1}.</span> {station}
          </li>
        ))}
      </ul>
    </details>
  )
}
