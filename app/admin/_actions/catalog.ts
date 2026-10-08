'use server'

import { and, eq, ne } from 'drizzle-orm'
import { refresh, updateTag } from 'next/cache'
import { redirect } from 'next/navigation'

import { submittedValues, type ActionState } from '@/lib/action-state'
import { requireAdmin } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { leagues, orderItems, productImages, productSizes, products, teams } from '@/lib/db/schema'
import {
  bakeBackgroundRemoved,
  isConfigured,
  isOwnUrl,
  uploadAuthParams,
  urlEndpoint,
} from '@/lib/imagekit'
import { uniqueSlug } from '@/lib/slug'
import {
  imageInputSchema,
  leagueSchema,
  productSchema,
  sizeInputSchema,
  teamSchema,
} from '@/lib/validation/catalog'
import { z } from 'zod'

function fail(
  error: string,
  fieldErrors?: Record<string, string>,
  values?: Record<string, string>,
): ActionState {
  return { ok: false, error, fieldErrors, values }
}

function flatten(error: z.ZodError, values?: Record<string, string>): ActionState {
  const fieldErrors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form'
    fieldErrors[key] ??= issue.message
  }
  return fail(error.issues[0]?.message ?? 'Formulaire invalide.', fieldErrors, values)
}

const LEAGUE_FIELDS = ['name', 'country']
const TEAM_FIELDS = ['name', 'aliases', 'logoUrl']
const PRODUCT_FIELDS = ['title', 'price', 'compareAtPrice', 'season', 'description']

/** The shop caches its catalogue under this tag; the admin never caches. */
function revalidateCatalog() {
  updateTag('catalog')
}

/* --------------------------------------------------------------- leagues --- */

export async function saveLeague(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin()

  const parsed = leagueSchema.safeParse({
    name: formData.get('name'),
    country: formData.get('country'),
  })
  if (!parsed.success) return flatten(parsed.error, submittedValues(formData, LEAGUE_FIELDS))

  const id = Number(formData.get('id')) || null
  const slug = await uniqueSlug(parsed.data.name, async (candidate) => {
    const rows = await db
      .select({ id: leagues.id })
      .from(leagues)
      .where(id ? and(eq(leagues.slug, candidate), ne(leagues.id, id)) : eq(leagues.slug, candidate))
      .limit(1)
    return rows.length > 0
  })

  if (id) {
    await db.update(leagues).set({ ...parsed.data, slug }).where(eq(leagues.id, id))
  } else {
    await db.insert(leagues).values({ ...parsed.data, slug })
  }

  revalidateCatalog()
  refresh()
  return { ok: true, error: null }
}

export async function deleteLeague(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = Number(formData.get('id'))
  if (!Number.isInteger(id)) return

  // Teams keep existing; their league simply becomes empty.
  await db.delete(leagues).where(eq(leagues.id, id))
  revalidateCatalog()
  refresh()
}

/* ----------------------------------------------------------------- teams --- */

export async function saveTeam(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin()

  const parsed = teamSchema.safeParse({
    name: formData.get('name'),
    type: formData.get('type'),
    leagueId: formData.get('leagueId'),
    logoUrl: formData.get('logoUrl'),
    aliases: formData.get('aliases'),
  })
  if (!parsed.success) return flatten(parsed.error, submittedValues(formData, TEAM_FIELDS))

  // A national selection belongs to no league.
  const leagueId = parsed.data.type === 'national' ? null : parsed.data.leagueId

  const id = Number(formData.get('id')) || null
  const slug = await uniqueSlug(parsed.data.name, async (candidate) => {
    const rows = await db
      .select({ id: teams.id })
      .from(teams)
      .where(id ? and(eq(teams.slug, candidate), ne(teams.id, id)) : eq(teams.slug, candidate))
      .limit(1)
    return rows.length > 0
  })

  if (id) {
    await db.update(teams).set({ ...parsed.data, leagueId, slug }).where(eq(teams.id, id))
  } else {
    await db.insert(teams).values({ ...parsed.data, leagueId, slug })
  }

  revalidateCatalog()
  refresh()
  return { ok: true, error: null }
}

