import 'server-only'

import { asc, eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { packTiers, settings, type Settings } from '@/lib/db/schema'
import type { PackTier } from '@/lib/pricing'

/** La ligne de réglages et le barème : ce qu'il faut pour chiffrer un panier. */
export type ShopConfig = Settings & { packTiers: PackTier[] }

/** Single row, id = 1, created by the seed. */
export async function getSettings(): Promise<ShopConfig> {
  const [[row], tiers] = await Promise.all([
    db.select().from(settings).where(eq(settings.id, 1)).limit(1),
    db.select().from(packTiers).orderBy(asc(packTiers.size)),
  ])

  if (!row) {
    throw new Error('Settings row 1 is missing. Run `npm run db:seed`.')
  }

  return { ...row, packTiers: tiers }
}
