'use client'

import { ShoppingBag, Truck, Wallet } from 'lucide-react'
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
import { DELIVERY_ETA } from '@/lib/constants'
import type { DeliveryZone } from '@/lib/pricing'
import { useCatalog } from '@/components/shop/catalog-provider'
import { paymentPromise } from '@/lib/shop-types'
import { useCartLines } from '@/hooks/use-cart-lines'
import { idle } from '@/lib/action-state'
import { trackInitiateCheckout } from '@/lib/pixel'
import { useAttribution } from '@/stores/attribution'

/**
 * Un placeholder doit se lire comme un exemple, pas comme une valeur déjà
 * saisie. « Awa Diop » et « 77 123 45 67 » tels quels avaient l'air d'un
 * formulaire prérempli, et `placeholder:text-muted-foreground` n'y suffit pas
 * en thème sombre : à oklch 0,72 contre 0,92 pour le texte réel, l'écart est
 * trop faible. D'où le préfixe « Ex : » *et* l'opacité réduite — un seul des
 * deux laissait le doute.
 */
const placeholderClass = 'placeholder:text-muted-foreground/60'

export function OrderForm() {
  /* La zone déclarée vit ici, pas dans le panier : elle ne concerne que cette
     page, et un panier qui retiendrait « hors zone » d'une commande à l'autre
     facturerait la livraison à qui a déménagé entre-temps. Le défaut est la
     zone, comme la vitrine l'annonce partout. */
  const [zone, setZone] = useState<DeliveryZone>('brt')
  const { hydrated, lines, pricing, nudge } = useCartLines(zone)
  const { settings } = useCatalog()
  const attribution = useAttribution()
  const [state, formAction, pending] = useActionState(placeOrder, idle)

  const kept = (field: string, fallback = '') => state.values?.[field] ?? fallback
  const error = (field: string) => state.fieldErrors?.[field]

  // One InitiateCheckout per visit to this page, not one per re-render.
  const reported = useRef(false)
  useEffect(() => {
    if (reported.current || lines.length === 0) return
    reported.current = true
    trackInitiateCheckout(
      lines.map((line) => line.productId),
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
          <Link href="/">Voir les maillots</Link>
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

  return (
    <form action={formAction} className="space-y-6 pb-24 sm:pb-8">
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

      <h1 className="text-2xl font-semibold tracking-tight">Ta commande</h1>

      <section className="space-y-4 rounded-lg border border-border p-4">
        <h2 className="text-sm font-medium text-muted-foreground">Récapitulatif</h2>
        <CartLines lines={lines} />
        <CartSummary pricing={pricing} nudge={nudge} />
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground">Où te livrer</h2>

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

        <div className="space-y-2">
          <Label htmlFor="address">Adresse de livraison</Label>
          <Textarea
            id="address"
            name="address"
            required
            rows={3}
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
        <h2 className="text-sm font-medium text-muted-foreground">Zone de livraison</h2>
        <DeliveryZoneChoice value={zone} onChange={setZone} />
        <FieldError message={error('deliveryZone')} />
      </section>

      {/* Ce qu'il y avait sous le champ adresse : rien. Le bouton collé doit
          garder 96 px de garde au sol, et ces 96 px se lisaient comme une page
          qui s'arrête trop tôt — au moment précis où on hésite à valider. Les
          deux phrases qui lèvent cette hésitation les occupent maintenant. */}
      <ul className="space-y-2 rounded-lg border border-border p-4 text-sm text-muted-foreground">
        <li className="flex items-center gap-2">
          <Wallet className="size-4 shrink-0 text-primary" aria-hidden />
          Rien à payer maintenant : {paymentPromise(settings)} à la livraison.
        </li>
        <li className="flex items-center gap-2">
          <Truck className="size-4 shrink-0 text-primary" aria-hidden />
          {DELIVERY_ETA}. On t&apos;appelle pour confirmer.
        </li>
      </ul>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <div className="hidden sm:block">
        <Button type="submit" variant="cta" disabled={pending} className="h-12 w-full">
          {pending ? 'Enregistrement…' : 'Confirmer ma commande'}
        </Button>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-4 backdrop-blur sm:hidden">
        <Button type="submit" variant="cta" disabled={pending} className="h-12 w-full">
          {pending ? 'Enregistrement…' : 'Confirmer ma commande'}
        </Button>
      </div>
    </form>
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
