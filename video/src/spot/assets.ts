/** Genere par `npm run assets` — ne pas editer a la main. */
export type AssetName =
  | 'd-add-button'
  | 'd-added'
  | 'd-card'
  | 'd-cart-1-full'
  | 'd-cart-1'
  | 'd-cart-2-full'
  | 'd-cart-2'
  | 'd-confirm-button'
  | 'd-form-fields'
  | 'd-form-full'
  | 'd-form'
  | 'd-header'
  | 'd-home-full'
  | 'd-home'
  | 'd-pack'
  | 'd-product-full'
  | 'd-product-sized'
  | 'd-product'
  | 'd-search-barca'
  | 'd-search-listbox'
  | 'd-search-open'
  | 'd-sizes-picked'
  | 'd-sizes'
  | 'd-total'
  | 'f-address'
  | 'f-name'
  | 'f-phone'
  | 'm-cart'
  | 'm-form'
  | 'm-home'
  | 'm-selections'
  | 'p-card-1'
  | 'p-card-2'
  | 'p-card-3'
  | 'p-card-4'
  | 'p-card-5'
  | 'p-card-6'
  | 'p-card-7'
  | 'p-card-8'
  | 'p-count'
  | 'p-delivery'
  | 'p-icons-1'
  | 'p-icons'
  | 'p-logo'
  | 'p-nav'
  | 'p-order'
  | 'p-promo'
  | 'p-relance'
  | 'p-search'
  | 'p-tools'

export const ASSETS: Record<AssetName, { w: number; h: number }> = {
  'd-add-button': { w: 528, h: 96 },
  'd-added': { w: 3840, h: 2160 },
  'd-card': { w: 542, h: 642 },
  'd-cart-1-full': { w: 1920, h: 1080 },
  'd-cart-1': { w: 3840, h: 2160 },
  'd-cart-2-full': { w: 1920, h: 1080 },
  'd-cart-2': { w: 3840, h: 2160 },
  'd-confirm-button': { w: 2240, h: 96 },
  'd-form-fields': { w: 3840, h: 2160 },
  'd-form-full': { w: 1920, h: 1518 },
  'd-form': { w: 3840, h: 2160 },
  'd-header': { w: 3840, h: 172 },
  'd-home-full': { w: 1920, h: 3043 },
  'd-home': { w: 3840, h: 2160 },
  'd-pack': { w: 426, h: 34 },
  'd-product-full': { w: 1920, h: 1080 },
  'd-product-sized': { w: 3840, h: 2160 },
  'd-product': { w: 3840, h: 2160 },
  'd-search-barca': { w: 3840, h: 2160 },
  'd-search-listbox': { w: 1740, h: 132 },
  'd-search-open': { w: 3840, h: 2160 },
  'd-sizes-picked': { w: 1080, h: 152 },
  'd-sizes': { w: 1080, h: 152 },
  'd-total': { w: 640, h: 74 },
  'f-address': { w: 2240, h: 128 },
  'f-name': { w: 2240, h: 96 },
  'f-phone': { w: 2240, h: 96 },
  'm-cart': { w: 1290, h: 2796 },
  'm-form': { w: 1290, h: 2796 },
  'm-home': { w: 1290, h: 2796 },
  'm-selections': { w: 1290, h: 2796 },
  'p-card-1': { w: 542, h: 678 },
  'p-card-2': { w: 542, h: 678 },
  'p-card-3': { w: 542, h: 678 },
  'p-card-4': { w: 542, h: 678 },
  'p-card-5': { w: 542, h: 678 },
  'p-card-6': { w: 542, h: 678 },
  'p-card-7': { w: 542, h: 678 },
  'p-card-8': { w: 542, h: 678 },
  'p-count': { w: 144, h: 40 },
  'p-delivery': { w: 3840, h: 58 },
  'p-icons-1': { w: 184, h: 88 },
  'p-icons': { w: 184, h: 88 },
  'p-logo': { w: 268, h: 48 },
  'p-nav': { w: 2240, h: 96 },
  'p-order': { w: 640, h: 96 },
  'p-promo': { w: 3840, h: 72 },
  'p-relance': { w: 540, h: 80 },
  'p-search': { w: 1738, h: 88 },
  'p-tools': { w: 2240, h: 88 },
}