/**
 * Called from inside the product form, where a nested <form> is impossible.
 * Returns the new row so the select can pick it straight away.
 */
export async function quickCreateTeam(input: {
  name: string
  type: 'club' | 'national'
  leagueId: number | null
}): Promise<{ id: number; name: string } | { error: string }> {
  await requireAdmin()

  const parsed = teamSchema.safeParse({ ...input, logoUrl: null, aliases: null })
  if (!parsed.success) return { error: parsed.error.issues[0]!.message }

  const leagueId = parsed.data.type === 'national' ? null : parsed.data.leagueId
  const slug = await uniqueSlug(parsed.data.name, async (candidate) => {
    const rows = await db.select({ id: teams.id }).from(teams).where(eq(teams.slug, candidate)).limit(1)
    return rows.length > 0
  })

  const [created] = await db
    .insert(teams)
    .values({ ...parsed.data, leagueId, slug })
    .returning({ id: teams.id, name: teams.name })

  revalidateCatalog()
  return created!
}

export async function deleteTeam(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = Number(formData.get('id'))
  if (!Number.isInteger(id)) return

  // Products keep existing; they simply lose their team.
  await db.delete(teams).where(eq(teams.id, id))
  revalidateCatalog()
  refresh()
}

/* ---------------------------------------------------------------- photos --- */

export type PreparedImage = {
  originalUrl: string
  originalFilePath: string
  fileId: string | null
  /** Null when background removal failed or the monthly quota is spent. */
  cutoutUrl: string | null
  cutoutFilePath: string | null
  cutoutFileId: string | null
}

/**
 * Called right after the browser uploads the original, so the admin sees the
 * cut-out before saving. Baking here (rather than at save time) is also what
 * keeps the preview free: it reuses the one file we already paid for.
 */
export async function prepareImage(originalFilePath: string): Promise<PreparedImage> {
  await requireAdmin()

  const path = originalFilePath.replace(/^\/+/, '')
  const originalUrl = `${urlEndpoint()}/${path}`
  const baked = await bakeBackgroundRemoved(path)

  return {
    originalUrl,
    originalFilePath: path,
    fileId: null,
    cutoutUrl: baked?.url ?? null,
    cutoutFilePath: baked?.filePath ?? null,
    cutoutFileId: baked?.fileId ?? null,
  }
}

export async function imagekitReady(): Promise<boolean> {
  await requireAdmin()
  return isConfigured()
}

/**
 * Short-lived upload credentials for the browser. A Server Action rather than a
 * route handler: it is a POST by construction, so it never risks being
 * prerendered, and there is one less public endpoint to guard.
 */
export async function uploadAuth(): Promise<{
  publicKey: string
  token: string
  expire: number
  signature: string
}> {
  await requireAdmin()
  if (!isConfigured()) throw new Error('ImageKit n’est pas configuré.')

  return {
    publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
    ...uploadAuthParams(),
  }
}

/* -------------------------------------------------------------- products --- */

function readSizes(formData: FormData) {
  // An absent "hasSizes" means: this jersey has no sizes at all. We then write
  // zero rows, which is what makes the shop skip the size picker entirely.
  if (formData.get('hasSizes') !== 'on') return []

  const raw = formData.get('sizes')
  if (typeof raw !== 'string' || raw === '') return []
  return z.array(sizeInputSchema).parse(JSON.parse(raw))
}

function readImages(formData: FormData) {
  const raw = formData.get('images')
  if (typeof raw !== 'string' || raw === '') return []

  const parsed = z.array(imageInputSchema).parse(JSON.parse(raw))
  // Never trust a URL the browser hands us: it has to be on our own endpoint.
  return parsed.filter((image) => isOwnUrl(image.url))
}

