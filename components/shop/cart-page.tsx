'use client'

import { ShoppingBag } from 'lucide-react'
import Link from 'next/link'

import { CartLines } from '@/components/shop/cart-lines'
import { CartSummary } from '@/components/shop/cart-summary'
import { DeliveryZoneNotice } from '@/components/shop/delivery-zone'
import { Button } from '@/components/ui/button'
import { useCartLines } from '@/hooks/use-cart-lines'
import { shippingRange } from '@/lib/pricing'
import { BUY_BAR_NAME, NAV_BACK, NAV_FORWARD } from '@/lib/view-transitions'

export function CartPage() {
  const { hydrated, lines, pricing, nudge, settings } = useCartLines()

  if (!hydrated) {
    return <div className="h-64 animate-pulse rounded-lg bg-muted" aria-hidden />
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <ShoppingBag className="size-10 text-muted-foreground" aria-hidden />
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Ton panier est vide</h1>
          <p className="text-sm text-muted-foreground">
            Les maillots que tu ajoutes restent ici, même si tu fermes la page.
          </p>
        </div>
        <Button asChild className="h-12">
          <Link href="/" transitionTypes={NAV_BACK}>Voir les maillots</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24 sm:pb-6">
      <h1 className="text-2xl font-semibold tracking-tight">Mon panier</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <CartLines lines={lines} />

        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <CartSummary
            pricing={pricing}
            nudge={nudge}
            outsideFee={shippingRange(settings, 'outside')}
          />
          {/* Même place que dans le panneau du panier : juste sous la ligne
              « Livraison », avant le bouton. Sans le prix d'en dehors : le
              récapitulatif vient de l'annoncer en toutes lettres sous le
              total, et deux fois le même intervalle à trois lignes d'écart se
              lit comme deux frais qui s'ajoutent. */}
          <DeliveryZoneNotice withOutside={false} className="text-xs" />
          <Button asChild variant="cta" className="hidden h-12 w-full sm:flex">
            <Link href="/commande" transitionTypes={NAV_FORWARD}>Commander</Link>
          </Button>
        </div>
      </div>

      {/* Ancrée pendant les transitions de page — voir `ProductPurchase`. */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-4 backdrop-blur sm:hidden"
        style={{ viewTransitionName: BUY_BAR_NAME }}
      >
        {/* Même enfoncement que la barre de la fiche, `duration-150` compris :
            les deux barres portent le même nom de transition, elles se
            répondent, elles doivent répondre au doigt pareil. */}
        <Button asChild variant="cta" className="h-12 w-full duration-150 active:scale-[0.97]">
          <Link href="/commande" transitionTypes={NAV_FORWARD}>Commander</Link>
        </Button>
      </div>
    </div>
  )
}
