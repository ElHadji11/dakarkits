'use client'

import { Heart } from 'lucide-react'
import Link from 'next/link'

import { CartButton } from '@/components/shop/cart-button'
import { Logo } from '@/components/shop/logo'
import { SearchBox } from '@/components/shop/search-box'
import { Button } from '@/components/ui/button'
import { useHydrated } from '@/hooks/use-hydrated'
import { useFavorites } from '@/stores/favorites'

export function SiteHeader() {
  const hydrated = useHydrated()
  const favorites = useFavorites((state) => state.ids.length)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
        {/* Le monogramme est `aria-hidden` : le nom accessible du lien vient du
            texte, et vaut donc « DakarKits » sans qu'il faille un aria-label. */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Logo className="h-6 w-auto" />
          {/* Bebas n'a qu'une graisse : `font-semibold` n'aurait rien donné.
              Capitales condensées, donc `tracking-wide` pour les aérer. */}
          <span className="font-display text-2xl leading-none tracking-wide">DakarKits</span>
        </Link>

        <div className="ml-2 hidden flex-1 sm:flex">
          <SearchBox />
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Button asChild variant="ghost" size="icon" className="relative size-11">
            <Link href="/favoris" aria-label="Favoris">
              <Heart className="size-5" aria-hidden />
              {hydrated && favorites > 0 ? (
                <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold tabular-nums text-primary-foreground">
                  {favorites}
                </span>
              ) : null}
            </Link>
          </Button>
          <CartButton />
        </div>
      </div>

      <div className="px-4 pb-3 sm:hidden">
        <SearchBox />
      </div>
    </header>
  )
}