export async function saveProduct(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin()

  let sizes: ReturnType<typeof readSizes>
  let images: ReturnType<typeof readImages>
  try {
    sizes = readSizes(formData)
    images = readImages(formData)
  } catch {
    return fail(
      'Les tailles ou les photos sont illisibles. Recharge la page et réessaie.',
      undefined,
      submittedValues(formData, PRODUCT_FIELDS),
    )
  }

  const parsed = productSchema.safeParse({
    title: formData.get('title'),
    price: formData.get('price'),
    teamId: formData.get('teamId'),
    season: formData.get('season'),
    kitType: formData.get('kitType'),
    description: formData.get('description'),
    compareAtPrice: formData.get('compareAtPrice'),
    isRetro: formData.get('isRetro'),
    packEligible: formData.get('packEligible'),
    status: formData.get('status'),
    sizes,
    images,
  })
  if (!parsed.success) return flatten(parsed.error, submittedValues(formData, PRODUCT_FIELDS))

  const input = parsed.data
  const id = Number(formData.get('id')) || null
  const primaryIndex = Math.min(Math.max(Number(formData.get('primaryIndex')) || 0, 0), Math.max(input.images.length - 1, 0))

  const slug = await uniqueSlug(input.title, async (candidate) => {
    const rows = await db
      .select({ id: products.id })
      .from(products)
      .where(
        id ? and(eq(products.slug, candidate), ne(products.id, id)) : eq(products.slug, candidate),
      )
      .limit(1)
    return rows.length > 0
  })

  const columns = {
    title: input.title,
    price: input.price,
    teamId: input.teamId,
    season: input.season,
    kitType: input.kitType,
    description: input.description,
    compareAtPrice: input.compareAtPrice,
    isRetro: input.isRetro,
    packEligible: input.packEligible,
    status: input.status,
  }

  const productId = await db.transaction(async (tx) => {
    let target = id

    if (target) {
      await tx
        .update(products)
        .set({ ...columns, slug, updatedAt: new Date() })
        .where(eq(products.id, target))
    } else {
      const [created] = await tx.insert(products).values({ ...columns, slug }).returning({ id: products.id })
      target = created!.id
    }

    // Photos are replaced wholesale: the form always sends the full list in the
    // order the admin arranged them.
    await tx.delete(productImages).where(eq(productImages.productId, target))
    if (input.images.length > 0) {
      await tx.insert(productImages).values(
        input.images.map((image, index) => ({
          productId: target!,
          url: image.url,
          fileId: image.fileId,
          filePath: image.filePath,
          originalFilePath: image.originalFilePath,
          position: index,
          isPrimary: index === primaryIndex,
          bgRemoved: image.bgRemoved,
        })),
      )
    }

    // Sizes are replaced too, but unchecking keeps the row (available = false)
    // so the shop can tell "no sizes" apart from "sold out".
    await tx.delete(productSizes).where(eq(productSizes.productId, target))
    if (input.sizes.length > 0) {
      await tx.insert(productSizes).values(
        input.sizes.map((size) => ({
          productId: target!,
          size: size.size,
          available: size.available,
          quantity: size.quantity,
        })),
      )
    }

    return target!
  })

  revalidateCatalog()
  redirect(`/admin/produits/${productId}?enregistre=1`)
}

/**
 * A product with orders is never deleted — past orders must keep pointing at
 * it. It is unpublished instead.
 */
export async function removeProduct(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = Number(formData.get('id'))
  if (!Number.isInteger(id)) return

  const [ordered] = await db
    .select({ id: orderItems.id })
    .from(orderItems)
    .where(eq(orderItems.productId, id))
    .limit(1)

  if (ordered) {
    await db
      .update(products)
      .set({ status: 'draft', updatedAt: new Date() })
      .where(eq(products.id, id))
    revalidateCatalog()
    redirect('/admin/produits?depublie=1')
  }

  await db.delete(products).where(eq(products.id, id))
  revalidateCatalog()
  redirect('/admin/produits?supprime=1')
}
