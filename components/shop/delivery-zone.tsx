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
 * « Ajouter ». Ils se déplient dans `BrtStationGrid`, là où on en a vraiment
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
 * Les 23 stations, telles qu'on les déplie.
 *
 * Rien qu'une liste dans une carte : c'est l'appelant qui décide quand elle se
 * montre et qui porte le bouton — sur le formulaire de commande, c'est un lien
 * dans la carte « Sur l'axe du BRT », la seule des deux où la question « suis-je
 * dedans ? » se pose. Un `<details>` autonome aurait coûté zéro octet de
 * JavaScript, mais son `<summary>` ne peut pas vivre dans le `<label>` d'une
 * carte à cocher sans en devenir la seconde ligne cliquable.
 *
 * Deux colonnes à partir de 640 px, trois au-delà : douze lignes au lieu de
 * vingt-trois, et huit quand la place est là.
 *
 * Numérotées dans l'ordre du trajet, de Petersen à Guédiawaye. C'est l'ordre
 * dans lequel on les cite ici, et celui dans lequel on les voit défiler.
 */
export function BrtStationGrid({ id, className }: { id?: string; className?: string }) {
  return (
    <div
      id={id}
      className={cn(
        'rounded-card border border-border p-4 text-sm text-muted-foreground',
        className,
      )}
    >
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs lg:grid-cols-3">
        {BRT_STATIONS.map((station, index) => (
          <li key={station}>
            <span className="tabular-nums text-muted-foreground/60">{index + 1}.</span> {station}
          </li>
        ))}
      </ul>
    </div>
  )
}
