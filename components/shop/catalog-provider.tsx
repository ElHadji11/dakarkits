'use client'

import { createContext, useContext, useMemo } from 'react'

import type { ShopProduct, ShopSettings } from '@/lib/shop-types'

type CatalogValue = {
  products: ShopProduct[]
  settings: ShopSettings
  byId: Map<number, ShopProduct>
}

const CatalogContext = createContext<CatalogValue | null>(null)

/**
 * The published catalogue, handed to the client once by the shop layout.
 *
 * It is what makes filtering, search, favourites and the cart instant on a 4G
 * phone: no round trip, one payload, already in the static shell. Holds up to
 * roughly 200 jerseys; past that, move filtering back to the server.
 */
export function CatalogProvider({
  products,
  settings,
  children,
}: {
  products: ShopProduct[]
  settings: ShopSettings
  children: React.ReactNode
}) {
  const value = useMemo<CatalogValue>(
    () => ({
      products,
      settings,
      byId: new Map(products.map((product) => [product.id, product])),
    }),
    [products, settings],
  )

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog(): CatalogValue {
  const value = useContext(CatalogContext)
  if (!value) throw new Error('useCatalog must be used inside CatalogProvider.')
  return value
}
