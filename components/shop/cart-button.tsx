'use client'

import { ShoppingBag } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { useCartLines } from '@/hooks/use-cart-lines'

// Radix's dialog and the whole cart panel only matter once the bag is tapped.
// Until then the header costs one button.
const CartSheet = dynamic(
  () => import('@/components/shop/cart-sheet').then((m) => m.CartSheet),
  { ssr: false },
)

export function CartButton() {
  const { hydrated, count } = useCartLines()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative size-11"
        aria-label={hydrated && count > 0 ? `Panier, ${count} article(s)` : 'Panier'}
        onClick={() => {
          setMounted(true)
          setOpen(true)
        }}
      >
        <ShoppingBag className="size-5" aria-hidden />
        {hydrated && count > 0 ? (
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold tabular-nums text-primary-foreground">
            {count}
          </span>
        ) : null}
      </Button>

      {mounted ? <CartSheet open={open} onOpenChange={setOpen} /> : null}
    </>
  )
}
