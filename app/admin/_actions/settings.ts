'use server'

import { eq, notInArray, sql } from 'drizzle-orm'
import { refresh, updateTag } from 'next/cache'
import { z } from 'zod'

import { submittedValues, type ActionState } from '@/lib/action-state'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import { createSession, requireAdmin } from '@/lib/auth/session'
import { PACK_TIER_SIZES, packPriceField } from '@/lib/constants'
import { db } from '@/lib/db'
import { ladderIssues } from '@/lib/pricing'
import { adminUsers, packTiers, settings } from '@/lib/db/schema'
import { emailField } from '@/lib/validation/auth'
import { normalisePhone } from '@/lib/validation/order'

const checkbox = z.preprocess((v) => v === 'on' || v === 'true', z.boolean())
const amount = z.coerce.number().int().min(0).max(100_000_000)

const blankToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v)

const optionalPhone = z.preprocess(
  blankToNull,
  z
    .string()
    .nullable()
    .transform((value, ctx) => {
      if (value === null) return null
      const normalised = normalisePhone(value)
      if (!normalised) {
        ctx.addIssue({ code: 'custom', message: 'Numéro invalide (9 chiffres commençant par 7).' })
        return z.NEVER
      }
      return normalised
    }),
)

function flatten(error: z.ZodError, values: Record<string, string>): ActionState {
  const fieldErrors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form'
    fieldErrors[key] ??= issue.message
  }
  return { ok: false, error: error.issues[0]!.message, fieldErrors, values }
}

/* -------------------------------------------------------------- réglages --- */

/** Un prix de palier : vide = pas de pack de cette taille. */
const tierPrice = z.preprocess(
  blankToNull,
  z.union([z.coerce.number().int().min(1).max(100_000_000), z.null()]),
)

/**
 * Les prix de palier vivent à plat, sous le nom exact de leur champ
 * (`packPrice3`), parce que `flatten` fabrique les `fieldErrors` depuis le
 * chemin Zod : imbriqués, le message sortirait sous `tiers.3` et le formulaire
 * ne saurait pas à quel input l'accrocher.
 */
const shopSchema = z
  .object({
    packEnabled: checkbox,
    shippingMode: z.enum(['fee', 'included']),
    shippingFee: amount,
    lowStockThreshold: z.coerce.number().int().min(0).max(100),
    ...Object.fromEntries(PACK_TIER_SIZES.map((size) => [packPriceField(size), tierPrice])),
  })
  .superRefine((values, ctx) => {
    const active = activeTiers(values)

    if (values.packEnabled && active.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: [packPriceField(PACK_TIER_SIZES[0])],
        message: 'Renseigne au moins un prix de pack, ou décoche « Pack actif ».',
      })
      return
    }

    // Le barème doit se tenir debout de palier en palier — la règle vit avec
    // le calcul qu'elle protège, dans `lib/pricing`, et elle y est testée.
    for (const issue of ladderIssues(active)) {
      ctx.addIssue({ code: 'custom', path: [packPriceField(issue.size)], message: issue.message })
    }
  })

/** Les paliers renseignés, du plus petit au plus grand. */
function activeTiers(values: Record<string, unknown>): Array<{ size: number; price: number }> {
  return PACK_TIER_SIZES.flatMap((size) => {
    const price = values[packPriceField(size)]
    return typeof price === 'number' ? [{ size, price }] : []
  })
}

const SHOP_FIELDS = [
  ...PACK_TIER_SIZES.map((size) => packPriceField(size)),
  'shippingFee',
  'lowStockThreshold',
]

