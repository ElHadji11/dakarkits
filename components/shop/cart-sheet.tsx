'use client'

import { ShoppingBag } from 'lucide-react'
import Link from 'next/link'

import { CartLines } from '@/components/shop/cart-lines'
import { CartSummary } from '@/components/shop/cart-summary'
import { DeliveryZoneNotice } from '@/components/shop/delivery-zone'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useCartLines } from '@/hooks/use-cart-lines'

/** Mounted by CartButton on first tap, so nothing here loads before then. */
export function CartSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { lines, pricing, nudge } = useCartLines()
  const setOpen = onOpenChange

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Ton panier</SheetTitle>
          <SheetDescription>Paiement à la livraison, sur l’axe du BRT.</SheetDescription>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
            <ShoppingBag className="size-8 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">Ton panier est vide.</p>
            <Button asChild variant="outline" className="h-11" onClick={() => setOpen(false)}>
              <Link href="/">Voir les maillots</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4">
              <CartLines lines={lines} onNavigate={() => setOpen(false)} />
            </div>
            <SheetFooter className="gap-4 border-t border-border">
              <CartSummary pricing={pricing} nudge={nudge} />
              {/* Sous la ligne « Livraison : Gratuite », et pas ailleurs : le
                  panier est le dernier écran avant le formulaire, et le
                  récapitulatif de ‹ /commande › reprend déjà la notice sous le
                  champ adresse — la répéter là-bas la ferait lire deux fois sur
                  la même page. */}
              <DeliveryZoneNotice className="text-xs" />
              <Button asChild variant="cta" className="h-12 w-full" onClick={() => setOpen(false)}>
                <Link href="/commande">Commander</Link>
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
