import { z } from 'zod'

import { SIZES } from '@/lib/constants'

/** An untouched <select> or a cleared text field arrives as "". Treat it as absent. */
const blankToNull = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? null : value

/** An unchecked checkbox is simply missing from FormData. */
export const checkbox = z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean())

const optionalText = (max: number) =>
  z.preprocess(blankToNull, z.string().trim().max(max).nullable())

const optionalId = z.preprocess(blankToNull, z.coerce.number().int().positive().nullable())

/** CFA francs. Integers only — never a float. */
const amount = z.coerce
  .number({ error: 'Montant invalide.' })
  .int('Le montant doit être un nombre entier de francs.')
  .min(0, 'Le montant ne peut pas être négatif.')
  .max(100_000_000)

const optionalAmount = z.preprocess(blankToNull, amount.nullable())

/* --------------------------------------------------------------- leagues --- */

export const leagueSchema = z.object({
  name: z.string().trim().min(2, 'Le nom est requis.').max(120),
  country: optionalText(80),
})

/* ----------------------------------------------------------------- teams --- */

export const teamSchema = z.object({
  name: z.string().trim().min(2, 'Le nom est requis.').max(120),
  type: z.enum(['club', 'national'], { error: 'Choisis club ou sélection.' }),
  leagueId: optionalId,
  logoUrl: optionalText(500),
  /** Comma-separated search aliases, e.g. "barca, fcb". */
  aliases: optionalText(300),
})

/* -------------------------------------------------------------- products --- */

export const imageInputSchema = z.object({
  url: z.httpUrl(),
  fileId: z.string().max(120).nullable().default(null),
  filePath: z.string().max(500).nullable().default(null),
  originalFilePath: z.string().max(500).nullable().default(null),
  bgRemoved: z.boolean().default(false),
})

export type ImageInput = z.infer<typeof imageInputSchema>

export const sizeInputSchema = z.object({
  size: z.enum(SIZES),
  available: z.boolean(),
  /** Null means no stock tracking at all: no count, no alert, no decrement. */
  quantity: z.number().int().min(0).nullable(),
})

export type SizeInput = z.infer<typeof sizeInputSchema>

export const productSchema = z
  .object({
    // Only these two are required. Everything else is optional by design.
    title: z.string().trim().min(2, 'Le titre est requis.').max(160),
    price: amount.refine((v) => v > 0, 'Le prix doit être supérieur à zéro.'),

    teamId: optionalId,
    season: optionalText(40),
    kitType: z.preprocess(blankToNull, z.enum(['home', 'away', 'third']).nullable()),
    description: optionalText(4000),
    compareAtPrice: optionalAmount,
    isRetro: checkbox,
    packEligible: checkbox,
    status: z.enum(['draft', 'published']),

    /** Empty array = jersey without sizes, orderable with no size picker. */
    sizes: z.array(sizeInputSchema).max(SIZES.length),
    images: z.array(imageInputSchema).max(12),
  })
  .refine((v) => v.compareAtPrice === null || v.compareAtPrice > v.price, {
    path: ['compareAtPrice'],
    error: 'Le prix barré doit être supérieur au prix.',
  })
  .refine((v) => v.status !== 'published' || v.images.length > 0, {
    path: ['images'],
    error: 'Il faut au moins une photo pour publier ce maillot.',
  })

export type ProductInput = z.infer<typeof productSchema>