export async function saveShopSettings(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin()

  const parsed = shopSchema.safeParse({
    packEnabled: formData.get('packEnabled'),
    shippingMode: formData.get('shippingMode'),
    shippingFee: formData.get('shippingFee'),
    lowStockThreshold: formData.get('lowStockThreshold'),
    ...Object.fromEntries(
      PACK_TIER_SIZES.map((size) => [packPriceField(size), formData.get(packPriceField(size))]),
    ),
  })
  if (!parsed.success) return flatten(parsed.error, submittedValues(formData, SHOP_FIELDS))

  const { packEnabled, shippingMode, shippingFee, lowStockThreshold } = parsed.data
  const kept = activeTiers(parsed.data)

  // Une transaction, parce que le barème passe par deux ordres : un palier
  // effacé et l'autre réécrit laisseraient une seconde la boutique à un prix
  // que personne n'a choisi.
  await db.transaction(async (tx) => {
    await tx
      .update(settings)
      .set({ packEnabled, shippingMode, shippingFee, lowStockThreshold, updatedAt: new Date() })
      .where(eq(settings.id, 1))

    // Un prix vidé supprime son palier : il n'y a rien à conserver dans une
    // ligne sans prix, contrairement aux tailles d'un maillot.
    await tx.delete(packTiers).where(
      kept.length > 0
        ? notInArray(
            packTiers.size,
            kept.map((tier) => tier.size),
          )
        : sql`true`,
    )

    if (kept.length > 0) {
      await tx
        .insert(packTiers)
        .values(kept)
        .onConflictDoUpdate({ target: packTiers.size, set: { price: sql`excluded.price` } })
    }
  })

  // The shop reads these amounts from a cached shell; both tags must go.
  updateTag('settings')
  updateTag('catalog')
  refresh()
  return { ok: true, error: null }
}

/* ---------------------------------------------------------------- profil --- */

const profileSchema = z.object({
  shopPhone: optionalPhone,
  shopWhatsapp: optionalPhone,
  orderEmail: z.preprocess(blankToNull, z.union([emailField, z.null()])),
  telegramChatId: z.preprocess(
    blankToNull,
    z
      .string()
      .trim()
      .regex(/^-?\d{1,20}$/, 'Identifiant Telegram invalide (chiffres uniquement).')
      .nullable(),
  ),
})

const PROFILE_FIELDS = ['shopPhone', 'shopWhatsapp', 'orderEmail', 'telegramChatId']

export async function saveProfile(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin()

  const parsed = profileSchema.safeParse({
    shopPhone: formData.get('shopPhone'),
    shopWhatsapp: formData.get('shopWhatsapp'),
    orderEmail: formData.get('orderEmail'),
    telegramChatId: formData.get('telegramChatId'),
  })
  if (!parsed.success) return flatten(parsed.error, submittedValues(formData, PROFILE_FIELDS))

  await db
    .update(settings)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(settings.id, 1))

  updateTag('settings')
  refresh()
  return { ok: true, error: null }
}

/* ----------------------------------------------------------- identifiants --- */

const credentialsSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mot de passe actuel requis.'),
    email: emailField,
    newPassword: z.preprocess(
      blankToNull,
      z.string().min(10, 'Au moins 10 caractères.').nullable(),
    ),
    confirmPassword: z.preprocess(blankToNull, z.string().nullable()),
  })
  .refine((v) => v.newPassword === null || v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    error: 'Les deux mots de passe ne correspondent pas.',
  })

export async function saveCredentials(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireAdmin()

  const parsed = credentialsSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    email: formData.get('email'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  })
  if (!parsed.success) return flatten(parsed.error, submittedValues(formData, ['email']))

  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, session.id)).limit(1)
  if (!user) return { ok: false, error: 'Compte introuvable.' }

  // Changing your own login always costs your current password.
  if (!(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
    return {
      ok: false,
      error: 'Mot de passe actuel incorrect.',
      fieldErrors: { currentPassword: 'Mot de passe actuel incorrect.' },
    }
  }

  const changed =
    parsed.data.email !== user.email || parsed.data.newPassword !== null
  if (!changed) return { ok: true, error: null }

  // Bumping the version invalidates every session signed with the old one,
  // including any still open on another device.
  const tokenVersion = user.tokenVersion + 1

  await db
    .update(adminUsers)
    .set({
      email: parsed.data.email,
      passwordHash: parsed.data.newPassword
        ? await hashPassword(parsed.data.newPassword)
        : user.passwordHash,
      tokenVersion,
      updatedAt: new Date(),
    })
    .where(eq(adminUsers.id, user.id))

  // Re-issue this device's cookie so the admin is not logged out of the very
  // screen they just used.
  await createSession({ id: user.id, email: parsed.data.email, tokenVersion })

  refresh()
  return { ok: true, error: null }
}
