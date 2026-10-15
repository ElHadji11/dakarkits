'use client'

import { ChevronDown, ShoppingBag, Truck, Wallet } from 'lucide-react'
import Link from 'next/link'
import { useActionState, useEffect, useRef, useState } from 'react'

import { placeOrder } from '@/app/(checkout)/commande/_actions/order'
import { CartLines } from '@/components/shop/cart-lines'
import { CartSummary } from '@/components/shop/cart-summary'
import { DeliveryZoneChoice } from '@/components/shop/delivery-zone-choice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DELIVERY_ETA, formatCfaRange } from '@/lib/constants'
import type { DeliveryZone } from '@/lib/pricing'
import { useCatalog } from '@/components/shop/catalog-provider'
import { paymentPromise, type ShopSettings } from '@/lib/shop-types'
import { useCartLines } from '@/hooks/use-cart-lines'
import { idle } from '@/lib/action-state'
import { trackInitiateCheckout } from '@/lib/pixel'
import { useAttribution } from '@/stores/attribution'
import { cn } from '@/lib/utils'
import { NAV_BACK } from '@/lib/view-transitions'

/**
 * Un placeholder doit se lire comme un exemple, pas comme une valeur déjà
 * saisie. « Awa Diop » et « 77 123 45 67 » tels quels avaient l'air d'un
 * formulaire prérempli, et `placeholder:text-muted-foreground` n'y suffit pas
 * en thème sombre : à oklch 0,72 contre 0,92 pour le texte réel, l'écart est
 * trop faible. D'où le préfixe « Ex : » *et* l'opacité réduite — un seul des
 * deux laissait le doute.
 */
const placeholderClass = 'placeholder:text-muted-foreground/60'

/**
 * Le tunnel, en deux colonnes à partir de 1024 px et en une seule en dessous.
 *
 * Ce qu'on demande à gauche, ce qu'on paie à droite — et la carte de droite
 * est collée (`lg:sticky`), donc le total et le bouton restent sous les yeux
 * pendant qu'on remplit l'adresse. En une seule colonne, le récapitulatif
 * poussait les champs plusieurs centaines de pixels plus bas, et le bouton
 * n'était jamais visible en même temps que le montant.
 *
 * Sur téléphone, la même carte redevient ce qu'elle doit être : un en-tête
 * repliable — « 2 maillots · 13 000 F » — qu'on ouvre pour vérifier, et une
 * barre collée en bas qui porte le total et le bouton. Le récapitulatif reste
 * en haut (`order-first`) parce que c'est le rappel de ce qu'on achète, mais
 * replié il ne coûte qu'une ligne.
 *
 * Le repli est un `useState` et non un `<details>` : la même carte doit être
 * dépliée d'office à partir de `lg`, et l'attribut `open` d'un `<details>` ne
 * se pilote pas au point d'arrêt. Deux arbres — un `<details>` pour le
 * téléphone, une carte pour le bureau — auraient dupliqué `CartLines`, donc
 * les boutons de quantité, en double dans le DOM.
 */
