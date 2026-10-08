import 'server-only'

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { settings, type Settings } from '@/lib/db/schema'

/** Single row, id = 1, created by the seed. */
export async function getSettings(): Promise<Settings> {
  const [row] = await db.select().from(settings).where(eq(settings.id, 1)).limit(1)
  if (!row) {
    throw new Error('Settings row 1 is missing. Run `npm run db:seed`.')
  }
  return row
}
