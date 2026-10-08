'use server'

import { eq } from 'drizzle-orm'
import { refresh, updateTag } from 'next/cache'
import { z } from 'zod'

import { submittedValues, type ActionState } from '@/lib/action-state'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import { createSession, requireAdmin } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { adminUsers, settings } from '@/lib/db/schema'
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

const shopSchema = z
  .object({
    packEnabled: checkbox,
    packSize: z.coerce.number().int().min(2).max(10),
    packPrice: amount,
    shippingMode: z.enum(['fee', 'included']),
    shippingFee: amount,
    lowStockThreshold: z.coerce.number().int().min(0).max(100),
  })
  .refine((v) => !v.packEnabled || v.packPrice > 0, {
    path: ['packPrice'],
    error: 'Le prix du pack doit être supérieur à zéro.',
  })

const SHOP_FIELDS = ['packSize', 'packPrice', 'shippingFee', 'lowStockThreshold']

export async function saveShopSettings(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin()

  const parsed = shopSchema.safeParse({
    packEnabled: formData.get('packEnabled'),
    packSize: formData.get('packSize'),
    packPrice: formData.get('packPrice'),
    shippingMode: formData.get('shippingMode'),
    shippingFee: formData.get('shippingFee'),
    lowStockThreshold: formData.get('lowStockThreshold'),
  })
  if (!parsed.success) return flatten(parsed.error, submittedValues(formData, SHOP_FIELDS))

  await db
    .update(settings)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(settings.id, 1))

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
