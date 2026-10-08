import type { UploaderImage } from '@/components/admin/image-uploader'
import type { ProductFormValues } from '@/components/admin/product-form'
import type { SizeRow } from '@/components/admin/size-editor'
import type { AdminProduct } from '@/lib/catalog'
import { SIZES } from '@/lib/constants'

export function emptyProductValues(): ProductFormValues {
  return {
    id: null,
    title: '',
    price: '',
    compareAtPrice: '',
    teamId: null,
    season: '',
    kitType: null,
    description: '',
    isRetro: false,
    packEligible: true,
    status: 'draft',
    // Most jerseys come in sizes, and all of them are in stock on day one.
    hasSizes: true,
    sizes: SIZES.map((size) => ({ size, available: true, quantity: '' })),
    images: [],
    primaryIndex: 0,
  }
}

export function toProductValues(product: AdminProduct, urlEndpoint: string): ProductFormValues {
  const rows: SizeRow[] = SIZES.map((size) => {
    const stored = product.sizes.find((row) => row.size === size)
    return {
      size,
      available: stored?.available ?? false,
      quantity: stored?.quantity === null || stored?.quantity === undefined ? '' : String(stored.quantity),
    }
  })

  const images: UploaderImage[] = product.images.map((image, index) => ({
    key: `${image.id}-${index}`,
    // When the stored file is the baked cut-out, the original is still in
    // ImageKit and reachable through the path we kept alongside it.
    originalUrl: image.originalFilePath
      ? `${urlEndpoint}/${image.originalFilePath.replace(/^\/+/, '')}`
      : image.url,
    originalFilePath: image.originalFilePath ?? image.filePath ?? '',
    cutoutUrl: image.bgRemoved ? image.url : null,
    cutoutFilePath: image.bgRemoved ? image.filePath : null,
    cutoutFileId: image.bgRemoved ? image.fileId : null,
    useCutout: image.bgRemoved,
  }))

  const primaryIndex = Math.max(
    product.images.findIndex((image) => image.isPrimary),
    0,
  )

  return {
    id: product.id,
    title: product.title,
    price: String(product.price),
    compareAtPrice: product.compareAtPrice === null ? '' : String(product.compareAtPrice),
    teamId: product.teamId,
    season: product.season ?? '',
    kitType: product.kitType,
    description: product.description ?? '',
    isRetro: product.isRetro,
    packEligible: product.packEligible,
    status: product.status,
    hasSizes: product.sizes.length > 0,
    sizes: rows,
    images,
    primaryIndex,
  }
}
