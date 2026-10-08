/**
 * Creates the single admin account and the settings row.
 * Idempotent: run it as often as you like.
 *
 *   npm run db:seed
 */
import { config } from 'dotenv'
import { eq } from 'drizzle-orm'

config({ path: '.env.local', quiet: true })

/**
 * Avec quoi une boutique neuve démarre — les valeurs réellement en service au
 * 2026-10-08.
 *
 * Les quatre dernières comptent plus qu'elles n'en ont l'air : le schéma les
 * laisse nulles, et `notifyNewOrder` saute l'envoi avec un simple
 * `console.warn` quand `orderEmail` ou `telegramChatId` manquent. Une base de
 * production fraîchement migrée accepterait donc des commandes **sans qu'une
 * seule alerte ne parte**, sans la moindre erreur visible.
 *
 * Pack, livraison et seuil ont déjà ces valeurs par défaut au schéma. Elles
 * sont répétées ici pour que ce bloc dise à lui seul avec quoi on démarre.
 */
const SHOP_DEFAULTS = {
  packEnabled: true,
  packSize: 2,
  packPrice: 13_000,
  shippingMode: 'fee',
  shippingFee: 1_000,
  lowStockThreshold: 2,
  shopPhone: '+221774354688',
  shopWhatsapp: '+221774354688',
  orderEmail: 'babacar.thior19@gmail.com',
  telegramChatId: '8622372610',
} as const

/** Les champs dont l'absence casse quelque chose en silence. */
const CRITICAL = ['orderEmail', 'telegramChatId', 'shopPhone', 'shopWhatsapp'] as const

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.SEED_ADMIN_PASSWORD

  if (!email || !password) {
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required in .env.local')
  }
  if (password.length < 10) {
    throw new Error('SEED_ADMIN_PASSWORD must be at least 10 characters.')
  }

  // Imported after dotenv so DATABASE_URL is already in the environment.
  const { db } = await import('../lib/db')
  const { adminUsers, settings } = await import('../lib/db/schema')
  const { hashPassword } = await import('../lib/auth/password')

  const [existing] = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1)

  if (existing) {
    console.log(`admin: ${email} already exists, password left untouched`)
  } else {
    await db.insert(adminUsers).values({ email, passwordHash: await hashPassword(password) })
    console.log(`admin: created ${email}`)
  }

  const [settingsRow] = await db
    .insert(settings)
    .values({ id: 1, ...SHOP_DEFAULTS })
    .onConflictDoNothing()
    .returning()

  if (settingsRow) {
    console.log('settings: created row 1 with the launch defaults')
  } else {
    // La ligne existe : on ne réécrit rien, un réglage changé dans l'admin ne
    // doit pas être écrasé par un seed. Mais un champ vide ne se remarque que
    // le jour où une commande n'arrive pas — alors on le dit tout de suite.
    const [current] = await db.select().from(settings).limit(1)
    const missing = CRITICAL.filter((field) => !current?.[field])
    console.log('settings: row 1 already exists, left untouched')
    if (missing.length > 0) {
      console.warn(
        `settings: ATTENTION — ${missing.join(', ')} non renseigné(s).\n` +
          '  À remplir dans /admin/profil : sans eux, aucune alerte de commande ne part.',
      )
    }
  }

  console.log('seed: done')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
