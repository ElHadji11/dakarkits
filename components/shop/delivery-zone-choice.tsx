'use client'

import { Check, MapPin, Truck } from 'lucide-react'

import { BrtStationList } from '@/components/shop/delivery-zone'
import { BRT_STATIONS, formatCfaRange, OUTSIDE_ZONE_FEE } from '@/lib/constants'
import type { DeliveryZone } from '@/lib/pricing'
import { cn } from '@/lib/utils'

/**
 * La question qui décide du total : « ton adresse est-elle sur l'axe du BRT ? »
 *
 * Deux cartes à cocher plutôt qu'une case. Une case cochée par défaut, c'est
 * une réponse que personne n'a donnée — et la mauvaise réponse ici se paie
 * devant la porte, livreur présent, colis ouvert. Deux cartes de même poids
 * posent une vraie question, montrent les deux prix côte à côte, et le total
 * du récapitulatif suit le doigt.
 *
 * Le défaut reste la zone : c'est le cas de la grande majorité des commandes
 * et la promesse affichée partout ailleurs sur le site. Ce qui le rattrape,
 * c'est la liste des 23 stations, dépliable juste en dessous, puis l'appel de
 * confirmation.
 *
 * Deux `<input type="radio">` natifs, pas un composant d'UI : le formulaire
 * les poste tout seul sous `deliveryZone`, ils sont navigables au clavier et
 * annoncés comme un groupe par un lecteur d'écran. Ils sont contrôlés par
 * React, donc une validation refusée ne les remet pas à zéro — la règle des
 * formulaires rejetés, que `submittedValues` applique aux champs texte.
 */
export function DeliveryZoneChoice({
  value,
  onChange,
}: {
  value: DeliveryZone
  onChange: (zone: DeliveryZone) => void
}) {
  return (
    <div className="space-y-2">
      <fieldset className="space-y-2">
        <legend className="sr-only">Zone de livraison</legend>

        <Option
          zone="brt"
          selected={value === 'brt'}
          onChange={onChange}
          icon={<MapPin className="size-5 shrink-0 text-primary" aria-hidden />}
          title="Sur l’axe du BRT"
          price="Gratuite"
          detail={`Les ${BRT_STATIONS.length} stations de la ligne, et environ 500 m autour de chacune.`}
        />

        <Option
          zone="outside"
          selected={value === 'outside'}
          onChange={onChange}
          icon={<Truck className="size-5 shrink-0 text-primary" aria-hidden />}
          title="Ailleurs dans Dakar"
          price={formatCfaRange(OUTSIDE_ZONE_FEE.min, OUTSIDE_ZONE_FEE.max)}
          detail="Selon la distance. Le montant exact est fixé pendant l’appel de confirmation, jamais au-dessus."
        />
      </fieldset>

      <BrtStationList />
    </div>
  )
}

function Option({
  zone,
  selected,
  onChange,
  icon,
  title,
  price,
  detail,
}: {
  zone: DeliveryZone
  selected: boolean
  onChange: (zone: DeliveryZone) => void
  icon: React.ReactNode
  title: string
  price: string
  detail: string
}) {
  return (
    /* `focus-within` et non une bague sur l'input : le rond natif est masqué,
       donc c'est la carte qui doit montrer le focus clavier. */
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-card border p-4 transition-colors',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background',
        selected ? 'border-primary bg-primary/10' : 'border-border hover:border-foreground/40',
      )}
    >
      <input
        type="radio"
        name="deliveryZone"
        value={zone}
        checked={selected}
        onChange={() => onChange(zone)}
        className="sr-only"
      />
      {selected ? <Check className="size-5 shrink-0 text-primary" aria-hidden /> : icon}
      <span className="min-w-0 flex-1 space-y-1">
        {/* `flex-wrap` et deux `whitespace-nowrap` : à 375 px, « 2 000 à 3 000 F »
            et « Ailleurs dans Dakar » ne tiennent pas sur la même ligne, et
            c'est le titre qui se cassait en deux. Le prix passe dessous, entier
            et lisible, plutôt qu'un intitulé coupé au milieu. */}
        <span className="flex flex-wrap items-baseline justify-between gap-x-3">
          <span className="whitespace-nowrap font-medium text-foreground">{title}</span>
          {/* Inter et `tabular-nums`, comme tout prix du site. */}
          <span className="whitespace-nowrap font-semibold tabular-nums text-primary">
            {price}
          </span>
        </span>
        <span className="block text-xs text-muted-foreground">{detail}</span>
      </span>
    </label>
  )
}
