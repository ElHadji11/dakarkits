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
  | 'm-add-button'
  | 'm-added'
  | 'm-cart-full'
  | 'm-cart'
  | 'm-confirm-button'
  | 'm-form-bottom'
  | 'm-form-fields'
  | 'm-form-full'
  | 'm-form'
  | 'm-header-1'
  | 'm-home-full'
  | 'm-home'
  | 'm-product-full'
  | 'm-product-pick'
  | 'm-product-picked'
  | 'm-product'
  | 'm-search-barca'
  | 'm-search-listbox'
  | 'm-search-open'
  | 'm-selections'
  | 'm-sizes-picked'
  | 'm-sizes'
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
  'd-card': { w: 536, h: 696 },
  'd-cart-1-full': { w: 1920, h: 1080 },
  'd-cart-1': { w: 3840, h: 2160 },
  'd-cart-2-full': { w: 1920, h: 1080 },
  'd-cart-2': { w: 3840, h: 2160 },
  'd-confirm-button': { w: 2240, h: 96 },
  'd-form-fields': { w: 3840, h: 2160 },
  'd-form-full': { w: 1920, h: 1311 },
  'd-form': { w: 3840, h: 2160 },
  'd-header': { w: 3840, h: 164 },
  'd-home-full': { w: 1920, h: 3734 },
  'd-home': { w: 3840, h: 2160 },
  'd-pack': { w: 446, h: 34 },
  'd-product-full': { w: 1920, h: 1396 },
  'd-product-sized': { w: 3840, h: 2160 },
  'd-product': { w: 3840, h: 2160 },
  'd-search-barca': { w: 3840, h: 2160 },
  'd-search-listbox': { w: 1740, h: 132 },
  'd-search-open': { w: 3840, h: 2160 },
  'd-sizes-picked': { w: 1088, h: 256 },
  'd-sizes': { w: 1088, h: 256 },
  'd-total': { w: 640, h: 74 },
  'f-address': { w: 2240, h: 128 },
  'f-name': { w: 2240, h: 96 },
  'f-phone': { w: 2240, h: 96 },
  'm-add-button': { w: 144, h: 144 },
  'm-added': { w: 1290, h: 2796 },
  'm-cart-full': { w: 1290, h: 3603 },
  'm-cart': { w: 1290, h: 2796 },
  'm-confirm-button': { w: 1194, h: 144 },
  'm-form-bottom': { w: 1290, h: 2796 },
  'm-form-fields': { w: 1290, h: 2796 },
  'm-form-full': { w: 1290, h: 3564 },
  'm-form': { w: 1290, h: 2796 },
  'm-header-1': { w: 1290, h: 378 },
  'm-home-full': { w: 1290, h: 5706 },
  'm-home': { w: 1290, h: 2796 },
  'm-product-full': { w: 1290, h: 5712 },
  'm-product-pick': { w: 1290, h: 2796 },
  'm-product-picked': { w: 1290, h: 2796 },
  'm-product': { w: 1290, h: 2796 },
  'm-search-barca': { w: 1290, h: 2796 },
  'm-search-listbox': { w: 1194, h: 198 },
  'm-search-open': { w: 1290, h: 2796 },
  'm-selections': { w: 1290, h: 2796 },
  'm-sizes-picked': { w: 1194, h: 384 },
  'm-sizes': { w: 1194, h: 384 },
  'p-card-1': { w: 536, h: 736 },
  'p-card-2': { w: 536, h: 736 },
  'p-card-3': { w: 536, h: 736 },
  'p-card-4': { w: 536, h: 736 },
  'p-card-5': { w: 536, h: 424 },
  'p-card-6': { w: 536, h: 424 },
  'p-card-7': { w: 536, h: 424 },
  'p-card-8': { w: 536, h: 424 },
  'p-count': { w: 144, h: 40 },
  'p-delivery': { w: 3840, h: 50 },
  'p-icons-1': { w: 184, h: 88 },
  'p-icons': { w: 184, h: 88 },
  'p-logo': { w: 268, h: 48 },
  'p-nav': { w: 2240, h: 96 },
  'p-order': { w: 640, h: 96 },
  'p-promo': { w: 3840, h: 72 },
  'p-relance': { w: 524, h: 80 },
  'p-search': { w: 1738, h: 88 },
  'p-tools': { w: 2240, h: 88 },
}
