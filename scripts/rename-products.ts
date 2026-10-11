/**
 * Reprend les titres déjà en base au format unique « Club · Domicile 2026/27 ».
 *
 *   npx tsx scripts/rename-products.ts          # liste, n'écrit rien
 *   npx tsx scripts/rename-products.ts --write  # applique
 *
 * **Pourquoi un script alors que l'affichage compose déjà le nom.**
 * `productName` (lib/shop-types) rend le bon nom quelle que soit la valeur de
 * `products.title`, donc la boutique est déjà cohérente à l'écran sans rien
 * réécrire. Mais `title` ne sert pas qu'à l'affichage : il part dans le
 * `haystack` de la recherche, dans les lignes de commande figées, dans les
 * notifications Telegram et sur l'écran d'administration. Un catalogue où la
 * carte dit « FC Barcelone · Domicile 2026/27 » et le bon de commande
 * « Barcelona » est un catalogue dont on doute.
 *
 * **Ce qu'il ne touche pas :**
 *
 *   - Les slugs. Ce sont des URL : déjà partagées sur WhatsApp, déjà dans le
 *     sitemap, déjà dans des publicités. Les renommer casse des liens vivants
 *     pour un gain nul — personne ne lit un slug.
 *   - Les maillots sans équipe liée. Il n'y a rien à reconstruire : leur titre
 *     saisi à la main est la seule source de leur nom.
 *   - Les lignes de commande déjà passées. Une facture dit ce qui a été vendu
 *     ce jour-là, pas ce que le catalogue raconte aujourd'hui.
 *
 * **Après l'écriture**, la boutique est prérendue : il faut un `updateTag`
 * pour la rafraîchir, et un script hors Next n'en émet pas. Enregistrer
 * n'importe quoi depuis /admin/réglages le fait, ou un redémarrage de
 * `next dev` en développement.
 */
import { config } from 'dotenv'
import { eq, isNotNull } from 'drizzle-orm'

config({ path: '.env.local', quiet: true })

async function main() {
  const write = process.argv.includes('--write')

  // Importés après dotenv, pour que DATABASE_URL soit déjà dans l'environnement.
  const { db } = await import('../lib/db')
  const { products, teams } = await import('../lib/db/schema')
  const { composeName } = await import('../lib/shop-types')

  const rows = await db
    .select({
      id: products.id,
      title: products.title,
      season: products.season,
      kitType: products.kitType,
      teamName: teams.name,
    })
    .from(products)
    .innerJoin(teams, eq(products.teamId, teams.id))
    .where(isNotNull(products.teamId))
    .orderBy(products.id)

  const changes = rows.flatMap((row) => {
    const next = composeName(row.teamName, row.kitType, row.season)
    return next && next !== row.title ? [{ id: row.id, from: row.title, to: next }] : []
  })

  if (changes.length === 0) {
    console.log(`${rows.length} maillot(s) avec une équipe liée, tous déjà au format.`)
    return
  }

  for (const change of changes) {
    console.log(`#${change.id}  ${change.from}`)
    console.log(`         → ${change.to}`)
  }

  if (!write) {
    console.log('')
    console.log(`${changes.length} titre(s) à reprendre. Relance avec --write pour appliquer.`)
    return
  }

  // Une transaction : un catalogue à moitié renommé est le seul état pire que
  // celui de départ.
  await db.transaction(async (tx) => {
    for (const change of changes) {
      await tx.update(products).set({ title: change.to }).where(eq(products.id, change.id))
    }
  })

  console.log('')
  console.log(`${changes.length} titre(s) repris.`)
  console.log('La boutique est servie depuis le cache : enregistre n’importe quoi')
  console.log('dans /admin/réglages (ou redémarre `next dev`) pour que les')
  console.log('nouveaux titres apparaissent.')
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error)
    process.exit(1)
  },
)
