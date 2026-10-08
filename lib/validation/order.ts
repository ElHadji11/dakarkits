import { z } from 'zod'

import { SIZES } from '@/lib/constants'

/**
 * Senegalese mobile: nine digits starting with 7, the +221 country code
 * optional. Stored as +2217XXXXXXXX so every number in the admin looks the
 * same and can be dialled or opened in WhatsApp as-is.
 */
export function normalisePhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, '').replace(/^\+/, '')
  const national = digits.startsWith('221') ? digits.slice(3) : digits
  if (!/^7\d{8}$/.test(national)) return null
  return `+221${national}`
}

export const phoneField = z
  .string()
  .trim()
  .transform((value, ctx) => {
    const normalised = normalisePhone(value)
    if (!normalised) {
      ctx.addIssue({
        code: 'custom',
        message: 'Numéro invalide. Neuf chiffres commençant par 7, par exemple 77 123 45 67.',
      })
      return z.NEVER
    }
    return normalised
  })

export const cartLineSchema = z.object({
  productId: z.coerce.number().int().positive(),
  size: z.enum(SIZES).nullable(),
  quantity: z.coerce.number().int().min(1).max(20),
})

export const attributionSchema = z.object({
  utmSource: z.string().trim().max(120).nullable().default(null),
  utmCampaign: z.string().trim().max(200).nullable().default(null),
  utmContent: z.string().trim().max(200).nullable().default(null),
  fbclid: z.string().trim().max(300).nullable().default(null),
})

export const orderSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, 'Ton nom est requis.')
    .max(120, 'Nom trop long.'),
  phone: phoneField,
  address: z
    .string()
    .trim()
    .min(8, 'Indique une adresse de livraison à Dakar.')
    .max(400, 'Adresse trop longue.'),
  lines: z.array(cartLineSchema).min(1, 'Ton panier est vide.').max(20),
  attribution: attributionSchema,
})

export type OrderInput = z.infer<typeof orderSchema>