export function OrderForm() {
  /* La zone déclarée vit ici, pas dans le panier : elle ne concerne que cette
     page, et un panier qui retiendrait « hors zone » d'une commande à l'autre
     facturerait la livraison à qui a déménagé entre-temps. Le défaut est la
     zone, comme la vitrine l'annonce partout. */
  const [zone, setZone] = useState<DeliveryZone>('brt')
  const [summaryOpen, setSummaryOpen] = useState(false)
  const { hydrated, lines, pricing, nudge, count } = useCartLines(zone)
  const { settings } = useCatalog()
  const attribution = useAttribution()
  const [state, formAction, pending] = useActionState(placeOrder, idle)

  const kept = (field: string, fallback = '') => state.values?.[field] ?? fallback
  const error = (field: string) => state.fieldErrors?.[field]

  /* Un seul `InitiateCheckout` par passage sur cette page — pas un par rendu,
     et pas deux sous StrictMode : la ref survit au remontage.

     Le total envoyé est le plancher (`pricing.total`), celui de la zone BRT,
     et non le plafond hors zone. C'est le montant que le client a sous les yeux
     au moment où il ouvre le formulaire, avant d'avoir déclaré sa zone — et un
     événement qui annoncerait d'office le haut de l'intervalle surévaluerait
     chaque panier. L'achat, lui, portera le total réellement enregistré. */
  const reported = useRef(false)
  useEffect(() => {
    if (reported.current || lines.length === 0) return
    reported.current = true
    trackInitiateCheckout(
      lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
      pricing.total,
    )
  }, [lines, pricing.total])

  if (!hydrated) {
    return <div className="h-96 animate-pulse rounded-lg bg-muted" aria-hidden />
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <ShoppingBag className="size-10 text-muted-foreground" aria-hidden />
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Ton panier est vide</h1>
          <p className="text-sm text-muted-foreground">
            Ajoute un maillot avant de passer commande.
          </p>
        </div>
        <Button asChild className="h-12">
          <Link href="/" transitionTypes={NAV_BACK}>Voir les maillots</Link>
        </Button>
      </div>
    )
  }

  const payload = JSON.stringify(
    lines.map((line) => ({
      productId: line.productId,
      size: line.size,
      quantity: line.quantity,
    })),
  )

  const total = formatCfaRange(pricing.total, pricing.totalMax)

  return (
    <form action={formAction} className="mx-auto w-full max-w-[1100px] pb-24 lg:pb-8">
      <input type="hidden" name="lines" value={payload} />
      <input type="hidden" name="utmSource" value={attribution.utmSource ?? ''} />
      <input type="hidden" name="utmCampaign" value={attribution.utmCampaign ?? ''} />
      <input type="hidden" name="utmContent" value={attribution.utmContent ?? ''} />
      <input type="hidden" name="fbclid" value={attribution.fbclid ?? ''} />

      {/* Trap: off-screen, not hidden, so a bot filling every field gives itself away. */}
      <div aria-hidden className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
        <label htmlFor="website">Ne remplis pas ce champ</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Ta commande</h1>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* La carte des montants : première sur téléphone, à droite au bureau.
            Elle est donc en tête du DOM — l'ordre qui compte au clavier et au
            lecteur d'écran, celui du téléphone — et c'est le placement explicite
            (`col-start-2`, `row-start-1`) qui la renvoie à droite au bureau. */}
        <aside className="lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1">
          <div className="rounded-card border border-border">
            {/* « 2 maillots · 13 000 F ▾ ». Toute la phrase dans un seul enfant
                du flex, sinon le `gap-3` s'insère au milieu. */}
            <button
              type="button"
              onClick={() => setSummaryOpen((open) => !open)}
              aria-expanded={summaryOpen}
              aria-controls="order-summary"
              className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left text-sm font-medium lg:hidden"
            >
              <span>
                {count === 1 ? '1 maillot' : `${count} maillots`} ·{' '}
                <span className="tabular-nums">{total}</span>
              </span>
              <ChevronDown
                className={cn(
                  'size-4 shrink-0 text-muted-foreground transition-transform',
                  summaryOpen && 'rotate-180',
                )}
                aria-hidden
              />
            </button>

            <div
              id="order-summary"
              className={cn(
                'space-y-4 p-4 lg:block lg:border-t-0',
                summaryOpen ? 'block border-t border-border' : 'hidden',
              )}
            >
              <h2 className="hidden text-sm font-medium text-muted-foreground lg:block">
                Récapitulatif
              </h2>
              <CartLines lines={lines} />
              <CartSummary pricing={pricing} nudge={nudge} />

              {/* Au bureau, le bouton est dans la carte, juste sous le total :
                  il n'y a pas de barre collée pour le porter, et un bouton en
                  bas de la colonne de gauche aurait été à 600 px du montant
                  qu'il engage. */}
              <Button
                type="submit"
                variant="cta"
                disabled={pending}
                className="hidden h-12 w-full lg:flex"
              >
                {pending ? 'Enregistrement…' : 'Confirmer ma commande'}
              </Button>

              <Reassurance settings={settings} className="hidden lg:block" />
            </div>
          </div>
        </aside>

        <div className="space-y-8 lg:col-start-1 lg:row-start-1">
          <section className="space-y-4">
            {/* Un titre de section, pas un intitulé de champ : il doit se lire
                au-dessus des `<Label>` et non comme le premier d'entre eux. */}
            <h2 className="text-lg font-semibold tracking-tight">Où te livrer</h2>

            {/* Nom et téléphone côte à côte : deux saisies courtes, une seule
                ligne de regard. L'adresse garde toute la largeur — c'est la
                seule saisie longue du formulaire. */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customerName">Nom complet</Label>
                <Input
                  id="customerName"
                  name="customerName"
                  required
                  autoComplete="name"
                  defaultValue={kept('customerName')}
                  placeholder="Ex : Awa Diop"
                  className={`h-12 ${placeholderClass}`}
                  aria-invalid={Boolean(error('customerName'))}
                />
                <FieldError message={error('customerName')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  defaultValue={kept('phone')}
                  placeholder="Ex : 77 123 45 67"
                  className={`h-12 ${placeholderClass}`}
                  aria-invalid={Boolean(error('phone'))}
                />
                <p className="text-xs text-muted-foreground">
                  Le livreur t’appelle sur ce numéro.
                </p>
                <FieldError message={error('phone')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse de livraison</Label>
              <Textarea
                id="address"
                name="address"
                required
                rows={2}
                autoComplete="street-address"
                defaultValue={kept('address')}
                placeholder="Ex : Sacré-Cœur 3, villa 123, près de la station Sacré-Cœur"
                className={placeholderClass}
                aria-invalid={Boolean(error('address'))}
              />
              <FieldError message={error('address')} />
            </div>
          </section>

          {/* Juste après l'adresse, et avant le bouton : c'est le dernier écran où
              une adresse hors zone peut encore être déclarée. Plus tard, elle se
              rattrape au téléphone — ou à la porte, devant le livreur. */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">Zone de livraison</h2>
            <DeliveryZoneChoice value={zone} onChange={setZone} />
            <FieldError message={error('deliveryZone')} />
          </section>

          {state.error ? (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          {/* Sur téléphone, les deux phrases qui lèvent l'hésitation ferment la
              page, au-dessus de la barre collée. Au bureau, elles sont sous le
              bouton, dans la carte. */}
          <Reassurance settings={settings} className="lg:hidden" />
        </div>
      </div>

      {/* La barre collée du téléphone porte le total *et* le bouton : la carte
          du haut peut rester repliée sans qu'on perde le montant de vue. */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-4 border-t border-border bg-background/95 p-4 backdrop-blur lg:hidden">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">À payer à la livraison</p>
          <p className="truncate text-base font-semibold tabular-nums">{total}</p>
        </div>
        <Button type="submit" variant="cta" disabled={pending} className="h-12 flex-1">
          {pending ? 'Enregistrement…' : 'Confirmer'}
        </Button>
      </div>
    </form>
  )
}

/**
 * « Rien à payer maintenant » et le délai : les deux phrases qui lèvent
 * l'hésitation au moment de valider. Rendues deux fois, à deux endroits
 * différents selon la largeur — c'est du texte statique, aucun nœud
 * interactif en double.
 */
function Reassurance({
  settings,
  className,
}: {
  settings: ShopSettings
  className?: string
}) {
  return (
    <ul className={cn('space-y-2 text-sm text-muted-foreground', className)}>
      <li className="flex items-center gap-2">
        <Wallet className="size-4 shrink-0 text-primary" aria-hidden />
        Rien à payer maintenant : {paymentPromise(settings)} à la livraison.
      </li>
      <li className="flex items-center gap-2">
        <Truck className="size-4 shrink-0 text-primary" aria-hidden />
        {DELIVERY_ETA}. On t&apos;appelle pour confirmer.
      </li>
    </ul>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  )
}
