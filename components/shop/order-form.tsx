'use client'

import { ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { useActionState, useEffect, useRef } from 'react'

import { placeOrder } from '@/app/(shop)/commande/_actions/order'
import { CartLines } from '@/components/shop/cart-lines'
import { CartSummary } from '@/components/shop/cart-summary'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCartLines } from '@/hooks/use-cart-lines'
import { idle } from '@/lib/action-state'
import { trackInitiateCheckout } from '@/lib/pixel'
import { useAttribution } from '@/stores/attribution'

export function OrderForm() {
  const { hydrated, lines, pricing, settings, packCompareAt } = useCartLines()
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
    <form action={formAction} className="space-y-8 pb-28 sm:pb-8">
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
        <CartSummary pricing={pricing} settings={settings} packCompareAt={packCompareAt} />
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
            placeholder="Awa Diop"
            className="h-12"
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
            placeholder="77 123 45 67"
            className="h-12"
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
            placeholder="Quartier, rue, point de repère — Dakar"
            aria-invalid={Boolean(error('address'))}
          />
          <FieldError message={error('address')} />
        </div>
      </section>

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

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur sm:hidden">
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
